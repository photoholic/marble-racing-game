import Matter from 'matter-js';
import { addZigzagBoundaryAndFinish } from '../game/MapBoundary.js';
const { Bodies } = Matter;

export default {
    name: "Pinball Classic",
    getSpawnPoint: (worldWidth) => ({ x: worldWidth / 2, y: 100, width: worldWidth, height: 200 }),
    generate: (worldWidth) => {
        const bodies = [];

        
        const rows = 26; 
        const spacingX = Math.max(70, worldWidth / 6); 
        const spacingY = 100;  
        const totalCols = Math.floor(worldWidth / spacingX);
        const startY = window.innerHeight * 0.9;  

        for (let row = 0; row < rows; row++) {
            const currentY = startY + (row * spacingY);


            if (row % 3 === 1 && row >= 2 && row <= rows - 2) {
                bodies.push(Bodies.rectangle(20, currentY - 50, 75, 20, {
                    isStatic: true, angle: Math.PI / 6, render: { fillStyle: '#475569' } 
                }));
                bodies.push(Bodies.rectangle(worldWidth - 20, currentY - 50, 75, 20, {
                    isStatic: true, angle: -Math.PI / 6, render: { fillStyle: '#475569' }
                }));
            }

            const isOffset = row % 2 !== 0;
            const cols = isOffset ? totalCols - 1 : totalCols;
            
            for (let col = 0; col < cols; col++) {
                const x = (isOffset ? spacingX / 2 : 0) + (col * spacingX) + (worldWidth - spacingX*(totalCols-1))/2;
                const noiseX = (Math.random() - 0.5) * 12;
                const noiseY = (Math.random() - 0.5) * 12;

                let finalX = x + noiseX;
                // 초대형 혹(반지름 최대 30)이 벽 근처에 배치될 때 구슬 길이 이상의 틈새 보장 (65px 여유)
                if (finalX < 65) finalX = (Math.random() < 0.5) ? 0 : 70;
                else if (worldWidth - finalX < 65) finalX = (Math.random() < 0.5) ? worldWidth : worldWidth - 70;

                // 3 ~ 30까지의 극단적인 크기
                const isGiant = Math.random() < 0.15; 
                const radius = isGiant ? 18 + Math.random() * 12 : 3 + Math.random() * 9;
                
                bodies.push(Bodies.circle(finalX, currentY + noiseY, radius, {
                    isStatic: true,
                    restitution: isGiant ? 1.5 : (radius > 9 ? 1.2 : 0.6), 
                    render: { fillStyle: isGiant ? '#ec4899' : (radius > 9 ? '#94a3b8' : '#475569') } 
                }));
            }
        }

        let obsY = startY + rows * spacingY + 80;
        
        const finalPlankWidth = worldWidth / 3;
        const finalPlank = Bodies.rectangle(worldWidth/2, obsY + 160, finalPlankWidth, 24, {
            isStatic: true, label: 'MovingPlank', startX: worldWidth/2, moveRange: worldWidth / 3.5, render: { fillStyle: '#94a3b8' }
        });
        bodies.push(finalPlank);

        const obsEndY = obsY + 250;
        addZigzagBoundaryAndFinish(bodies, worldWidth, startY, obsEndY);

        return bodies;
    }
};
