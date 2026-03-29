import * as Matter from 'matter-js';

const { Bodies } = Matter;

export function addZigzagBoundaryAndFinish(bodies, worldWidth, startY, obsEndY) {
    const wallOptions = { 
        isStatic: true, 
        friction: 0.1, 
        render: { fillStyle: '#1e293b' } 
    };

    const thick = 500;
    // 기본 수직 외벽 (바깥으로 새어나가는 것 절대 방지)
    const mapHeight = obsEndY + 1000;
    bodies.push(Bodies.rectangle(-thick/2, mapHeight/2, thick, mapHeight + 6000, wallOptions));
    bodies.push(Bodies.rectangle(worldWidth + thick/2, mapHeight/2, thick, mapHeight + 6000, wallOptions));

    // 지그재그 돌출 벽 (화면의 85% 차단하여 완급 조절 밑 강제 지그재그 동선)
    let currentY = startY + 600;
    let isLeft = true;

    while (currentY < obsEndY - 300) {
        const slantLen = worldWidth * 0.85; 
        const xPos = isLeft ? (slantLen/2 - 20) : (worldWidth - slantLen/2 + 20);
        // 무조건 화면 중앙(아래쪽)을 향하도록 각도 강제
        const slAngle = isLeft ? Math.PI / 10 : -Math.PI / 10; 

        // 깔끔하고 두껍게 돌출시켜 지그재그 협곡 연출
        bodies.push(Bodies.rectangle(xPos, currentY, slantLen, 120, {
            isStatic: true, angle: slAngle, render: { fillStyle: '#475569' }
        }));
        
        isLeft = !isLeft;
        currentY += 1000; // 1000px 간격으로 왕복 굴절
    }

    // --- 종료 지점(Finish Line) 공통 생성 로직 ---
    const finishY = obsEndY + 600;
    
    // 중앙으로 모아주는 피니시 최종 깔때기
    const funnelAngle = Math.PI / 5; 
    const funnelX = worldWidth * 0.25;
    const funnelLen = worldWidth * 0.7; 
    
    bodies.push(Bodies.rectangle(funnelX - 10, finishY - 180, funnelLen, 30, {
        isStatic: true, angle: funnelAngle, render: { fillStyle: '#64748b' }
    }));
    bodies.push(Bodies.rectangle(worldWidth - funnelX + 10, finishY - 180, funnelLen, 30, {
        isStatic: true, angle: -funnelAngle, render: { fillStyle: '#64748b' }
    }));

    // 피니시 라인 센서 (통과 시 등수 기록됨)
    const finishLine = Bodies.rectangle(worldWidth/2, finishY, 200, 40, {
        isStatic: true, isSensor: true, label: 'FinishLine', 
        render: { fillStyle: 'rgba(16, 185, 129, 0.4)', strokeStyle: '#10b981', lineWidth: 2 }
    });
    bodies.push(finishLine);

    // 구슬들이 땅 밑으로 영원히 떨어지지 않게 막아주는 최종 창고 바닥
    bodies.push(Bodies.rectangle(worldWidth/2, finishY + 200, worldWidth, 200, wallOptions));
}
