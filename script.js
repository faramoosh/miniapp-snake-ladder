// ==================== تنظیمات اولیه ====================
const snakesAndLadders = {
    // پله‌ها
    4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91,
    // مارها
    17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 99: 78
};

// تعریف بازیکنان
const PLAYERS = [
    { id: 0, name: 'قرمز', emoji: '🔴', color: '#ff5252' },
    { id: 1, name: 'آبی', emoji: '🔵', color: '#4287f5' },
    { id: 2, name: 'سبز', emoji: '🟢', color: '#4caf50' },
    { id: 3, name: 'زرد', emoji: '🟡', color: '#ffeb3b' }
];

// متغیرهای اصلی بازی
let players = []; // بازیکنان فعال
let currentPlayerIndex = 0; // ایندکس بازیکن فعلی
let gameActive = false;
let isMoving = false;
let audioEnabled = true;

// ==================== سیستم صدا ====================
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    if (!audioEnabled || !audioCtx) return;
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    gainNode.gain.value = 0.2;
    
    const now = audioCtx.currentTime;
    
    switch(type) {
        case 'dice':
            oscillator.frequency.value = 400;
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            oscillator.start(now);
            oscillator.stop(now + 0.2);
            break;
            
        case 'snake':
            oscillator.frequency.value = 200;
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            oscillator.start(now);
            oscillator.stop(now + 0.4);
            break;
            
        case 'ladder':
            oscillator.frequency.setValueAtTime(300, now);
            oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.3);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
            break;
            
        case 'win':
            // پخش چند نت پشت سر هم
            const notes = [523, 659, 784, 1046];
            notes.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.value = freq;
                gain.gain.value = 0.2;
                osc.start(now + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
                osc.stop(now + i * 0.1 + 0.3);
            });
            break;
            
        case 'move':
            oscillator.frequency.value = 300 + Math.random() * 200;
            gainNode.gain.value = 0.1;
            oscillator.start(now);
            oscillator.stop(now + 0.05);
            break;
    }
}

// ==================== ساخت صفحه بازی ====================
function createBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
            let number;
            if (row % 2 === 0) {
                number = (9 - row) * 10 + col + 1;
            } else {
                number = (9 - row) * 10 + (9 - col) + 1;
            }
            
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = number;
            
            // شماره خانه
            const numberSpan = document.createElement('span');
            numberSpan.textContent = number;
            cell.appendChild(numberSpan);
            
            // آیکون مار یا پله
            if (snakesAndLadders[number]) {
                const iconSpan = document.createElement('span');
                iconSpan.className = 'cell-special';
                
                if (snakesAndLadders[number] > number) {
                    iconSpan.textContent = '⬆️';
                    cell.style.backgroundColor = '#d4e6b5';
                } else {
                    iconSpan.textContent = '⬇️';
                    cell.style.backgroundColor = '#ffd1d1';
                }
                cell.appendChild(iconSpan);
            }
            
            boardElement.appendChild(cell);
        }
    }
}

// ==================== نمایش مهره‌های بازیکنان ====================
function updateAllPieces() {
    // پاک کردن همه مهره‌ها
    document.querySelectorAll('.player-piece').forEach(p => p.remove());
    
    // اضافه کردن مهره‌ها برای هر بازیکن
    players.forEach((player, index) => {
        if (player.position >= 1 && player.position <= 100) {
            const cell = document.querySelector(`.cell[data-index="${player.position}"]`);
            if (cell) {
                const piece = document.createElement('span');
                piece.className = 'player-piece';
                piece.textContent = player.emoji;
                piece.style.fontSize = '0.9rem';
                piece.style.marginRight = '2px';
                piece.title = `بازیکن ${player.name}`;
                cell.appendChild(piece);
            }
        }
    });
    
    // به‌روزرسانی نمایش وضعیت
    updatePlayersStatus();
}

