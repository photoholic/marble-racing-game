import mapTypeC from './typeC_pachinko.js';
import { addZigzagBoundaryAndFinish } from '../game/MapBoundary.js';

export default {
    name: "The Glass Breaker (Chaos)",
    description: "Every single obstacle from Map 1 can shatter! Break through the chaos to pave the way.",
    getSpawnPoint: mapTypeC.getSpawnPoint,
    generate(worldWidth, mapHeight) {
        // 1. 1번 맵의 제너레이터를 그대로 호출해서 모든 구조물을 가져옵니다.
        // 2. 이때 1번 맵 제너레이터 내에서 addZigzagBoundaryAndFinish가 호출되어 외벽과 피니시라인이 함께 생성됩니다.
        const bodies = mapTypeC.generate(worldWidth, mapHeight);
        
        // 3. 외벽, 피니시라인(센서), 너무 거대한 지그재그 벽면은 파괴 불가하게 설정
        for (let body of bodies) {
            // (1) 센서가 아니고 (2) area가 10만 미만인 일반 장애물들만 파괴 가능
            if (!body.isSensor && body.area < 100000 && body.label !== 'Wall') {
                body.isBreakable = true;
                
                // 유리처럼 보이게 색상 일괄 변경 (투명한 하늘색 느낌)
                if (body.render) {
                    body.render.fillStyle = 'rgba(56, 189, 248, 0.4)';
                    body.render.strokeStyle = '#38bdf8';
                    body.render.lineWidth = 1;
                }
                
                // 엔진.js의 복합체 파츠 배열에 대해 각각 렌더링 값 수정
                if (body.parts && body.parts.length > 1) {
                    for (let part of body.parts) {
                        if (part.render) {
                            part.render.fillStyle = 'rgba(56, 189, 248, 0.4)';
                            part.render.strokeStyle = '#38bdf8';
                            part.render.lineWidth = 1;
                        }
                    }
                }
            }
        }

        return bodies;
    }
};
