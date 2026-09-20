const tg = window.Telegram.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const width = Math.min(window.innerWidth - 30, 360);
canvas.width = width;
canvas.height = width * 1.45; 

const cellSize = width / 8;
let score = 0;
let board = Array(4).fill().map(() => Array(4).fill(0));

const scoreDisplay = document.getElementById("score");
const tileLayer = document.getElementById("tile-layer");

const btnGame = document.getElementById("btn-game");
const btnLeaderboard = document.getElementById("btn-leaderboard");
const tabGame = document.getElementById("tab-game");
const tabLeaderboard = document.getElementById("tab-leaderboard");
const leaderboardList = document.getElementById("leaderboard-list");

btnGame.addEventListener("click", () => {
    btnGame.classList.add("active"); btnLeaderboard.classList.remove("active");
    tabGame.classList.remove("hidden"); tabLeaderboard.classList.add("hidden");
});

btnLeaderboard.addEventListener("click", () => {
    btnLeaderboard.classList.add("active"); btnGame.classList.remove("active");
    tabGame.classList.add("hidden"); tabLeaderboard.classList.remove("hidden");
    loadLeaderboard();
});

document.getElementById("restart-btn").addEventListener("click", initGame);

function initGame() {
    board = Array(4).fill().map(() => Array(4).fill(0));
    score = 0;
    scoreDisplay.innerText = score;
    addRandomTile(); addRandomTile();
    renderBoard();
}

function addRandomTile() {
    let emptyCells = [];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (board[r][c] === 0) emptyCells.push({ r, c });
        }
    }
    if (emptyCells.length > 0) {
        let cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        board[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
    }
}

function renderBoard() {
    tileLayer.innerHTML = "";
    const spacing = 12;
    const size = 70;

    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            let val = board[r][c];
            if (val > 0) {
                let div = document.createElement("div");
                div.className = `tile tile-${val}`;
                div.innerText = val;
                div.style.top = `${r * (size + spacing)}px`;
                div.style.left = `${c * (size + spacing)}px`;
                tileLayer.appendChild(div);
            }
        }
    }
}

// Корректная логика сжатия и объединения массивов (без багов)
function slideAndMerge(row) {
    // 1. Сдвигаем все числа влево (убираем нули)
    let arr = row.filter(val => val !== 0);
    
    // 2. Объединяем одинаковые соседние элементы
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            score += arr[i];
            arr[i + 1] = 0;
        }
    }
    
    // 3. Снова убираем появившиеся после слияния нули и добиваем массив до длины 4
    arr = arr.filter(val => val !== 0);
    while (arr.length < 4) {
        arr.push(0);
    }
    return arr;
}

function move(dir) {
    let oldBoard = JSON.stringify(board);

    if (dir === "left") {
        for (let i = 0; i < 4; i++) {
            board[i] = slideAndMerge(board[i]);
        }
    } else if (dir === "right") {
        for (let i = 0; i < 4; i++) {
            let row = [...board[i]].reverse();
            row = slideAndMerge(row);
            board[i] = row.reverse();
        }
    } else if (dir === "up") {
        for (let c = 0; c < 4; c++) {
            // Исправлено: Честно собираем вертикальный столбец
            let row = [board[0][c], board[1][c], board[2][c], board[3][c]];
            row = slideAndMerge(row);
            for (let r = 0; r < 4; r++) {
                board[r][c] = row[r];
            }
        }
    } else if (dir === "down") {
        for (let c = 0; c < 4; c++) {
            // Исправлено: Собираем вертикальный столбец и разворачиваем его
            let row = [board[0][c], board[1][c], board[2][c], board[3][c]].reverse();
            row = slideAndMerge(row);
            row.reverse();
            for (let r = 0; r < 4; r++) {
                board[r][c] = row[r];
            }
        }
    }

    if (oldBoard !== JSON.stringify(board)) {
        addRandomTile();
        scoreDisplay.innerText = score;
        renderBoard();
    }
}

// Управление свайпами для мобилок
let touchStartX = 0; let touchStartY = 0;
window.addEventListener("touchstart", e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener("touchend", e => {
    let diffX = e.changedTouches[0].clientX - touchStartX;
    let diffY = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > 30) diffX > 0 ? move("right") : move("left");
    } else {
        if (Math.abs(diffY) > 30) diffY > 0 ? move("down") : move("up");
    }
});

// Управление стрелочками для ПК
window.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") move("left");
    if (e.key === "ArrowRight") move("right");
    if (e.key === "ArrowUp") move("up");
    if (e.key === "ArrowDown") move("down");
});

function loadLeaderboard() {
    leaderboardList.innerHTML = '<div class="loading">Локальный топ временно пуст</div>';
}

// Стартуем игру автоматически
initGame();
