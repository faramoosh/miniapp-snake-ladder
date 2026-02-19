// --- تعریف نقشه مارها و پله‌ها ---
const snakesAndLadders = {
    // پله‌ها (صعود)
    4: 14,
    9: 31,
    20: 38,
    28: 84,
    40: 59,
    51: 67,
    63: 81,
    71: 91,
    // مارها (سقوط)
    17: 7,
    54: 34,
    62: 19,
    64: 60,
    87: 24,
    93: 73,
    95: 75,
    99: 78
};

// متغیرهای اصلی بازی
let currentPosition = 1;
let isMoving = false;

// المنت‌های DOM
const boardElement = document.getElementById('board');
const playerPositionSpan = document.getElementById('playerPosition');
const diceElement = document.getElementById('dice');
const rollBtn = document.getElementById('rollDiceBtn');
const newGameBtn = document.getElementById('newGameBtn');
const gameMessage = document.getElementById('gameMessage');

// --- ساخت صفحه بازی (10x10) به صورت مارپیچی ---
function createBoard() {
    console.log("ساخت صفحه بازی...");
    boardElement.innerHTML = '';
    
    // ساخت ۱۰۰ سلول با شماره‌گذاری مارپیچی
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
            let number;
            if (row % 2 === 0) {
                // ردیف‌های زوج: چپ به راست
                number = (9 - row) * 10 + col + 1;
            } else {
                // ردیف‌های فرد: راست به چپ
                number = (9 - row) * 10 + (9 - col) + 1;
            }
            
            // ایجاد سلول
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = number;
            
            // شماره خانه
            const numberSpan = document.createElement('span');
            numberSpan.textContent = number;
            cell.appendChild(numberSpan);
            
            // بررسی وجود مار یا پله
            if (snakesAndLadders[number]) {
                const specialIcon = document.createElement('span');
                specialIcon.className = 'cell-special';
                
                if (snakesAndLadders[number] > number) {
                    // پله
                    specialIcon.textContent = '🔝';
                    cell.style.backgroundColor = '#d4e6b5';
                } else {
                    // مار
                    specialIcon.textContent = '🐍';
                    cell.style.backgroundColor = '#ffd1d1';
                }
                cell.appendChild(specialIcon);
            }
            
            boardElement.appendChild(cell);
        }
    }
    
    console.log("تعداد سلول‌های ساخته شده:", boardElement.children.length);
}

// --- به‌روزرسانی نمایش موقعیت بازیکن ---
function updatePlayerPosition() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('player');
    });

    const currentCell = document.querySelector(`.cell[data-index="${currentPosition}"]`);
    if (currentCell) {
        currentCell.classList.add('player');
    }

    playerPositionSpan.textContent = currentPosition;
}

// --- پرتاب تاس ---
function rollDice() {
    return Math.floor(Math.random() * 6) + 1;
}

// --- انیمیشن تاس ---
async function animateDice(finalValue) {
    const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * 6);
        diceElement.textContent = diceFaces[randomIndex];
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    const diceEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
    diceElement.textContent = diceEmoji[finalValue - 1];
}

// --- حرکت بازیکن با تاخیر ---
async function movePlayer(steps) {
    return new Promise((resolve) => {
        let stepCount = 0;
        const intervalTime = 200;

        const interval = setInterval(() => {
            if (stepCount >= steps || currentPosition >= 100) {
                clearInterval(interval);
                resolve();
                return;
            }

            currentPosition++;
            stepCount++;

            if (currentPosition > 100) {
                currentPosition = 100;
                clearInterval(interval);
                resolve();
                return;
            }

            updatePlayerPosition();

            if (currentPosition === 100) {
                clearInterval(interval);
                resolve();
            }
        }, intervalTime);
    });
}

// --- انیمیشن مار یا پله ---
async function showSpecialAnimation(cellNumber, isSnake) {
    const cell = document.querySelector(`.cell[data-index="${cellNumber}"]`);
    if (cell) {
        const originalColor = cell.style.backgroundColor;
        if (isSnake) {
            cell.style.backgroundColor = '#ff0000';
            cell.style.transform = 'scale(1.1)';
            await new Promise(resolve => setTimeout(resolve, 300));
            cell.style.backgroundColor = '#ffd1d1';
            cell.style.transform = 'scale(1)';
        } else {
            cell.style.backgroundColor = '#00ff00';
            cell.style.transform = 'scale(1.1)';
            await new Promise(resolve => setTimeout(resolve, 300));
            cell.style.backgroundColor = '#d4e6b5';
            cell.style.transform = 'scale(1)';
        }
    }
}

// --- تابع اصلی اجرای نوبت ---
async function handleRoll() {
    if (isMoving) return;
    
    if (currentPosition === 100) {
        gameMessage.textContent = "🎉 شما برنده شدید! دکمه 'بازی جدید' را بزنید.";
        return;
    }

    isMoving = true;
    rollBtn.disabled = true;
    
    const diceNumber = rollDice();
    await animateDice(diceNumber);
    
    let newPosition = currentPosition + diceNumber;
    if (newPosition > 100) {
        gameMessage.textContent = `⚡ باید دقیقاً 100 بیای. ${diceNumber} آمد، ${100 - currentPosition} لازم بود.`;
        isMoving = false;
        rollBtn.disabled = false;
        return;
    }

    gameMessage.textContent = `🎲 عدد ${diceNumber} آمد...`;
    await movePlayer(diceNumber);

    if (snakesAndLadders[currentPosition]) {
        const destination = snakesAndLadders[currentPosition];
        const isSnake = destination < currentPosition;
        
        await showSpecialAnimation(currentPosition, isSnake);
        
        if (isSnake) {
            gameMessage.textContent = "😱 مار! پایین می‌روی...";
        } else {
            gameMessage.textContent = "🎉 پله! بالا می‌روی...";
        }

        await new Promise(resolve => setTimeout(resolve, 700));
        
        currentPosition = destination;
        updatePlayerPosition();
    }

    if (currentPosition === 100) {
        gameMessage.textContent = "🏆 آفرین! شما برنده شدید!";
    } else {
        gameMessage.textContent = "👌 نوبت بعدی...";
    }

    isMoving = false;
    rollBtn.disabled = false;
}

// --- شروع بازی جدید ---
function newGame() {
    if (isMoving) return;
    
    currentPosition = 1;
    diceElement.textContent = '🎲';
    updatePlayerPosition();
    gameMessage.textContent = "بازی جدید! تاس بنداز.";
}

// --- رویدادها ---
rollBtn.addEventListener('click', handleRoll);
newGameBtn.addEventListener('click', newGame);

// --- مقداردهی اولیه ---
createBoard();
updatePlayerPosition();
gameMessage.textContent = "تاس بنداز و شروع کن!";
