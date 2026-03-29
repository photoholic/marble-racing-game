import * as Matter from 'matter-js';

const { Bodies, Body, Constraint } = Matter;

import { addZigzagBoundaryAndFinish } from '../game/MapBoundary.js';

export default {
    name: "Type C: 다이내믹 파친코",
    getSpawnPoint: (worldWidth) => ({ x: worldWidth / 2, y: 100, width: worldWidth, height: 200 }),
    generate: (worldWidth) => {
        const bodies = [];

        
        const addAutoSpin = (x, y, scale = 1, fixedAirFriction = 0.08) => {
            const center = Bodies.circle(x, y, 5, { isStatic: true, render: { visible: false } });
            const length = 110 * scale;
            const thickness = 14 * scale;
            const bar1 = Bodies.rectangle(x, y, length, thickness, { render: { fillStyle: '#64748b' } });
            const bar2 = Bodies.rectangle(x, y, length, thickness, { render: { fillStyle: '#64748b' }, angle: Math.PI / 2 });
            const cross = Body.create({
                parts: [bar1, bar2],
                frictionAir: fixedAirFriction,
                restitution: 0.0, 
                density: 0.02,
                label: 'AutoSpin',
                render: { fillStyle: '#64748b' }
            });
            // 초당 어느정도 속도로 돌지 모터 속도 부여
            cross.spinSpeed = (Math.random() > 0.5 ? 1 : -1) * (0.015 + Math.random() * 0.015);
            
            const joint = Constraint.create({
                bodyA: center, bodyB: cross, length: 0, stiffness: 1, render: { visible: false }
            });
            bodies.push(center, cross, joint);
        };

        const addSeesaw = (x, y, width) => {
            const board = Bodies.rectangle(x, y, width, 18, { 
                isStatic: true, label: 'Seesaw', // 축에 끼는 문제를 해결하기 위해 수학적 강제 모터로 변경
                render: { fillStyle: '#8b5cf6' } // 보라색 시소
            });
            bodies.push(board);
        };

        const addSwing = (x, y, width) => {
            // 이제 그네 구조(초록색 널빤지, 끈)를 없애고 심플한 거대 노란색 회전 작대기 트랩으로 대체합니다.
            const crankArm = Bodies.rectangle(x, y, width * 0.8, 16, { // 더 굵고 확실하게 타격
                label: 'SwingCrank',
                density: 0.1, render: { fillStyle: '#eab308' } // 노란색
            });
            const crankPivot = Bodies.circle(x, y, 5, { isStatic: true, render: { visible: false } });
            const crankJoint = Constraint.create({
                bodyA: crankPivot, bodyB: crankArm, length: 0, stiffness: 1, render: { visible: false }
            });
            
            bodies.push(crankPivot, crankArm, crankJoint);
        };

        const rows = 20; 
        // 장애물 간격 정교화: 구슬(지름24)이 절대 끼이지 않게 핀 크기 포함 최소 75px 간격 절대 보장
        const spacingX = Math.max(75, worldWidth / 8); 
        const spacingY = 130;  
        const totalCols = Math.floor(worldWidth / spacingX);
        const startY = window.innerHeight * 0.9;  

        let skipRows = 0;
        let lastTrap = '';
        let hasConveyor = false;

        for (let row = 0; row < rows; row++) {
            const currentY = startY + (row * spacingY);

            if (skipRows > 0) {
                skipRows--;
                continue;
            }

            let isTrapRow = false;
            let trapType = null;
            
            // 트랩 등장 구간 (첫 2줄, 마지막 3줄 제외)
            if (row >= 2 && row <= rows - 3) {
                // 약 40% 확률로 특수 트랩 구간 형성 (맵이 짧아졌으므로 확률을 50%로 증가)
                if (Math.random() < 0.50) {
                    const typeRand = Math.random();
                    if (typeRand < 0.15 && lastTrap !== 'funnel') trapType = 'funnel';
                    else if (typeRand < 0.30 && lastTrap !== 'spin') trapType = 'spin';
                    else if (typeRand < 0.45 && lastTrap !== 'seesaw') trapType = 'seesaw';
                    else if (typeRand < 0.60 && lastTrap !== 'swing') trapType = 'swing';
                    else if (typeRand < 0.80 && lastTrap !== 'plank') trapType = 'plank';
                    else if (lastTrap !== 'conveyor') trapType = 'conveyor';
                }
                
                // 짧고 강렬한 맵 특성상, 맵의 정확히 중반부(가운데) 무조건 흐르는 컨베이어 출현 강제
                if (row === Math.floor(rows / 2)) {
                    isTrapRow = true;
                    trapType = 'conveyor';
                }
            }

            if (isTrapRow && trapType) {
                lastTrap = trapType;
                
                if (trapType === 'funnel') {
                    const rampWidth = worldWidth * 0.45;
                    bodies.push(Bodies.rectangle(worldWidth * 0.2, currentY + 40, rampWidth, 16, {
                        isStatic: true, angle: Math.PI / 10, render: { fillStyle: '#334155' }
                    }));
                    bodies.push(Bodies.rectangle(worldWidth * 0.8, currentY + 40, rampWidth, 16, {
                        isStatic: true, angle: -Math.PI / 10, render: { fillStyle: '#334155' }
                    }));
                    skipRows = 1; 
                } 
                else if (trapType === 'spin') {
                    const numItems = Math.random() > 0.5 ? 2 : 3;
                    const pScale = Math.max(0.6, worldWidth / 500); 
                    for(let i=1; i<=numItems; i++) {
                        const px = (worldWidth / (numItems + 1)) * i;
                        if (Math.random() < 0.4) {
                            addAutoSpin(px, currentY, pScale * 0.7, 0.04);
                        } else {
                            addAutoSpin(px, currentY, pScale, 0.08);
                        }
                    }
                    skipRows = 0;
                }
                else if (trapType === 'seesaw') {
                    const padding = worldWidth * 0.25;
                    addSeesaw(padding, currentY, worldWidth * 0.35);
                    addSeesaw(worldWidth - padding, currentY, worldWidth * 0.35);
                    skipRows = 0;
                }
                else if (trapType === 'swing') {
                    addSwing(worldWidth / 2, currentY, worldWidth * 0.45);
                    skipRows = 0;
                }
                else if (trapType === 'plank') {
                    const plankWidth = worldWidth / 3;
                    const plank = Bodies.rectangle(worldWidth/2, currentY, plankWidth, 24, {
                        isStatic: true, label: 'MovingPlank',
                        startX: worldWidth/2, moveRange: worldWidth / 3.5,
                        render: { fillStyle: '#94a3b8' }
                    });
                    bodies.push(plank);
                    skipRows = 0;
                }
                else if (trapType === 'conveyor') {
                    hasConveyor = true;
                    // 구슬의 5배에 달하는 긴 널빤지가 끊어졌다 이어지며 한방향으로 흐르는 기믹
                    const plankLength = 120; 
                    const gap = 90; 
                    const totalUnit = plankLength + gap;
                    // 화면을 벗어나서 루프를 돌 수 있도록 충분히 길게 복제
                    const numPlanks = Math.ceil(worldWidth / totalUnit) + 2; 
                    const direction = Math.random() > 0.5 ? 1 : -1;
                    const speed = 1.8; 

                    for (let i = 0; i < numPlanks; i++) {
                        const cx = (i * totalUnit) - totalUnit;
                        const cPlank = Bodies.rectangle(cx, currentY, plankLength, 16, {
                            isStatic: true, label: 'ConveyorPlank',
                            render: { fillStyle: '#0ea5e9' } 
                        });
                        // 엔진 루프에서 쓰기 위해 물리 객체에 속성 강제 추가
                        cPlank.conveyorDir = direction;
                        cPlank.conveyorSpeed = speed;
                        cPlank.totalUnit = totalUnit;
                        cPlank.numPlanks = numPlanks;
                        cPlank.mapWidth = worldWidth;
                        bodies.push(cPlank);
                    }
                    skipRows = 0;
                }
                
                continue; // 트랩을 설치했으면 해당 열 중앙의 일반 핀은 설치 안함
            }

            // 맵 길이 축소로, 벽면 돌출 범퍼도 더 자주(3줄 배수마다) 출몰
            if (row % 3 === 1 && row >= 2 && row <= rows - 2) {
                // 기존 150px에서 75px로 벽면 장애물 길이 50% 단축
                bodies.push(Bodies.rectangle(20, currentY - 50, 75, 20, {
                    isStatic: true, angle: Math.PI / 6, render: { fillStyle: '#475569' } 
                }));
                // 오른쪽 벽 가장자리
                bodies.push(Bodies.rectangle(worldWidth - 20, currentY - 50, 75, 20, {
                    isStatic: true, angle: -Math.PI / 6, render: { fillStyle: '#475569' }
                }));
            }

            // 일반 장애물 줄 (Bumper, 고정 핀, Jump Pad)
            const isOffset = row % 2 !== 0;
            const cols = isOffset ? totalCols - 1 : totalCols;
            
            for (let col = 0; col < cols; col++) {
                const x = (isOffset ? spacingX / 2 : 0) + (col * spacingX) + (worldWidth - spacingX*(totalCols-1))/2;
                // 겹침 방지를 위해 noise는 대폭 줄임(±6)
                const noiseX = (Math.random() - 0.5) * 12;
                const noiseY = (Math.random() - 0.5) * 12;

                // 벽면 틈새 완전 차단: 구슬이 벽을 스치고 내려갈 수 있도록 무조건 75px 초과의 틈 구비
                let finalX = x + noiseX;
                if (finalX < 75) finalX = (Math.random() < 0.5) ? 0 : 75;
                else if (worldWidth - finalX < 75) finalX = (Math.random() < 0.5) ? worldWidth : worldWidth - 75;

                // 핑크 네온(초탄성)과 화이트 파우더(무탄성) 확률 분기
                const isJumpPad = Math.random() < 0.12; 
                const isWhitePad = !isJumpPad && Math.random() < 0.12;

                if (isJumpPad) {
                    bodies.push(Bodies.rectangle(finalX, currentY + noiseY, 35, 12, {
                        isStatic: true,
                        angle: (Math.random() - 0.5) * Math.PI / 2, 
                        restitution: 1.8, // 핑크: 강력 반발력
                        render: { fillStyle: '#ec4899', strokeStyle: '#fbcfe8', lineWidth: 2 } 
                    }));
                } else if (isWhitePad) {
                    bodies.push(Bodies.rectangle(finalX, currentY + noiseY, 35, 12, {
                        isStatic: true,
                        angle: (Math.random() - 0.5) * Math.PI / 2, 
                        restitution: 0.1, // 화이트: 무탄성(푹신함)
                        render: { fillStyle: '#ffffff', strokeStyle: '#cbd5e1', lineWidth: 2 } 
                    }));
                } else {
                    // 원형 핀 사이즈 대폭 다변화 (가장 작은 3부터 큰 12까지 섞임)
                    const radius = 3 + Math.random() * 9;
                    bodies.push(Bodies.circle(finalX, currentY + noiseY, radius, {
                        isStatic: true,
                        restitution: radius > 9 ? 1.2 : 0.6, // 큰 핀은 범퍼 역할을 하도록 탄성 증폭
                        render: { fillStyle: radius > 9 ? '#94a3b8' : '#475569' } 
                    }));
                }
            }
        }

        // --- 마지막 깔끔한 관문존 (Final Zone) ---
        let obsY = startY + rows * spacingY + 80;
        
        const zigzagWidth = worldWidth * 0.8;
        bodies.push(Bodies.rectangle(zigzagWidth/2 - 40, obsY, zigzagWidth, 30, {
            isStatic: true, angle: Math.PI / 15, render: { fillStyle: '#334155' }
        }));
        
        obsY += 160;
        
        // 마지막에도 널빤지 확정 배치
        const finalPlankWidth = worldWidth / 3;
        const finalPlank = Bodies.rectangle(worldWidth/2, obsY, finalPlankWidth, 24, {
            isStatic: true, label: 'MovingPlank',
            startX: worldWidth/2, moveRange: worldWidth / 3.5,
            render: { fillStyle: '#94a3b8' }
        });
        bodies.push(finalPlank);

        // --- 진짜 결승선 ---
        const obsEndY = obsY;
        addZigzagBoundaryAndFinish(bodies, worldWidth, startY, obsEndY);
        
        return bodies;
    }
};