// ==================== به‌روزرسانی وضعیت بازیکنان ====================
function updatePlayersStatus() {
    const container = document.getElementById('playersPosition');
    if (!container) return;
    
    container.innerHTML = '';
    players.forEach((player, index) => {
        const badge = document.createElement('span');
        badge.className = 'player-badge';
        badge.innerHTML = `${player.emoji} ${player.name}: ${player.position}`;
        if (index === currentPlayerIndex && gameActive) {
            badge.style.border = '3px solid white';
            badge.style.transform = 'scale(1.05)';
        }
        container.appendChild(badge);
    });
    
    // به‌روزرسانی نمایش نوبت
    const turnEmoji = document.getElementById('turnEmoji');
    const turnText = document.getElementById('turnText');
    if (gameActive && players.length > 0) {
        turnEmoji.textContent = players[currentPlayerIndex].emoji;
        turnText.textContent = `نوبت بازیکن ${players[currentPlayerIndex].name}`;
    }
}

// ==================== حرکت بازیکن ====================
async function movePlayer(playerId, steps) {
    return new Promise((resolve) => {
        let stepCount = 0;
        const intervalTime = 200;
        
        const interval = setInterval(() => {
            if (stepCount >= steps || players[playerId].position >= 100) {
                clearInterval(interval);
                resolve();
                return;
            }
            
            players[playerId].position++;
            stepCount++;
            
            if (players[playerId].position > 100) {
                players[playerId].position = 100;
                clearInterval(interval);
                resolve();
                return;
            }
            
            playSound('move');
            updateAllPieces();
            
            if (players[playerId].position === 100) {
                clearInterval(interval);
                resolve();
            }
        }, intervalTime);
    });
}

// ==================== انیمیشن مار یا پله ====================
async function animateSpecialCell(cellNumber, isSnake) {
    const cell = document.querySelector(`.cell[data-index="${cellNumber}"]`);
    if (!cell) return;
    
    const originalColor = cell.style.backgroundColor;
    
    if (isSnake) {
        cell.style.backgroundColor = '#ff0000';
        cell.style.transform = 'scale(1.1)';
        playSound('snake');
        await new Promise(r => setTimeout(r, 400));
    } else {
        cell.style.backgroundColor = '#00ff00';
        cell.style.transform = 'scale(1.1)';
        playSound('ladder');
        await new Promise(r => setTimeout(r, 400));
    }
    
    cell.style.backgroundColor = originalColor;
    cell.style.transform = 'scale(1)';
}

// ==================== تابع اصلی بازی ====================
async function handleRoll() {
    if (!gameActive || isMoving) return;
    
    // راه‌اندازی صدا در اولین کلیک
    initAudio();
    
    const currentPlayer = players[currentPlayerIndex];
    
    // بررسی برد
    if (currentPlayer.position === 100) {
        document.getElementById('gameMessage').textContent = 
            `${currentPlayer.emoji} بازیکن ${currentPlayer.name} قبلاً برنده شده! بازی جدید شروع کن.`;
        return;
    }
    
    isMoving = true;
    document.getElementById('rollDiceBtn').disabled = true;
    
    // پرتاب تاس
    const diceNumber = Math.floor(Math.random() * 6) + 1;
    await animateDice(diceNumber);
    playSound('dice');
    
    // بررسی عدم تجاوز از 100
    const newPos = currentPlayer.position + diceNumber;
    if (newPos > 100) {
        document.getElementById('gameMessage').textContent = 
            `${currentPlayer.emoji} باید دقیقاً ۱۰۰ بیای. ${diceNumber} اومد، ${100 - currentPlayer.position} لازم بود.`;
        
        // رفتن به بازیکن بعدی
        goToNextPlayer();
        isMoving = false;
        document.getElementById('rollDiceBtn').disabled = false;
        return;
    }
    
    document.getElementById('gameMessage').textContent = 
        `${currentPlayer.emoji} عدد ${diceNumber} اومد...`;
    
    // حرکت
    await movePlayer(currentPlayerIndex, diceNumber);
    
    // بررسی مار و پله
    const finalPos = players[currentPlayerIndex].position;
    if (snakesAndLadders[finalPos]) {
        const destination = snakesAndLadders[finalPos];
        const isSnake = destination < finalPos;
        
        await animateSpecialCell(finalPos, isSnake);
        
        players[currentPlayerIndex].position = destination;
        updateAllPieces();
    }
    
    // بررسی برد
    if (players[currentPlayerIndex].position === 100) {
        document.getElementById('gameMessage').textContent = 
            `🏆 ${currentPlayer.emoji} بازیکن ${currentPlayer.name} برنده شد! 🏆`;
        playSound('win');
        
        // غیرفعال کردن بازی
        gameActive = false;
        isMoving = false;
        document.getElementById('rollDiceBtn').disabled = false;
        updateAllPieces();
        return;
    }
    
    // رفتن به بازیکن بعدی
    goToNextPlayer();
    
    isMoving = false;
    document.getElementById('rollDiceBtn').disabled = false;
}

