import Matter from 'matter-js';

const { Engine, Render, Runner, Composite, Events, Mouse, MouseConstraint } = Matter;

export class EngineSetup {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = Engine.create();
        this.world = this.engine.world;
        
        // 낙하 속도 약 30% 감속 (관망하기 좋게 만들기)
        this.engine.gravity.y = 0.7;
        
        this.engine.positionIterations = 8;
        this.engine.velocityIterations = 4;
        
        this.render = Render.create({
            canvas: this.canvas,
            engine: this.engine,
            options: {
                width: window.innerWidth,
                height: window.innerHeight,
                wireframes: false,
                background: 'transparent',
                pixelRatio: window.devicePixelRatio,
                hasBounds: true
            }
        });

        this.runner = Runner.create();
        
        const mouse = Mouse.create(this.canvas);
        const mouseConstraint = MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: false }
            }
        });
        Composite.add(this.world, mouseConstraint);
        this.render.mouse = mouse;

        this.setupCustomRendering();
        this.setupGameLogic();
    }

    resize() {
        const pr = window.devicePixelRatio || 1;
        this.render.options.pixelRatio = pr;
        this.render.options.width = window.innerWidth;
        this.render.options.height = window.innerHeight;
        this.render.canvas.width = window.innerWidth * pr;
        this.render.canvas.height = window.innerHeight * pr;
        this.render.canvas.style.width = window.innerWidth + "px";
        this.render.canvas.style.height = window.innerHeight + "px";
        
        Render.lookAt(this.render, {
            min: { x: 0, y: 0 },
            max: { x: window.innerWidth, y: window.innerHeight }
        });
    }

    clearWorld() {
        Composite.clear(this.world, false);
        Engine.clear(this.engine);
        this.resize();
    }

    start() {
        Render.run(this.render);
        Runner.run(this.runner, this.engine);
    }

    stop() {
        Render.stop(this.render);
        Runner.stop(this.runner);
        
        // 경기가 완전히 종료되면 실시간 순위 UI를 강제로 숨김 (남아있는 현상 방지)
        const liveRankings = document.getElementById('live-rankings');
        if (liveRankings) {
            liveRankings.classList.add('hidden');
        }
    }

    setupGameLogic() {
        Events.on(this.engine, 'beforeUpdate', () => {
            const bodies = Composite.allBodies(this.world);
            const activeMarbles = bodies.filter(b => b.label === 'Marble' && !b.isFinished);
            
            // --- 1. 카메라 이동 로직 ---
            if (activeMarbles.length > 0) {
                let leadMarble = activeMarbles.reduce((prev, curr) => (prev.position.y > curr.position.y) ? prev : curr);
                let targetY = leadMarble.position.y - window.innerHeight / 2.5; 
                if (targetY < 0) targetY = 0;
                
                const currentY = this.render.bounds.min.y;
                if (!isNaN(currentY) && !isNaN(targetY)) {
                    const newY = currentY + (targetY - currentY) * 0.1;
                    Render.lookAt(this.render, {
                        min: { x: 0, y: newY },
                        max: { x: window.innerWidth, y: newY + window.innerHeight }
                    });
                }
            }

            // --- 2. 꼴찌 버프 로직 ---
            if (activeMarbles.length > 1) {
                activeMarbles.forEach(m => m.isLastPlace = false);
                let lastMarble = activeMarbles.reduce((prev, curr) => (prev.position.y < curr.position.y) ? prev : curr);
                
                const triggerY = window.innerHeight * 0.83 + 40;
                if (lastMarble.position.y > triggerY) {
                    lastMarble.isLastPlace = true;

                    if (lastMarble.velocity.y < 6) {
                        Matter.Body.setVelocity(lastMarble, {
                            x: lastMarble.velocity.x + (Math.random() - 0.5) * 2,
                            y: lastMarble.velocity.y + 0.6
                        });
                    }
                }
            }

            // --- 3. 움직이는 장애물(Moving Plank) 로직 ---
            const time = this.engine.timing.timestamp;
            const movingPlanks = bodies.filter(b => b.label === 'MovingPlank');
            movingPlanks.forEach(plank => {
                const targetX = plank.startX + Math.sin(time * 0.002) * plank.moveRange;
                Matter.Body.setPosition(plank, { x: targetX, y: plank.position.y });
            });
            
            // --- 4. 자동 회전 장애물(십자가 모터) 로직 ---
            const spinners = bodies.filter(b => b.label === 'AutoSpin');
            spinners.forEach(s => {
                // 부작용 없이 각속도를 강제 유지시켜 모터처럼 꾸준히 회전하게 만듭니다.
                Matter.Body.setAngularVelocity(s, s.spinSpeed || 0.02);
            });
            
            // --- 5. 시소, 그네 트랩의 능동형 방해 로직 (갇힘 방지) ---
            const seesaws = bodies.filter(b => b.label === 'Seesaw');
            seesaws.forEach(s => {
                // 이전 속도(0.0015) 대비 20% 천천히 움직이게 조절 (0.0012)
                Matter.Body.setAngle(s, Math.sin(time * 0.0012 + s.id) * 0.5);
            });

            const swingCranks = bodies.filter(b => b.label === 'SwingCrank');
            swingCranks.forEach(c => {
                // 크랭크 작대기를 뱅뱅 돌려서 그네가 입체적으로 비틀리며 요동치게 만듦 (진자 운동 대체)
                Matter.Body.setAngularVelocity(c, 0.025);
            });
            
            // --- 6. 흐르는 컨베이어 널빤지 장애물 ---
            const conveyors = bodies.filter(b => b.label === 'ConveyorPlank');
            conveyors.forEach(c => {
                const wrapWidth = c.totalUnit * c.numPlanks;
                let targetX = c.position.x + (c.conveyorDir * c.conveyorSpeed);
                
                // 화면 우측을 벗어나면 왼쪽 끝으로, 왼쪽을 벗어나면 우측 끝으로 순간 이동하여 무한 스크롤 연출
                if (c.conveyorDir > 0 && targetX > c.mapWidth + c.totalUnit/2) {
                    targetX -= wrapWidth;
                }
                else if (c.conveyorDir < 0 && targetX < -c.totalUnit/2) {
                    targetX += wrapWidth;
                }
                
                Matter.Body.setPosition(c, { x: targetX, y: c.position.y });
            });
            
            // --- 7. 실시간 등수 업데이트 로직 ---
            const liveRankings = document.getElementById('live-rankings');
            if (activeMarbles.length > 0) {
                // 구슬이 출발(isStatic 해제)하면 랭킹창 표시
                if (liveRankings && !activeMarbles[0].isStatic && liveRankings.classList.contains('hidden')) {
                    liveRankings.classList.remove('hidden');
                }
                
                if (liveRankings && !liveRankings.classList.contains('hidden')) {
                    // 실시간 Y좌표 기준 내림차순 정렬 (아래로 갈수록 Y가 큼)
                    const sorted = [...activeMarbles].sort((a,b) => b.position.y - a.position.y);
                    const listHtml = sorted.map((m, i) => `
                        <li>
                            <span style="font-weight:bold; width: 16px;">${i+1}</span>
                            <span class="marble-color-dot" style="background: ${m.render.fillStyle}; width: 12px; height: 12px; border-width: 1px;"></span>
                            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${m.marbleName}</span>
                        </li>
                    `).join('');
                    if (document.getElementById('live-ranking-list')) {
                        document.getElementById('live-ranking-list').innerHTML = listHtml;
                    }
                }
            } else if (liveRankings) {
                 // 경기가 끝나면 숨김
                 liveRankings.classList.add('hidden');
            }
        });
    }

    setupCustomRendering() {
        Events.on(this.render, 'afterRender', () => {
            const context = this.render.context;
            const bodies = Composite.allBodies(this.world);
            const marbles = bodies.filter(b => b.label === 'Marble');

            for (let marble of marbles) {
                const { position, marbleName, isFinished, isLastPlace } = marble;

                // --- 버그 원인 해결: 카메라 스크롤 변환 --- 
                // Matter.js의 afterRender는 카메라 매트릭스가 풀린 순수 화면 좌표계(Origin 0,0)로 돌아옵니다.
                // 따라서 월드 좌표(position.y)를 그대로 쓰면 카메라가 내려갈때 텍스트는 허공에 남게 됩니다.
                // 현재 카메라(bounds.min)의 위치를 빼서 진짜 화면상 좌표(ScreenX, ScreenY)를 역연산합니다.
                const bounds = this.render.bounds;
                const canvasW = this.render.options.width;
                const canvasH = this.render.options.height;
                const scaleX = canvasW / (bounds.max.x - bounds.min.x);
                const scaleY = canvasH / (bounds.max.y - bounds.min.y);
                
                const screenX = (position.x - bounds.min.x) * scaleX;
                const screenY = (position.y - bounds.min.y) * scaleY;

                if (isLastPlace && !isFinished) {
                    context.beginPath();
                    // 구슬 테두리 효과도 스크린 좌표로 맞춤
                    context.arc(screenX, screenY, (marble.circleRadius || 12) * scaleX + 4, 0, 2 * Math.PI);
                    context.fillStyle = 'rgba(253, 224, 71, 0.4)'; 
                    context.fill();
                }

                // 이름 렌더링 스크린 좌표로 출력
                context.font = "900 16px 'Noto Sans KR', sans-serif";
                context.textAlign = "center";
                context.textBaseline = "bottom"; 
                
                context.lineWidth = 4;
                context.strokeStyle = 'rgba(0, 0, 0, 0.9)'; 
                
                // 구슬 반지름(12 px)만큼 정확히 위로 올려서 바짝 붙임
                const textOffsetY = screenY - (14 * scaleY); 
                
                if (isLastPlace && !isFinished) {
                    context.fillStyle = '#fde047'; 
                } else {
                    context.fillStyle = '#ffffff';
                }

                context.strokeText(marbleName, screenX, textOffsetY);
                context.fillText(marbleName, screenX, textOffsetY);
            }
        });
    }
}
