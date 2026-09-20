const tg = window.Telegram.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
}

let board = Array(4).fill().map(() => Array(4).fill(0));
let score = 0;

const scoreDisplay = document.getElementById("score");
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

// НАДЕЖНЫЙ ОТРЕНДЕР: Вставляем цифры прямо в сетку HTML
function renderBoard() {
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const cellIndex = r * 4 + c;
            const cellElement = document.getElementById(`c-${cellIndex}`);
            
            // Очищаем ячейку перед отрисовкой
            cellElement.innerHTML = "";
            cellElement.className = "grid-cell"; 

            let val = board[r][c];
            if (val > 0) {
                // Создаем блок текста внутри ячейки доски
                let tileDiv = document.createElement("div");
                tileDiv.className = `tile tile-${val}`;
                tileDiv.innerText = val;
                
                // Делаем так, чтобы плитка растягивалась ровно по размеру ячейки
                tileDiv.style.width = "100%";
                tileDiv.style.height = "100%";
                tileDiv.style.display = "flex";
                tileDiv.style.alignItems = "center";
                tileDiv.style.justifyContent = "center";
                tileDiv.style.borderRadius = "10px";
                
                cellElement.appendChild(tileDiv);
            }
        }
    }
}

function slideAndMerge(row) {
    let arr = row.filter(val => val !== 0);
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            score += arr[i];
            arr[i + 1] = 0;
        }
    }
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
            let row = [board[0][c], board[1][c], board[2][c], board[3][c]];
            row = slideAndMerge(row);
            for (let r = 0; r < 4; r++) {
                board[r][c] = row[r];
            }
        }
    } else if (dir === "down") {
        for (let c = 0; c < 4; c++) {
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

// Управление свайпами
let touchStartX = 0; let touchStartY = 0;
window.addEventListener("touchstart", e => {
    touchStartX = e.touches.clientX;
    touchStartY = e.touches.clientY;
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

// Управление клавиатурой на ПК
window.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") move("left");
    if (e.key === "ArrowRight") move("right");
    if (e.key === "ArrowUp") move("up");
    if (e.key === "ArrowDown") move("down");
});

// Автостарт
initGame();