// ==================== انیمیشن تاس ====================
async function animateDice(finalValue) {
    const diceElement = document.getElementById('dice');
    const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    
    for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * 6);
        diceElement.textContent = diceFaces[randomIndex];
        await new Promise(r => setTimeout(r, 50));
    }
    
    const diceEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
    diceElement.textContent = diceEmoji[finalValue - 1];
}

// ==================== رفتن به بازیکن بعدی ====================
function goToNextPlayer() {
    let nextIndex = currentPlayerIndex;
    do {
        nextIndex = (nextIndex + 1) % players.length;
    } while (players[nextIndex].position === 100 && nextIndex !== currentPlayerIndex);
    
    currentPlayerIndex = nextIndex;
    updateAllPieces();
}

// ==================== شروع بازی جدید ====================
function startNewGame(playerCount = 2) {
    // فعال‌سازی صدا
    initAudio();
    
    // ساخت لیست بازیکنان
    players = [];
    for (let i = 0; i < playerCount; i++) {
        players.push({
            ...PLAYERS[i],
            position: 1
        });
    }
    
    currentPlayerIndex = 0;
    gameActive = true;
    isMoving = false;
    
    // نمایش بخش وضعیت
    document.getElementById('playerSelector').style.display = 'none';
    document.getElementById('gameStatus').style.display = 'block';
    
    // ریست تاس
    document.getElementById('dice').textContent = '🎲';
    
    // ساخت صفحه و نمایش مهره‌ها
    createBoard();
    updateAllPieces();
    
    document.getElementById('gameMessage').textContent = 
        `بازی شروع شد! ${players[0].emoji} بازیکن ${players[0].name} شروع کن.`;
    
    document.getElementById('rollDiceBtn').disabled = false;
}

// ==================== رویدادها ====================
document.addEventListener('DOMContentLoaded', () => {
    createBoard();
    
    // انتخاب تعداد بازیکنان
    document.querySelectorAll('.player-count-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.player-count-btn').forEach(b => 
                b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // دکمه شروع بازی
    document.getElementById('startGameBtn').addEventListener('click', () => {
        const activeBtn = document.querySelector('.player-count-btn.active');
        const count = parseInt(activeBtn.dataset.count);
        startNewGame(count);
    });
    
    // دکمه تاس
    document.getElementById('rollDiceBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        handleRoll();
    });
    
    // تاچ روی صفحه
    document.body.addEventListener('touchstart', (e) => {
        if (!e.target.closest('button') && gameActive && !isMoving) {
            handleRoll();
        }
    });
    
    // کلیک موس (برای دیباگ)
    document.body.addEventListener('click', (e) => {
        if (!e.target.closest('button') && gameActive && !isMoving) {
            handleRoll();
        }
    });
});
