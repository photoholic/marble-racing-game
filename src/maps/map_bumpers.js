import Matter from 'matter-js';
const { Bodies } = Matter;

export default {
    name: "Bumper Frenzy",
    getSpawnPoint: (worldWidth) => ({ x: worldWidth / 2, y: 100, width: worldWidth, height: 200 }),
    generate: (worldWidth) => {
        const bodies = [];
        const mapHeight = 5000;
        
        const wallOptions = { isStatic: true, friction: 0.1, restitution: 0.5, render: { fillStyle: '#1e293b' } };
        const thick = 500;
        bodies.push(Bodies.rectangle(-thick/2, mapHeight/2, thick, mapHeight, wallOptions));
        bodies.push(Bodies.rectangle(worldWidth + thick/2, mapHeight/2, thick, mapHeight, wallOptions));
        
        const rows = 20; 
        const spacingX = Math.max(75, worldWidth / 7); 
        const spacingY = 120;  
        const totalCols = Math.floor(worldWidth / spacingX);
        const startY = window.innerHeight * 0.9;  

        for (let row = 0; row < rows; row++) {
            const currentY = startY + (row * spacingY);

            // 매 줄마다 좌우 벽면에서 큰 Bumper 튀어나옴
            bodies.push(Bodies.rectangle(20, currentY, 80, 20, {
                isStatic: true, angle: Math.PI / 4, restitution: 1.5, render: { fillStyle: '#475569' } 
            }));
            bodies.push(Bodies.rectangle(worldWidth - 20, currentY - 60, 80, 20, {
                isStatic: true, angle: -Math.PI / 4, restitution: 1.5, render: { fillStyle: '#475569' }
            }));

            const isOffset = row % 2 !== 0;
            const cols = isOffset ? totalCols - 1 : totalCols;
            
            for (let col = 0; col < cols; col++) {
                const x = (isOffset ? spacingX / 2 : 0) + (col * spacingX) + (worldWidth - spacingX*(totalCols-1))/2;
                const noiseX = (Math.random() - 0.5) * 10;
                
                let finalX = x + noiseX;
                // 벽면에 거대한 범퍼가 존재하므로, 최소 85px 이내에는 어떠한 장애물도 겹치지 않게 강제 분리
                if (finalX < 85) finalX = 90 + Math.random() * 10;
                else if (worldWidth - finalX < 85) finalX = worldWidth - 90 - Math.random() * 10;

                const padChance = Math.random();
                if (padChance < 0.35) {
                    // 미친 반발력의 핑크 패드 대거 출몰
                    bodies.push(Bodies.rectangle(finalX, currentY, 40, 12, {
                        isStatic: true, angle: (Math.random() - 0.5) * Math.PI / 2, restitution: 2.0, 
                        render: { fillStyle: '#ec4899', strokeStyle: '#fbcfe8', lineWidth: 2 } 
                    }));
                } else if (padChance < 0.65) {
                    const radius = 10 + Math.random() * 5;
                    bodies.push(Bodies.circle(finalX, currentY, radius, {
                        isStatic: true, restitution: 1.3, render: { fillStyle: '#cbd5e1' } 
                    }));
                }
            }
        }

        let obsY = startY + rows * spacingY + 80;
        const zigzagWidth = worldWidth * 0.8;
        bodies.push(Bodies.rectangle(zigzagWidth/2 - 40, obsY, zigzagWidth, 30, {
            isStatic: true, angle: Math.PI / 15, render: { fillStyle: '#334155' }
        }));
        
        obsY += 160;
        
        const finalPlankWidth = worldWidth / 3;
        const finalPlank = Bodies.rectangle(worldWidth/2, obsY, finalPlankWidth, 24, {
            isStatic: true, label: 'MovingPlank', startX: worldWidth/2, moveRange: worldWidth / 3.5, render: { fillStyle: '#94a3b8' }
        });
        bodies.push(finalPlank);

        const finishY = obsY + 250;
        const funnelGap = 80; 
        const coverX = (worldWidth / 2) - (funnelGap / 2);
        const funnelAngle = Math.PI / 6; 
        const funnelLength = (coverX / Math.cos(funnelAngle)) + 50; 
        const funnelCenterX = coverX / 2;

        bodies.push(Bodies.rectangle(funnelCenterX, finishY - 80, funnelLength, 24, {
            isStatic: true, angle: funnelAngle, render: { fillStyle: '#64748b' }
        }));
        bodies.push(Bodies.rectangle(worldWidth - funnelCenterX, finishY - 80, funnelLength, 24, {
            isStatic: true, angle: -funnelAngle, render: { fillStyle: '#64748b' }
        }));

        const finishLine = Bodies.rectangle(worldWidth/2, finishY, 150, 40, {
            isStatic: true, isSensor: true, label: 'FinishLine', render: { fillStyle: 'rgba(16, 185, 129, 0.4)', strokeStyle: '#10b981', lineWidth: 2 }
        });
        bodies.push(finishLine);
        bodies.push(Bodies.rectangle(worldWidth/2, finishY + 200, worldWidth, 100, wallOptions));

        return bodies;
    }
};
