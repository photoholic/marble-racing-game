import { addZigzagBoundaryAndFinish } from '../game/MapBoundary.js';

const { Bodies } = Matter;

export default {
    name: "Orbital Nexus (Gravity)",
    description: "Invisible gravity wells pull marbles into unpredictable orbits. 1st place changes constantly!",
    getSpawnPoint: (worldWidth) => {
        return { x: worldWidth / 2, y: 50, width: worldWidth * 0.8 };
    },
    generate(worldWidth, mapHeight) {
        const bodies = [];


        const startY = window.innerHeight * 0.9;
        const rows = 9;
        const spacingY = 320;

        for (let i = 0; i < rows; i++) {
            const y = startY + 200 + (i * spacingY);
            
            // 엇갈린 블랙홀 생성
            const bhX = (i % 2 === 0) ? (worldWidth * 0.3) : (worldWidth * 0.7);
            
            // 블랙홀을 시각적으로 나타내는 센서 구체 (충돌 안함)
            const blackhole = Bodies.circle(bhX, y, 60, {
                isStatic: true,
                isSensor: true,
                label: 'BlackHole',
                // Engine.js에서 이 속성들을 스캔하여 실시간 중력을 계산합니다.
                gravityRadius: 250, 
                gravityStrength: 0.08,
                render: { 
                    fillStyle: '#0f172a', 
                    strokeStyle: '#8b5cf6', 
                    lineWidth: 6 
                }
            });
            bodies.push(blackhole);

            // 주변에 궤도 이탈 방지용 부드러운 쿠션 반사판 (우주 정거장 느낌)
            bodies.push(Bodies.rectangle(worldWidth - bhX, y + 100, 150, 20, {
                isStatic: true, angle: (i%2 === 0) ? Math.PI/6 : -Math.PI/6, 
                restitution: 1.2, render: { fillStyle: '#38bdf8' }
            }));
            
            bodies.push(Bodies.circle(worldWidth/2, y - 100, 25, {
                isStatic: true, render: { fillStyle: '#94a3b8' }
            }));
        }

        const obsEndY = startY + 200 + (rows * spacingY);
        addZigzagBoundaryAndFinish(bodies, worldWidth, startY, obsEndY);

        return bodies;
    }
};
