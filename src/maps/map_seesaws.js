import Matter from 'matter-js';
const { Bodies, Constraint } = Matter;

export default {
    name: "Seesaw Valley",
    getSpawnPoint: (worldWidth) => ({ x: worldWidth / 2, y: 100, width: worldWidth, height: 200 }),
    generate: (worldWidth) => {
        const bodies = [];
        const mapHeight = 5000;
        
        const wallOptions = { isStatic: true, friction: 0.1, restitution: 0.5, render: { fillStyle: '#1e293b' } };
        const thick = 500;
        bodies.push(Bodies.rectangle(-thick/2, mapHeight/2, thick, mapHeight, wallOptions));
        bodies.push(Bodies.rectangle(worldWidth + thick/2, mapHeight/2, thick, mapHeight, wallOptions));
        
        // 스스로 움직이는(돌아가는) 중앙축 기반 고정 시소 (물리 엔진 충돌 안정화 버전)
        const addMotorSeesaw = (x, y, width) => {
            const board = Bodies.rectangle(x, y, width, 18, { 
                isStatic: true, label: 'Seesaw', render: { fillStyle: '#8b5cf6' }
            });
            bodies.push(board);
        };

        const rows = 16; // 큼지막한 시소들 위주이므로 줄 수 축소 (12 -> 16 연장)
        const spacingY = 160;  
        const startY = window.innerHeight * 0.9;  

        for (let row = 0; row < rows; row++) {
            const currentY = startY + (row * spacingY);

            // 약 15%~35%의 기울기와 랜덤 길이 부여 (수평 0도 절대 금지)
            const angleVal = (Math.PI / 12) + Math.random() * (Math.PI / 8); 
            const tilt1 = Math.random() > 0.5 ? angleVal : -angleVal;
            const tilt2 = -tilt1;
            
            const randType = Math.random();

            if (randType < 0.35) {
                // 고정된 경사로 2개 엇갈려 배치 (빈 공간에 빠지지 않도록 넓게)
                // 수학적으로 중앙과 양옆 벽 사이에 최소 45px 이상의 안전 간격 무조건 보장
                const maxLen = (worldWidth / 2) - 45;
                const len1 = maxLen * (0.6 + Math.random() * 0.4);
                const len2 = maxLen * (0.6 + Math.random() * 0.4);
                
                // 좌측 영역(len1), 우측 영역(len2)을 각각 중앙이나 바깥벽에 밀착 (단 45px 안전 여백 보장)
                const x1 = Math.random() > 0.5 ? (45 + len1/2) : (worldWidth/2 - 45 - len1/2);
                const x2 = Math.random() > 0.5 ? (worldWidth/2 + 45 + len2/2) : (worldWidth - 45 - len2/2);
                
                bodies.push(Bodies.rectangle(x1, currentY, len1, 16, {
                    isStatic: true, angle: tilt1, render: { fillStyle: '#f59e0b' }
                }));
                bodies.push(Bodies.rectangle(x2, currentY + 60, len2, 16, {
                    isStatic: true, angle: tilt2, render: { fillStyle: '#f59e0b' }
                }));
            } else if (randType < 0.70) {
                // 중앙 모터 구동 시소의 경우 길이가 양쪽 벽에 닿지 않도록 최대 길이(maxLen) 제한
                const maxLen = worldWidth - 90; // 양쪽 벽에서 무조건 45px 띄움
                const seesawLen = maxLen * (0.6 + Math.random() * 0.4);
                addMotorSeesaw(worldWidth / 2, currentY, seesawLen);
            } else {
                // 벽면에 붙은 초거대 고정 경사판 1개
                // 대각선 기울기를 감안해도 최소 한쪽 벽과는 무조건 45px 간격이 지켜지도록 좌표 연산
                const maxLen = worldWidth - 90;
                const hugeLen = maxLen * (0.7 + Math.random() * 0.3);
                
                const xPos = Math.random() > 0.5 ? (45 + hugeLen/2) : (worldWidth - 45 - hugeLen/2);
                
                bodies.push(Bodies.rectangle(xPos, currentY, hugeLen, 24, {
                    isStatic: true, angle: tilt1, render: { fillStyle: '#6366f1' }
                }));
            }
        }

        let obsY = startY + rows * spacingY + 80;
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
