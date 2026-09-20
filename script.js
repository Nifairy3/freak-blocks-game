const tg = window.Telegram.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
}

let board = Array(4).fill().map(() => Array(4).fill(0));
let score = 0;

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

// Управление свайпами для телефонов
let touchStartX = 0; let touchStartY = 0;
window.addEventListener("touchstart", e => {
    touchStartX = e.touches.clientX; touchStartY = e.touches.clientY;
}, { passive: true });

window.addEventListener("touchend", e => {
    let diffX = e.changedTouches.clientX - touchStartX;
    let diffY = e.changedTouches.clientY - touchStartY;
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > 30) diffX > 0 ? move("right") : move("left");
    } else {
        if (Math.abs(diffY) > 30) diffY > 0 ? move("down") : move("up");
    }
});

// Управление клавиатурой для ПК (Стрелочки)
window.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") move("left");
    if (e.key === "ArrowRight") move("right");
    if (e.key === "ArrowUp") move("up");
    if (e.key === "ArrowDown") move("down");
});

function slide(row) {
    let arr = row.filter(val => val);
    let missing = 4 - arr.length;
    return arr.concat(Array(missing).fill(0));
}

function merge(row) {
    row = slide(row);
    for (let i = 0; i < 3; i++) {
        if (row[i] === row[i+1] && row[i] !== 0) {
            row[i] *= 2; score += row[i]; row[i+1] = 0;
        }
    }
    return slide(row);
}

function move(dir) {
    let oldBoard = JSON.stringify(board);
    if (dir === "left" || dir === "right") {
        for (let i = 0; i < 4; i++) {
            let row = board[i];
            if (dir === "right") row.reverse();
            row = merge(row);
            if (dir === "right") row.reverse();
            board[i] = row;
        }
    } else {
        for (let c = 0; c < 4; c++) {
            let row = [board[0][c], board[1][c], board[2][c], board[3][c]];
            if (dir === "down") row.reverse();
            row = merge(row);
            if (dir === "down") row.reverse();
            for (let r = 0; r < 4; r++) board[r][c] = row[r];
        }
    }
    if (oldBoard !== JSON.stringify(board)) {
        addRandomTile(); scoreDisplay.innerText = score; renderBoard();
    }
}

function loadLeaderboard() {
    leaderboardList.innerHTML = '<div class="loading">Локальный топ временно пуст</div>';
}

initGame();
