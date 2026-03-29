import Matter from 'matter-js';

const { Bodies } = Matter;

export default {
    name: "Conveyor Cascade",
    description: "High-speed slides and trapdoors that clump marbles together for massive rank-flipping!",
    getSpawnPoint: (worldWidth) => {
        return { x: worldWidth / 2, y: 50, width: worldWidth * 0.8 };
    },
    generate(worldWidth, mapHeight) {
        const bodies = [];
        const wallOptions = { isStatic: true, render: { fillStyle: '#475569' } };
        const thick = 100;
        bodies.push(Bodies.rectangle(-thick/2, mapHeight/2, thick, mapHeight, wallOptions));
        bodies.push(Bodies.rectangle(worldWidth + thick/2, mapHeight/2, thick, mapHeight, wallOptions));

        const startY = window.innerHeight * 0.9;
        
        let currentY = startY + 200;
        
        // 거대 깔때기 및 함정문 (Trapdoor) 구간 3곳 생성
        // 구슬들이 모여있다가 아래쪽 장애물이 열리면서 우르르 쏟아져 1등이 대규모로 바뀜
        for(let i=0; i<3; i++) {
            // 깔때기 벽
            bodies.push(Bodies.rectangle(worldWidth * 0.25, currentY, worldWidth * 0.5, 30, {
                isStatic: true, angle: Math.PI / 5, render: { fillStyle: '#6366f1' }
            }));
            bodies.push(Bodies.rectangle(worldWidth * 0.75, currentY, worldWidth * 0.5, 30, {
                isStatic: true, angle: -Math.PI / 5, render: { fillStyle: '#6366f1' }
            }));
            
            // 중앙에 왔다갔다 하는 함정문 (MovingPlank)
            const trapdoor = Bodies.rectangle(worldWidth / 2, currentY + 120, 150, 40, {
                isStatic: true, label: 'MovingPlank', render: { fillStyle: '#f43f5e' }
            });
            trapdoor.startX = worldWidth / 2;
            trapdoor.moveRange = 120; // 크게 열렸다 닫힘
            bodies.push(trapdoor);
            
            currentY += 250;

            // 컨베이어 벨트 구역
            currentY += 150;
            const beltDir = i % 2 === 0 ? 1 : -1;
            const beltX = beltDir === 1 ? worldWidth * 0.4 : worldWidth * 0.6;
            
            const conveyor = Bodies.rectangle(beltX, currentY, worldWidth * 0.7, 30, {
                isStatic: true, label: 'ConveyorPlank', render: { fillStyle: '#f59e0b' }
            });
            conveyor.conveyorDir = beltDir;
            conveyor.conveyorSpeed = 4;
            conveyor.mapWidth = worldWidth;
            conveyor.totalUnit = worldWidth * 0.7;
            conveyor.numPlanks = 1;
            bodies.push(conveyor);

            currentY += 250;
        }

        return bodies;
    }
};
