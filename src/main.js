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

    let isStandbyReady = false;

    // 브라우저 History(뒤로가기) 모션 대응을 위한 초기 상태 등록
    window.history.replaceState({ page: 'start' }, "");
    
    // 안드로이드 물리 뒤로가기 버튼 감지 로직
    window.addEventListener('popstate', (e) => {
        if (!e.state || e.state.page === 'start') {
            // 사용자가 브라우저 뒤로가기를 눌러 'start' 상태로 돌아온 경우, UI 완전 초기화 진행
            isStandbyReady = false;
            standbyUi.classList.add('hidden');
            document.getElementById('back-to-start-btn').classList.add('hidden');
            countdownDisplay.classList.add('hidden');
            countdownDisplay.classList.remove('active');
            leaderboard.classList.add('hidden');
            
            const liveRankings = document.getElementById('live-rankings');
            if (liveRankings) liveRankings.classList.add('hidden');
            
            startScreen.classList.remove('hidden');
            engineSetup.stop();
            engineSetup.clearWorld();
        }
    });

    placeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // 레이스 화면 진입 시 가상 이동(History) 추가
        window.history.pushState({ page: 'game' }, "");
        
        const count = Math.min(100, Math.max(2, parseInt(playerCountInput.value) || 10));
        const selectedMapData = mapsConfig[mapSelectInput.value] || mapTypeC;
        
        startScreen.classList.add('hidden');
        rankList.innerHTML = '';
        currentRank = 1;

        engineSetup.clearWorld();
        mapLoader.loadMap(selectedMapData);
        
        marbleManager.spawnMarbles(count, selectedMapData.getSpawnPoint(window.innerWidth));
        
        engineSetup.start();

        standbyUi.classList.remove('hidden');
        document.getElementById('back-to-start-btn').classList.remove('hidden');
        
        const liveRankings = document.getElementById('live-rankings');
        if (liveRankings) {
            liveRankings.classList.add('hidden');
            document.getElementById('live-ranking-list').innerHTML = '';
        }

        isStandbyReady = false;
        setTimeout(() => { isStandbyReady = true; }, 300);
    });

    backToStartBtn.addEventListener('click', () => {
        // 스크린상의 뒤로가기 버튼을 눌렀을 때도 History 상태를 일치시킴
        window.history.replaceState({ page: 'start' }, "");
        
        isStandbyReady = false;
        standbyUi.classList.add('hidden');
        document.getElementById('back-to-start-btn').classList.add('hidden');
        document.getElementById('live-rankings')?.classList.add('hidden');
        
        startScreen.classList.remove('hidden');
        engineSetup.stop();
        engineSetup.clearWorld();
    });

    startRaceBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!isStandbyReady) return;
        isStandbyReady = false;

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
                void countdownDisplay.offsetWidth;
                countdownDisplay.classList.add('active');
            } else if (count === 0) {
                countdownDisplay.textContent = "GO!";
                countdownDisplay.style.color = "#10b981";
                countdownDisplay.style.textShadow = "0 10px 30px rgba(0,0,0,0.8), 0 0 50px #10b981";
                countdownDisplay.classList.remove('active');
                void countdownDisplay.offsetWidth;
                countdownDisplay.classList.add('active');
                
                marbleManager.releaseMarbles();
                
                const liveRankings = document.getElementById('live-rankings');
                if (liveRankings) liveRankings.classList.remove('hidden');
            } else {
                clearInterval(countInterval);
                countdownDisplay.classList.remove('active');
                countdownDisplay.classList.add('hidden');
            }
        }, 1000);
    });

    restartBtn.addEventListener('click', () => {
        // 다시 시작하기를 눌러도 초기 화면으로 가므로 History 상태 일치
        window.history.replaceState({ page: 'start' }, "");
        
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
