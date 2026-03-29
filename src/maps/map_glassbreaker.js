import Matter from 'matter-js';

const { Bodies } = Matter;

export default {
    name: "The Glass Breaker",
    description: "Sacrifice early marbles to shatter the glass blocks and clear a path for the rest.",
    getSpawnPoint: (worldWidth) => {
        return { x: worldWidth / 2, y: 50, width: worldWidth * 0.8 };
    },
    generate(worldWidth, mapHeight) {
        const bodies = [];
        const wallOptions = { isStatic: true, render: { fillStyle: '#475569' } };
        bodies.push(Bodies.rectangle(-50, mapHeight/2, 100, mapHeight, wallOptions));
        bodies.push(Bodies.rectangle(worldWidth + 50, mapHeight/2, 100, mapHeight, wallOptions));

        const startY = window.innerHeight * 0.9;
        
        // 층별 유리벽 생성 (구슬이 부수고 지나가야 함)
        const generateGlassRow = (y, gapWidth) => {
            const numBlocks = Math.floor(worldWidth / 60);
            const blockWidth = worldWidth / numBlocks;
            for (let i = 0; i < numBlocks; i++) {
                const x = i * blockWidth + (blockWidth / 2);
                // 양 끝단은 강철 벽으로 (안 부서짐)
                if (x < 40 || x > worldWidth - 40) {
                     bodies.push(Bodies.rectangle(x, y, blockWidth, 30, {
                         isStatic: true,
                         render: { fillStyle: '#334155' }
                     }));
                } else {
                    const glass = Bodies.rectangle(x, y, blockWidth - 4, 30, {
                        isStatic: true,
                        render: { 
                            fillStyle: 'rgba(56, 189, 248, 0.5)', 
                            strokeStyle: '#38bdf8', 
                            lineWidth: 2 
                        }
                    });
                    glass.isBreakable = true; // Engine.js에 작성한 로직이 감지합니다
                    bodies.push(glass);
                }
            }
        };

        const numLayers = 8;
        for (let i = 0; i < numLayers; i++) {
            const y = startY + 250 + (i * 200);
            generateGlassRow(y, 0);
            
            // 유리벽 사이에 일반 모루 핀 몇개 섞어서 바운스 유도
            if (i < numLayers - 1) {
                const scatterY = y + 100;
                bodies.push(Bodies.polygon(worldWidth * 0.3, scatterY, 3, 30, { isStatic: true, angle: Math.PI/4, render: { fillStyle: '#cbd5e1' } }));
                bodies.push(Bodies.polygon(worldWidth * 0.7, scatterY, 3, 30, { isStatic: true, angle: -Math.PI/4, render: { fillStyle: '#cbd5e1' } }));
            }
        }

        return bodies;
    }
};
