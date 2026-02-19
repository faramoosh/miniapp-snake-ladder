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
    
    // آرایه‌ای از شماره خانه‌ها به ترتیب مارپیچی بسازیم
    const cells = [];
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
            let number;
            if (row % 2 === 0) {
                number = (9 - row) * 10 + col + 1;
            } else {
                number = (9 - row) * 10 + (9 - col) + 1;
            }
            cells.push(number);
        }
    }

    // ایجاد سلول‌ها
    cells.forEach(number => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = number;
        
        // نمایش شماره خانه (خط اول)
        const numberSpan = document.createElement('span');
        numberSpan.textContent = number;
        cell.appendChild(numberSpan);

        // بررسی وجود مار یا پله در این خانه
        if (snakesAndLadders[number]) {
            const specialIcon = document.createElement('span');
            specialIcon.className = 'cell-special';
            
            if (snakesAndLadders[number] > number) {
                // اینجا پله است - استفاده از نمادهای مطمئن
                specialIcon.textContent = ' ⬆️ پله'; // ⬆️ همه‌جا پشتیبانی می‌شه
                cell.style.background = '#d4e6b5'; // رنگ سبز ملایم برای پله
            } else {
                // اینجا مار است
                specialIcon.textContent = ' 🐍 مار'; // 🐍 همه‌جا پشتیبانی می‌شه
                cell.style.background = '#f9cfcf'; // رنگ قرمز ملایم برای مار
            }
            cell.appendChild(specialIcon);
        }

        boardElement.appendChild(cell);
    });
}

    // ایجاد سلول‌ها
    cells.forEach(number => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = number;
        
        // نمایش شماره خانه
        const numberSpan = document.createElement('span');
        numberSpan.textContent = number;
        cell.appendChild(numberSpan);

        // بررسی وجود مار یا پله در این خانه
        if (snakesAndLadders[number]) {
            const specialIcon = document.createElement('span');
            specialIcon.className = 'cell-special';
            // تشخیص مار یا پله
            if (snakesAndLadders[number] > number) {
                specialIcon.textContent = ' 🪜'; // پله
            } else {
                specialIcon.textContent = ' 🐍'; // مار
            }
            cell.appendChild(specialIcon);
        }

        boardElement.appendChild(cell);
    });
    
    console.log("تعداد سلول‌های ساخته شده:", cells.length); // برای دیباگ
}

// --- به‌روزرسانی نمایش موقعیت بازیکن روی صفحه و متن ---
function updatePlayerPosition() {
    // حذف کلاس player از همه سلول‌ها
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('player');
    });

    // اضافه کردن کلاس player به خانه فعلی
    const currentCell = document.querySelector(`.cell[data-index="${currentPosition}"]`);
    if (currentCell) {
        currentCell.classList.add('player');
    } else {
        console.log("سلول پیدا نشد برای موقعیت:", currentPosition);
    }

    // به‌روزرسانی متن موقعیت
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
        if (isSnake) {
            cell.classList.add('snake-animation');
            await new Promise(resolve => setTimeout(resolve, 600));
            cell.classList.remove('snake-animation');
        } else {
            cell.classList.add('ladder-animation');
            await new Promise(resolve => setTimeout(resolve, 500));
            cell.classList.remove('ladder-animation');
        }
    }
}

// --- تابع اصلی اجرای نوبت ---
async function handleRoll() {
    console.log("handleRoll اجرا شد، موقعیت فعلی:", currentPosition);
    
    if (isMoving) {
        console.log("در حال حرکت هستیم...");
        return;
    }
    
    if (currentPosition === 100) {
        gameMessage.textContent = "🎉 شما برنده شدید! دکمه 'بازی جدید' را بزنید.";
        return;
    }

    isMoving = true;
    rollBtn.disabled = true;
    
    // 1. پرتاب تاس
    const diceNumber = rollDice();
    console.log("عدد تاس:", diceNumber);
    await animateDice(diceNumber);
    
    // 2. بررسی اینکه حرکت باعث نشود از 100 رد شویم
    let newPosition = currentPosition + diceNumber;
    if (newPosition > 100) {
        gameMessage.textContent = `⚡ باید دقیقاً 100 بیای. ${diceNumber} آمد، ${100 - currentPosition} لازم بود.`;
        isMoving = false;
        rollBtn.disabled = false;
        return;
    }

    gameMessage.textContent = `🎲 عدد ${diceNumber} آمد...`;

    // 3. حرکت تکه‌تکه
    await movePlayer(diceNumber);

    // 4. بررسی مار و پله با انیمیشن
    if (snakesAndLadders[currentPosition]) {
        const destination = snakesAndLadders[currentPosition];
        const isSnake = destination < currentPosition;
        
        // نمایش انیمیشن در خانه فعلی
        await showSpecialAnimation(currentPosition, isSnake);
        
        if (isSnake) {
            gameMessage.textContent = "😱 مار تو را گاز گرفت و پایین آمدی...";
        } else {
            gameMessage.textContent = "🎉 پله! برو بالا...";
        }

        await new Promise(resolve => setTimeout(resolve, 700));
        
        currentPosition = destination;
        updatePlayerPosition();
    }

    // 5. بررسی برد
    if (currentPosition === 100) {
        gameMessage.textContent = "🏆 آفرین! شما برنده شدید!";
    } else {
        gameMessage.textContent = "👌 ضربه بزن تا تاس بعدی را بیندازی.";
    }

    isMoving = false;
    rollBtn.disabled = false;
}

// --- شروع بازی جدید ---
function newGame() {
    console.log("بازی جدید شروع شد");
    if (isMoving) return;
    
    currentPosition = 1;
    diceElement.textContent = '🎲';
    updatePlayerPosition();
    gameMessage.textContent = "بازی جدید! روی صفحه ضربه بزن تا تاس بیندازی.";
}

// --- رویدادها (Event Listeners) ---

// ضربه روی کل صفحه به جز دکمه‌ها
document.body.addEventListener('touchstart', (e) => {
    // اگر روی دکمه‌ها کلیک نشده و بازی در حال حرکت نیست
    if (!e.target.closest('button') && !isMoving && currentPosition !== 100) {
        console.log("ضربه روی صفحه تشخیص داده شد");
        handleRoll();
    }
});

// همچنین برای کلیک موس (برای تست در کامپیوتر)
document.body.addEventListener('click', (e) => {
    if (!e.target.closest('button') && !isMoving && currentPosition !== 100) {
        console.log("کلیک روی صفحه تشخیص داده شد");
        handleRoll();
    }
});

// دکمه تاس
if (rollBtn) {
    rollBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log("دکمه تاس کلیک شد");
        handleRoll();
    });
}

// دکمه بازی جدید
if (newGameBtn) {
    newGameBtn.addEventListener('click', newGame);
}

// --- مقداردهی اولیه ---
console.log("صفحه در حال بارگذاری است...");
createBoard();
updatePlayerPosition();
gameMessage.textContent = "روی صفحه ضربه بزن تا تاس بیندازی!";
