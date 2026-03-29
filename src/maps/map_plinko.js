import Matter from 'matter-js';

const { Bodies } = Matter;

export default {
    name: "Plinko Pyramid",
    description: "The ultimate RNG bell-curve! Constant bounces mean true randomness.",
    getSpawnPoint: (worldWidth) => {
        // 정가운데 딱 한 점으로 모아서 투하
        return { x: worldWidth / 2 - 20, y: 50, width: 40, height: 100 };
    },
    generate(worldWidth, mapHeight) {
        const bodies = [];
        const wallOptions = { isStatic: true, render: { fillStyle: '#475569' } };
        const thick = 100;
        bodies.push(Bodies.rectangle(-thick/2, mapHeight/2, thick, mapHeight, wallOptions));
        bodies.push(Bodies.rectangle(worldWidth + thick/2, mapHeight/2, thick, mapHeight, wallOptions));

        const startY = window.innerHeight * 0.8;
        
        // 가장 위쪽에 구슬을 일렬로 모아주는 거대한 깔때기
        bodies.push(Bodies.rectangle(worldWidth * 0.2, startY, worldWidth * 0.6, 20, {
            isStatic: true, angle: Math.PI / 4, render: { fillStyle: '#cbd5e1' }
        }));
        bodies.push(Bodies.rectangle(worldWidth * 0.8, startY, worldWidth * 0.6, 20, {
            isStatic: true, angle: -Math.PI / 4, render: { fillStyle: '#cbd5e1' }
        }));

        let gridY = startY + 200;
        const spacingX = 65; 
        const spacingY = 75;
        const maxRows = 30;

        for (let row = 1; row <= maxRows; row++) {
            // 메가 경사로 (진행를 늦추고 구슬을 다시 뭉치게 만듦)
            if (row === 12 || row === 24) {
                const isLeft = (row === 12);
                const megaLen = worldWidth * 0.85; 
                const megaX = isLeft ? megaLen / 2 - 20 : worldWidth - (megaLen / 2) + 20;
                const megaAngle = isLeft ? Math.PI / 12 : -Math.PI / 12; // 아래로 향하게 강제
                bodies.push(Bodies.rectangle(megaX, gridY, megaLen, 30, {
                    isStatic: true, angle: megaAngle, render: { fillStyle: '#8b5cf6' }
                }));
                gridY += spacingY;
                continue; // 핀 생성은 이번 줄 생략
            }

            // 정삼각형 피라미드 형식으로 1개, 2개, 3개... 생성
            // 맵 너비에 꽉 차면 더 이상 늘리지 않음
            const numPins = Math.min(row, Math.floor((worldWidth - 100) / spacingX));
            const rowWidth = (numPins - 1) * spacingX;
            const startX = (worldWidth - rowWidth) / 2;

            for (let i = 0; i < numPins; i++) {
                const x = startX + (i * spacingX);
                bodies.push(Bodies.circle(x, gridY, 10, {
                    isStatic: true,
                    restitution: 0.6, // 통통 튀게
                    render: { fillStyle: '#fca5a5' }
                }));
            }
            gridY += spacingY;
        }

        return bodies;
    }
};
