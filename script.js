const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

let board = Array(4).fill().map(() => Array(4).fill(0));
let score = 0;
let username = "Игрок";
let userId = "0";

if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    username = user.first_name || user.username || "Аноним";
    userId = user.id.toString();
}

const SERVER_URL = "http://127.0.0.1:8080"; 

const scoreDisplay = document.getElementById("score");
const tileLayer = document.getElementById("tile-layer");
const leaderboardList = document.getElementById("leaderboard-list");

const btnGame = document.getElementById("btn-game");
const btnLeaderboard = document.getElementById("btn-leaderboard");
const tabGame = document.getElementById("tab-game");
const tabLeaderboard = document.getElementById("tab-leaderboard");

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
            let row = [board[c], board[c], board[c], board[c]];
            if (dir === "down") row.reverse();
            row = merge(row);
            if (dir === "down") row.reverse();
            for (let r = 0; r < 4; r++) board[r][c] = row[r];
        }
    }
    if (oldBoard !== JSON.stringify(board)) {
        addRandomTile(); scoreDisplay.innerText = score; renderBoard();
        sendScoreToServer(score);
    }
}

function sendScoreToServer(currentScore) {
    fetch(`${SERVER_URL}/api/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, name: username, score: currentScore })
    }).catch(e => console.log(e));
}

function loadLeaderboard() {
    leaderboardList.innerHTML = '<div class="loading">Синхронизация...</div>';
    fetch(`${SERVER_URL}/api/leaderboard`)
        .then(res => res.json())
        .then(data => {
            leaderboardList.innerHTML = "";
            if (data.length === 0) {
                leaderboardList.innerHTML = '<div class="loading">Топ пуст!</div>';
                return;
            }
            data.forEach((p, i) => {
                leaderboardList.innerHTML += `
                    <div class="player-row">
                        <span class="player-name">${i+1}. ${p.name}</span>
                        <span class="player-score">${p.score} ⚡</span>
                    </div>`;
            });
        })
        .catch(() => {
            leaderboardList.innerHTML = '<div class="loading" style="color:#ff4757">Ошибка сервера</div>';
        });
}

initGame();
