import Matter from 'matter-js';

const { Bodies, Body, Composite } = Matter;

export default {
    name: "Spin City",
    description: "Huge rotating windmills that smack marbles out of their path.",
    getSpawnPoint: (worldWidth) => {
        return {
            x: worldWidth / 2,
            y: 50,
            width: worldWidth * 0.8
        };
    },
    generate(worldWidth, mapHeight) {
        const bodies = [];
        
        const wallOptions = { 
            isStatic: true, 
            friction: 0.005,
            render: { fillStyle: '#475569' } 
        };
        const thick = 100;
        bodies.push(Bodies.rectangle(-thick/2, mapHeight/2, thick, mapHeight, wallOptions));
        bodies.push(Bodies.rectangle(worldWidth + thick/2, mapHeight/2, thick, mapHeight, wallOptions));

        const startY = window.innerHeight * 0.9;
        
        // 상단 깔때기 (구슬들을 중앙으로 좀 모아줌)
        bodies.push(Bodies.rectangle(worldWidth * 0.2, startY + 150, worldWidth * 0.6, 20, {
            isStatic: true, angle: Math.PI / 8, render: { fillStyle: '#334155' }
        }));
        bodies.push(Bodies.rectangle(worldWidth * 0.8, startY + 150, worldWidth * 0.6, 20, {
            isStatic: true, angle: -Math.PI / 8, render: { fillStyle: '#334155' }
        }));
        
        // 거대 모터 회전체 4개 생성
        const createCrossMotor = (x, y, size, speed, color) => {
            const vertical = Bodies.rectangle(x, y, 24, size, { isStatic: true });
            const horizontal = Bodies.rectangle(x, y, size, 24, { isStatic: true });
            Body.setParts(vertical, [vertical, horizontal]);
            vertical.label = 'AutoSpin';
            vertical.spinSpeed = speed;
            vertical.render.fillStyle = color;
            return vertical;
        };

        const spacingY = 350;
        for (let i = 0; i < 4; i++) {
            const y = startY + 400 + (i * spacingY);
            // 좌우 교차 배치 지그재그
            const x = (i % 2 === 0) ? (worldWidth * 0.3) : (worldWidth * 0.7);
            const speed = (i % 2 === 0) ? 0.03 : -0.04;
            const size = Math.min(300, worldWidth * 0.5);
            
            bodies.push(createCrossMotor(x, y, size, speed, '#eab308'));
            
            // 반대편에는 작은 고정 핀들 생성
            const pinX = (i % 2 === 0) ? (worldWidth * 0.8) : (worldWidth * 0.2);
            bodies.push(Bodies.circle(pinX, y, 20, { isStatic: true, render: { fillStyle: '#f8fafc' } }));
            bodies.push(Bodies.circle(pinX, y - 80, 15, { isStatic: true, render: { fillStyle: '#94a3b8' } }));
            bodies.push(Bodies.circle(pinX, y + 80, 15, { isStatic: true, render: { fillStyle: '#94a3b8' } }));
        }

        return bodies;
    }
};
