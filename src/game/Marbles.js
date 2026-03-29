import Matter from 'matter-js';

const { Bodies, Composite } = Matter;

const firstNames = ['용감한', '날쌘', '단단한', '반짝이는', '게으른', '신나는', '귀여운', '조용한', '빛나는', '화가난', '졸린', '똑똑한', '강력한', '투명한', '럭키', '침착한', '우직한', '바람의', '빛의', '어둠의'];
const lastNames = ['구슬', '돌멩이', '알맹이', '유리알', '다이아', '구슬이', '맹수', '토끼', '거북이', '달팽이', '혜성', '로켓', '구름', '별빛', '물방울', '파도', '번개', '호랑이', '불꽃'];

function generateRandomName() {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${fn} ${ln}`;
}

const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];

export class MarbleManager {
    constructor(engineSetup) {
        this.engineSetup = engineSetup;
        this.world = engineSetup.world;
        this.marbles = [];
        this.glassFloor = null;
        
        // 안티-스톨 (구슬 멈춤 방지) 로직 주기적 실행 (Y축 기준)
        let frameCount = 0;
        Matter.Events.on(this.engineSetup.engine, 'beforeUpdate', () => {
            // 경기가 시작(구슬들의 isStatic이 풀림)된 이후에만 체크
            if (this.marbles.length > 0 && !this.marbles[0].isStatic) {
                frameCount++;
                if (frameCount % 30 === 0) { // 매 30프레임 (약 0.5초) 마다 체크
                    for (let marble of this.marbles) {
                        if (!marble.isFinished) {
                            if (marble.lastStuckCheckY !== undefined) {
                                const deltaY = Math.abs(marble.position.y - marble.lastStuckCheckY);
                                if (deltaY < 5) {
                                    // Y축으로 5픽셀 미만 움직임 = 갇혔거나 너무 느림
                                    marble.stuckFrames = (marble.stuckFrames || 0) + 30;
                                    
                                    if (marble.stuckFrames >= 60) { // 1초 연속으로 못 내려감
                                        const allBodies = Matter.Composite.allBodies(this.world);
                                        const collisions = Matter.Query.collides(marble, allBodies);
                                        for (let col of collisions) {
                                            const other = col.bodyA === marble ? col.bodyB : col.bodyA;
                                            if (other.label !== 'Marble' && !other.isSensor && other.area < 100000) {
                                                Matter.Composite.remove(this.world, other);
                                                console.log("Anti-Stall: Y-axis stuck, destroyed obstacle!");
                                            }
                                        }
                                        // 구제 후 흔들어줌
                                        Matter.Body.applyForce(marble, marble.position, { x: 0.001, y: -0.001 });
                                        marble.stuckFrames = 0;
                                    }
                                } else {
                                    // 정상 하강 중
                                    marble.stuckFrames = 0;
                                }
                            }
                            marble.lastStuckCheckY = marble.position.y;
                        }
                    }
                }
            }
        });
    }

    spawnMarbles(count, spawnArea) {
        this.marbles = [];
        const radius = 12;

        const floorY = window.innerHeight * 0.83; 
        this.glassFloor = null; // 대기실 유리 바닥을 없앴습니다!

        // 구슬 좌우 범위만 지정하고 Y축은 넓은 공간에 랜덤 뿌리기
        let cols = Math.min(count, Math.max(3, Math.floor(window.innerWidth / 80))); 
        let rows = Math.ceil(count / cols);
        
        const spacingX = Math.min(70, (window.innerWidth * 0.8) / cols);  // X 간격 최대 제한
        const spacingY = Math.min(50, (floorY - 120) / rows);

        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            // 현재 진행 중인 열(row)의 구슬 개수로 row 기준 중앙 좌표 시작점 확보!
            const rColor = colors[i % colors.length];

            // 랜덤 높이값 부여 (Y축 250픽셀 구간 내 허공에 둥둥 띄우기)
            const randomOffsetY = (Math.random() - 0.5) * 250;
            const x = ((window.innerWidth - (Math.min(cols, count) - 1) * spacingX) / 2) + (col * spacingX) + (Math.random() - 0.5) * 20;
            const y = (floorY - 100) + randomOffsetY;

            const marble = Bodies.circle(x, y, radius, {
                restitution: 0.9,
                friction: 0.005,
                density: 0.05,
                render: { fillStyle: rColor },
                label: 'Marble',
                isStatic: true // 대기 상태 (허공에 고정)
            });

            marble.marbleName = generateRandomName();
            marble.circleRadius = radius;
            
            this.marbles.push(marble);
            Composite.add(this.world, marble);
        }
    }

    releaseMarbles() {
        for (let marble of this.marbles) {
            Matter.Body.setStatic(marble, false);
        }
    }
}
