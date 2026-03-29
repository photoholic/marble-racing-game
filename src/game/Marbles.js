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
        
        // 안티-스톨 (구슬 멈춤 방지) 로직 주기적 실행
        Matter.Events.on(this.engineSetup.engine, 'beforeUpdate', () => {
            if (!this.glassFloor && this.marbles.length > 0) {
                for (let marble of this.marbles) {
                    if (!marble.isFinished) {
                        const speedSq = marble.velocity.x * marble.velocity.x + marble.velocity.y * marble.velocity.y;
                        if (speedSq < 0.05) { // 완전히 멈췄거나 균형점에 갇힘
                            marble.stuckFrames = (marble.stuckFrames || 0) + 1;
                            
                            // 1단계: 0.5초(30프레임) 이상 멈추면 지진(Nudge) 물리력 행사
                            if (marble.stuckFrames > 30 && marble.stuckFrames <= 120) {
                                const nudge = (Math.random() - 0.5) * 0.001;
                                Matter.Body.applyForce(marble, marble.position, { x: nudge, y: -0.0005 });
                            }
                            
                            // 2단계: 2초(120프레임) 이상 완전히 갇히면 맞닿은 장애물 자체를 파괴!
                            if (marble.stuckFrames > 120) {
                                const allBodies = Matter.Composite.allBodies(this.world);
                                const collisions = Matter.Query.collides(marble, allBodies);
                                for (let col of collisions) {
                                    const other = col.bodyA === marble ? col.bodyB : col.bodyA;
                                    // 다른 구슬이거나, 골인 지점 같은 센서, 혹은 너무 거대한 맵 외곽선(area>10만)은 파괴 금지
                                    if (other.label !== 'Marble' && !other.isSensor && other.area < 100000) {
                                        Matter.Composite.remove(this.world, other);
                                        console.log("Anti-Stall: Destroyed obstacle trapping marble", marble.id);
                                    }
                                }
                                marble.stuckFrames = 0; // 구제 후 프레임 초기화
                            }
                        } else {
                            // 다시 굴러가면 정상화
                            marble.stuckFrames = 0;
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
        this.glassFloor = Bodies.rectangle(window.innerWidth/2, floorY, window.innerWidth * 2, 10, {
            isStatic: true,
            render: {
                fillStyle: 'rgba(255, 255, 255, 0.15)',
                strokeStyle: '#94a3b8',
                lineWidth: 1
            }
        });
        Composite.add(this.world, this.glassFloor);

        // 구슬이 좌우 여백을 무시하고 퍼지는 것을 막기 위해 중앙 정렬 배치 계산
        let cols = Math.min(count, Math.max(3, Math.floor(window.innerWidth / 80))); 
        let rows = Math.ceil(count / cols);
        
        const spacingX = Math.min(70, (window.innerWidth * 0.8) / cols); // X 간격 최대 제한
        const spacingY = Math.min(50, (floorY - 120) / rows);

        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            // 현재 진행 중인 열(row)의 구슬 개수로 row 기준 중앙 좌표 시작점 확보!
            const itemsInThisRow = Math.min(cols, count - row * cols);
            const rowWidth = (itemsInThisRow - 1) * spacingX;
            const startX = (window.innerWidth - rowWidth) / 2;
            
            let x = startX + (col * spacingX);
            // 구슬이 아래 창고(유리 바닥) 바로 위부터 예쁘게 쌓이도록 Y 계산
            let y = Math.max(60, floorY - 60 - ((rows - 1 - row) * spacingY));

            const color = colors[i % colors.length];

            const marble = Bodies.circle(x, y, radius, {
                label: 'Marble',
                restitution: 0.3, // 반발력을 절반으로 줄여 너무 튀지 않게 조정
                friction: 0.005,
                density: 0.04,
                isStatic: false, 
                render: { fillStyle: color, strokeStyle: '#ffffff', lineWidth: 2 }
            });

            marble.marbleName = generateRandomName() + ` (${i+1})`;
            marble.isFinished = false;

            this.marbles.push(marble);
        }

        Composite.add(this.world, this.marbles);
    }

    releaseMarbles() {
        if (this.glassFloor) {
            Composite.remove(this.world, this.glassFloor);
            this.glassFloor = null;
        }
    }
}
