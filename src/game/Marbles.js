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
