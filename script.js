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
let grid = Array(8).fill().map(() => Array(8).fill(0));

// ИСПРАВЛЕНО: Массивы фигур заданы вручную и без пропусков (1 - блок, 0 - пусто)
const SHAPES_DATABASE = [
    { shape: [[1]], color: "#ff4757" }, // Одиночный блок 1х1
    { shape: [[1,1],[1,1]], color: "#1e90ff" }, // Квадрат 2х2
    { shape: [[1,1,1]], color: "#2ed573" }, // Линия 3х1
    { shape: [[1],[1],[1]], color: "#2ed573" }, // Линия 1х3
    { shape: [[1,1,1,1]], color: "#ffa502" }, // Полоса 4х1
    { shape: [[1],[1],[1],[1]], color: "#ffa502" }, // Полоса 1х4
    { shape: [[1,0],[1,0],[1,1]], color: "#9b59b6" }, // L-образная уголок
    { shape: [[1,1,1],[0,1,0]], color: "#ff007f" } // Т-образная
];

let pieces = [];
let dragPiece = null;
let offsetX = 0;
let offsetY = 0;

function generatePieces() {
    pieces = [];
    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * SHAPES_DATABASE.length);
        const template = SHAPES_DATABASE[randomIndex];
        
        const rows = template.shape.length;
        const cols = template.shape[0].length;
        const previewCellSize = cellSize * 0.5;

        pieces.push({
            shape: template.shape,
            color: template.color,
            x: i * (width / 3) + (width / 6) - (cols * previewCellSize) / 2,
            y: width + 45,
            origX: i * (width / 3) + (width / 6) - (cols * previewCellSize) / 2,
            origY: width + 45,
            cols: cols,
            rows: rows
        });
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Отрисовка шахматной доски 8х8
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (grid[r][c]) {
                ctx.fillStyle = grid[r][c];
            } else {
                ctx.fillStyle = (r + c) % 2 === 0 ? "#191a29" : "#1f2035";
            }
            ctx.fillRect(c * cellSize + 1, r * cellSize + 1, cellSize - 2, cellSize - 2);
        }
    }

    // Подставка под блоки внизу
    ctx.fillStyle = "#0e0f18";
    ctx.fillRect(5, width + 15, width - 10, canvas.height - width - 20);

    pieces.forEach(p => {
        if (p === dragPiece) return;
        drawBlock(p, p.x, p.y, cellSize * 0.5);
    });

    if (dragPiece) {
        drawBlock(dragPiece, dragPiece.x, dragPiece.y, cellSize);
    }
}

function drawBlock(p, startX, startY, size) {
    ctx.fillStyle = p.color;
    for (let r = 0; r < p.shape.length; r++) {
        for (let c = 0; c < p.shape[r].length; c++) {
            if (p.shape[r][c] === 1) {
                ctx.fillRect(startX + c * size + 1, startY + r * size + 1, size - 2, size - 2);
            }
        }
    }
}

function checkLines() {
    let rowsToClear = [];
    let colsToClear = [];

    for (let r = 0; r < 8; r++) {
        if (grid[r].every(cell => cell !== 0)) rowsToClear.push(r);
    }

    for (let c = 0; c < 8; c++) {
        let isColFull = true;
        for (let r = 0; r < 8; r++) {
            if (grid[r][c] === 0) { isColFull = false; break; }
        }
        if (isColFull) colsToClear.push(c);
    }

    rowsToClear.forEach(r => grid[r].fill(0));
    colsToClear.forEach(c => {
        for (let r = 0; r < 8; r++) grid[r][c] = 0;
    });

    if (rowsToClear.length > 0 || colsToClear.length > 0) {
        score += (rowsToClear.length + colsToClear.length) * 10;
        document.getElementById("score").innerText = score;
    }
}

function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches.clientX : e.clientX;
    const clientY = e.touches ? e.touches.clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
}

function startDrag(e) {
    const pos = getCoordinates(e);
    dragPiece = pieces.find(p => {
        const size = cellSize * 0.5;
        const w = p.cols * size;
        const h = p.rows * size;
        return pos.x >= p.x && pos.x <= p.x + w && pos.y >= p.y && pos.y <= p.y + h;
    });

    if (dragPiece) {
        offsetX = (dragPiece.cols * cellSize) / 2;
        offsetY = (dragPiece.rows * cellSize) + 30;
        dragPiece.x = pos.x - offsetX;
        dragPiece.y = pos.y - offsetY;
        draw();
    }
}

function moveDrag(e) {
    if (!dragPiece) return;
    if (e.touches) e.preventDefault();
    const pos = getCoordinates(e);
    dragPiece.x = pos.x - offsetX;
    dragPiece.y = pos.y - offsetY;
    draw();
}

function endDrag() {
    if (!dragPiece) return;

    const gridC = Math.round(dragPiece.x / cellSize);
    const gridR = Math.round(dragPiece.y / cellSize);
    let canPlace = true;

    for (let r = 0; r < dragPiece.shape.length; r++) {
        for (let c = 0; c < dragPiece.shape[r].length; c++) {
            if (dragPiece.shape[r][c] === 1) {
                let targetR = gridR + r;
                let targetC = gridC + c;
                if (targetR < 0 || targetR >= 8 || targetC < 0 || targetC >= 8 || grid[targetR][targetC] !== 0) {
                    canPlace = false;
                }
            }
        }
    }

    if (canPlace) {
        for (let r = 0; r < dragPiece.shape.length; r++) {
            for (let c = 0; c < dragPiece.shape[r].length; c++) {
                if (dragPiece.shape[r][c] === 1) {
                    grid[gridR + r][gridC + c] = dragPiece.color;
                }
            }
        }
        pieces = pieces.filter(p => p !== dragPiece);
        score += 4;
        document.getElementById("score").innerText = score;
        checkLines();
        if (pieces.length === 0) generatePieces();
    } else {
        dragPiece.x = dragPiece.origX;
        dragPiece.y = dragPiece.origY;
    }
    dragPiece = null;
    draw();
}

canvas.addEventListener("mousedown", startDrag);
canvas.addEventListener("mousemove", moveDrag);
window.addEventListener("mouseup", endDrag);

canvas.addEventListener("touchstart", startDrag, { passive: false });
canvas.addEventListener("touchmove", moveDrag, { passive: false });
canvas.addEventListener("touchend", endDrag);

generatePieces();
draw();
