import './style.css';
import { EngineSetup } from './physics/Engine.js';
import { MapLoader } from './game/MapLoader.js';
import { MarbleManager } from './game/Marbles.js';
import mapTypeC from './maps/typeC_pachinko.js';
import mapPins from './maps/map_pins_only.js';
import mapSeesaws from './maps/map_seesaws.js';
import mapBumpers from './maps/map_bumpers.js';

const mapsConfig = {
    'mixed': mapTypeC,
    'pins': mapPins,
    'seesaws': mapSeesaws,
    'bumpers': mapBumpers
};

let engineSetup, mapLoader, marbleManager;
let currentRank = 1;

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const startScreen = document.getElementById('start-screen');
    const standbyUi = document.getElementById('standby-ui');
    const startRaceBtn = document.getElementById('start-race-btn');
    const backToStartBtn = document.getElementById('back-to-start-btn');
    const countdownDisplay = document.getElementById('countdown-display');
    const leaderboard = document.getElementById('leaderboard');
    const placeBtn = document.getElementById('place-btn');
    const restartBtn = document.getElementById('restart-btn');
    const playerCountInput = document.getElementById('player-count');
    const mapSelectInput = document.getElementById('map-select');
    const rankList = document.getElementById('rank-list');
    const toast = document.getElementById('toast');

    engineSetup = new EngineSetup(canvas);
    mapLoader = new MapLoader(engineSetup);
    marbleManager = new MarbleManager(engineSetup);

    engineSetup.resize();
    window.addEventListener('resize', () => engineSetup.resize());

    mapLoader.onMarbleFinish = (marble) => {
        if (!marble.isFinished) {
            marble.isFinished = true;
            
            toast.textContent = `${currentRank}위: ${marble.marbleName} 통과! 🎉`;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2000);

            const li = document.createElement('li');
            if (currentRank === 1) li.classList.add('rank-1');
            else if (currentRank === 2) li.classList.add('rank-2');
            else if (currentRank === 3) li.classList.add('rank-3');
            
            li.innerHTML = `<span class="rank-num">${currentRank}</span><span class="marble-name">${marble.marbleName}</span>`;
            rankList.appendChild(li);

            marble.render.opacity = 0.5;

            currentRank++;

            if (currentRank > parseInt(playerCountInput.value)) {
                setTimeout(() => {
                    leaderboard.classList.remove('hidden');
                    const liveRankings = document.getElementById('live-rankings');
                    if (liveRankings) liveRankings.classList.add('hidden');
                }, 1500);
            }
        }
    };

    placeBtn.addEventListener('click', () => {
        const count = Math.min(100, Math.max(2, parseInt(playerCountInput.value) || 10)); // Min 2, Max 100
        const selectedMapData = mapsConfig[mapSelectInput.value] || mapTypeC;
        
        startScreen.classList.add('hidden');
        rankList.innerHTML = '';
        currentRank = 1;

        engineSetup.clearWorld();
        mapLoader.loadMap(selectedMapData);
        
        // 하늘 공중에 멈춘 상태로 구슬들을 간격을 두어 배치합니다
        marbleManager.spawnMarbles(count, selectedMapData.getSpawnPoint(window.innerWidth));
        
        engineSetup.start();

        // 출발 대기 UI 띄우기 및 랭킹표, 뒤로가기 버튼 활성화
        standbyUi.classList.remove('hidden');
        document.getElementById('back-to-start-btn').classList.remove('hidden');
        
        // 두번째 화면(구슬 배치)부터 실시간 순위 표시!
        const liveRankings = document.getElementById('live-rankings');
        if (liveRankings) {
            liveRankings.classList.remove('hidden');
            document.getElementById('live-ranking-list').innerHTML = ''; // 초기화
        }

        // 스마트폰 고스트 클릭 방어 (의도치 않은 출발 방지용 0.5초 무적)
        const raceBtn = document.getElementById('start-race-btn');
        raceBtn.disabled = true;
        raceBtn.style.opacity = '0.5';
        setTimeout(() => {
            raceBtn.disabled = false;
            raceBtn.style.opacity = '1';
        }, 500);
    });

    backToStartBtn.addEventListener('click', () => {
        standbyUi.classList.add('hidden');
        document.getElementById('back-to-start-btn').classList.add('hidden');
        document.getElementById('live-rankings')?.classList.add('hidden');
        
        startScreen.classList.remove('hidden');
        engineSetup.stop();
        engineSetup.clearWorld();
    });

    startRaceBtn.addEventListener('click', () => {
        standbyUi.classList.add('hidden');
        document.getElementById('back-to-start-btn').classList.add('hidden');
        
        let count = 3;
        countdownDisplay.textContent = count;
        countdownDisplay.style.color = "white";
        countdownDisplay.classList.remove('hidden');
        countdownDisplay.classList.add('active');
        
        const countInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownDisplay.textContent = count;
                countdownDisplay.classList.remove('active');
                void countdownDisplay.offsetWidth; // trigger reflow to restart css animation
                countdownDisplay.classList.add('active');
            } else if (count === 0) {
                countdownDisplay.textContent = "GO!";
                countdownDisplay.style.color = "#10b981";
                countdownDisplay.style.textShadow = "0 10px 30px rgba(0,0,0,0.8), 0 0 50px #10b981";
                countdownDisplay.classList.remove('active');
                void countdownDisplay.offsetWidth;
                countdownDisplay.classList.add('active');
                
                // 엔진의 구슬들을 정지 해제하여 떨어뜨립니다
                marbleManager.releaseMarbles();
            } else {
                clearInterval(countInterval);
                countdownDisplay.classList.remove('active');
                countdownDisplay.classList.add('hidden');
            }
        }, 1000);
    });

    restartBtn.addEventListener('click', () => {
        // 모든 진행중이던 팝업 및 UI 패널 완전 클리어
        leaderboard.classList.add('hidden');
        standbyUi.classList.add('hidden');
        countdownDisplay.classList.add('hidden');
        const liveRankings = document.getElementById('live-rankings');
        if (liveRankings) liveRankings.classList.add('hidden');
        document.getElementById('back-to-start-btn').classList.add('hidden');
        
        // 시작 화면 (맵 선택화면) 무조건 노출
        startScreen.classList.remove('hidden');
        
        // 모터/엔진 사이클 및 물리 객체 전부 삭제, 카메라 원상 복구
        engineSetup.stop();
        engineSetup.clearWorld();
    });
});
