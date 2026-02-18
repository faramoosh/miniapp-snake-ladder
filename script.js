// --- تعریف نقشه مارها و پله‌ها ---
// کلید: خانه مبدا, مقدار: خانه مقصد
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
let currentPosition = 1;      // موقعیت فعلی بازیکن (از خانه 1 شروع می‌کنیم)
let diceValue = 1;            // مقدار پیش‌فرض تاس
let isMoving = false;         // برای جلوگیری از تقلب و کلیک هنگام حرکت

// المنت‌های DOM
const boardElement = document.getElementById('board');
const playerPositionSpan = document.getElementById('playerPosition');
const diceElement = document.getElementById('dice');
const rollBtn = document.getElementById('rollDiceBtn');
const newGameBtn = document.getElementById('newGameBtn');
const gameMessage = document.getElementById('gameMessage');

// --- ساخت صفحه بازی (10x10) به صورت داینامیک با شماره‌گذاری مارپیچی ---
function createBoard() {
    boardElement.innerHTML = '';
    const totalCells = 100;
    const cells = [];

    // آرایه‌ای از شماره خانه‌ها به ترتیب مارپیچی بسازیم
    for (let row = 0; row < 10; row++) {
        const rowNumbers = [];
        for (let col = 0; col < 10; col++) {
            let number;
            if (row % 2 === 0) {
                // ردیف‌های زوج: چپ به راست
                number = (9 - row) * 10 + col + 1;
            } else {
                // ردیف‌های فرد: راست به چپ
                number = (9 - row) * 10 + (9 - col) + 1;
            }
            rowNumbers.push(number);
        }
        cells.push(...rowNumbers);
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
    }

    // به‌روزرسانی متن موقعیت
    playerPositionSpan.textContent = currentPosition;
}

// --- افکت چرخش تاس و تولید عدد تصادفی ---
function rollDice() {
    return Math.floor(Math.random() * 6) + 1; // عدد بین 1 تا 6
}

// --- انیمیشن تاس (تغییر سریع شکلک‌ها) ---
async function animateDice(finalValue) {
    const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * 6);
        diceElement.textContent = diceFaces[randomIndex];
        await new Promise(resolve => setTimeout(resolve, 50)); // تاخیر 50 میلی‌ثانیه
    }
    // نمایش نتیجه نهایی با شکلک عدد
    const diceEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
    diceElement.textContent = diceEmoji[finalValue - 1];
}

// --- حرکت بازیکن با تاخیر (برای نمایش قدم به قدم) ---
async function movePlayer(steps) {
    return new Promise((resolve) => {
        let stepCount = 0;
        const intervalTime = 200; // 200 میلی‌ثانیه بین هر حرکت

        const interval = setInterval(() => {
            if (stepCount >= steps || currentPosition >= 100) {
                clearInterval(interval);
                resolve();
                return;
            }

            // یک خانه جلو برو
            currentPosition++;
            stepCount++;

            // بررسی نرسیدن به آخر از 100
            if (currentPosition > 100) {
                currentPosition = 100; // اگر از 100 رد شد، در 100 بمان
                clearInterval(interval);
                resolve();
                return;
            }

            updatePlayerPosition();

            // اگر به آخر خط رسیدیم و هنوز steps تموم نشده، متوقف کن
            if (currentPosition === 100) {
                clearInterval(interval);
                resolve();
            }
        }, intervalTime);
    });
}

// --- تابع اصلی اجرای نوبت ---
async function handleRoll() {
    if (isMoving) return; // اگر در حال حرکتیم، دکمه کار نکند
    if (currentPosition === 100) {
        gameMessage.textContent = "🎉 شما برنده شدید! دکمه 'بازی جدید' را بزنید.";
        return;
    }

    isMoving = true;
    rollBtn.disabled = true;
    
    // 1. پرتاب تاس و انیمیشن
    const diceNumber = rollDice();
    await animateDice(diceNumber);
    
    // 2. بررسی که حرکت باعث نشود از 100 رد شویم
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

    // 4. بررسی مار و پله
    if (snakesAndLadders[currentPosition]) {
        const destination = snakesAndLadders[currentPosition];
        if (destination > currentPosition) {
            gameMessage.textContent = "🎉 یه پله! برو بالا...";
        } else {
            gameMessage.textContent = "😱 اوه! مار تو را گاز گرفت...";
        }

        // تاخیر برای دیدن پیام قبل از انتقال
        await new Promise(resolve => setTimeout(resolve, 700));
        
        currentPosition = destination;
        updatePlayerPosition();
    }

    // 5. بررسی برد
    if (currentPosition === 100) {
        gameMessage.textContent = "🏆 آفرین! شما برنده شدید!";
    } else {
        gameMessage.textContent = "👌 نوبت بعدی، دکمه تاس را بزن.";
    }

    isMoving = false;
    rollBtn.disabled = false;
}

// --- شروع بازی جدید ---
function newGame() {
    if (isMoving) return; // اگر در حال حرکتیم، اجازه نده
    
    currentPosition = 1;
    diceElement.textContent = '🎲';
    updatePlayerPosition();
    gameMessage.textContent = "بازی جدید! شانس خود را امتحان کن.";
}

// --- رویدادها (Event Listeners) ---
rollBtn.addEventListener('click', handleRoll);
newGameBtn.addEventListener('click', newGame);

// --- مقداردهی اولیه ---
createBoard();
updatePlayerPosition();
