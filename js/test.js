// ======================= CONSTANTS & VARIABLES ==========================
const rows = 6;
const cols = 6;
const cellSize = 100;

const gemsList = [
    "gemA", "gemB", "gemC", "gemD", "gemE",
    "gemF", "gemG", "gemH", "gemI", "gemJ"
];

const grid = document.getElementById("grid");
const cells = [];   // DOM elements
const board = [];   // string matrix

let playerLock = false;
let totalScore = 0;
let totalCombo = 0;

// NEW: Flag that tracks if THIS MOVE produced a match
let moveMadeMatch = false;


// ======================= UI / HELPERS ==========================
const e = document.getElementsByClassName('close');
const closeA = e[0];
const closeB = e[1];
const closeC = e[2];
const closeD = e[3];

const n = document.getElementsByClassName('next');
const nextA = n[0];
const nextB = n[1];
const nextC = n[2];

function randomGem() {
    return gemsList[Math.floor(Math.random() * gemsList.length)];
}

function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}

function Update() {
    document.getElementById('displayScore').textContent = totalScore;
    document.getElementById('displayMult').textContent = totalCombo;
}

function showScorePopup(score, mult) {
    let popup = document.createElement('div');
    if (mult > 1 && score > 0) {
        popup.textContent = `Combo! ${score} × ${mult}!`;
        popup.className = 'score-popup';
    } else if (mult <= 1 && score > 0) {
        popup.textContent = `+ ${score}!`;
        popup.className = 'score-popup';
    }

    if (score > 0) document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
}


// ======================= BASIC MOVE ==========================
function move(fromR, fromC, toR, toC) {
    const el = cells[fromR][fromC];

    cells[toR][toC] = el;
    board[toR][toC] = board[fromR][fromC];

    cells[fromR][fromC] = null;
    board[fromR][fromC] = "empty";

    el.dataset.r = toR;
    el.dataset.c = toC;

    el.style.transition = "transform .3s";
    el.style.transform = `translate(${toC * cellSize}px, ${toR * cellSize}px)`;
}


// ======================= SHIFT ROW / COL ==========================
function shiftRow(r, dir) {
    if (dir > 0) {
        const lastGem = board[r][cols - 1];
        const lastEl = cells[r][cols - 1];
        for (let c = cols - 1; c > 0; c--) {
            board[r][c] = board[r][c - 1];
            cells[r][c] = cells[r][c - 1];
        }
        board[r][0] = lastGem;
        cells[r][0] = lastEl;
    } else {
        const firstGem = board[r][0];
        const firstEl = cells[r][0];
        for (let c = 0; c < cols - 1; c++) {
            board[r][c] = board[r][c + 1];
            cells[r][c] = cells[r][c + 1];
        }
        board[r][cols - 1] = firstGem;
        cells[r][cols - 1] = firstEl;
    }

    for (let c = 0; c < cols; c++) {
        const el = cells[r][c];
        el.dataset.c = c;
        el.style.transform = `translate(${c * cellSize}px, ${r * cellSize}px)`;
    }
}

function shiftCol(c, dir) {
    if (dir > 0) {
        const lastGem = board[rows - 1][c];
        const lastEl = cells[rows - 1][c];
        for (let r = rows - 1; r > 0; r--) {
            board[r][c] = board[r - 1][c];
            cells[r][c] = cells[r - 1][c];
        }
        board[0][c] = lastGem;
        cells[0][c] = lastEl;
    } else {
        const firstGem = board[0][c];
        const firstEl = cells[0][c];
        for (let r = 0; r < rows - 1; r++) {
            board[r][c] = board[r + 1][c];
            cells[r][c] = cells[r + 1][c];
        }
        board[rows - 1][c] = firstGem;
        cells[rows - 1][c] = firstEl;
    }

    for (let r = 0; r < rows; r++) {
        const el = cells[r][c];
        el.dataset.r = r;
        el.style.transform = `translate(${c * cellSize}px, ${r * cellSize}px)`;
    }
}


// ======================= MATCH SYSTEM ==========================
async function matchCheck() {
    if (playerLock) return;
    playerLock = true;

    let totalMoveScore = 0;

    while (true) {
        const matched = [];
        const visited = Array.from({ length: rows }, () =>
            Array(cols).fill(false)
        );

        function flood(r, c, gem, group) {
            if (r < 0 || r >= rows || c < 0 || c >= cols) return;
            if (visited[r][c]) return;
            if (board[r][c] !== gem) return;

            visited[r][c] = true;
            group.push([r, c]);

            flood(r + 1, c, gem, group);
            flood(r - 1, c, gem, group);
            flood(r, c + 1, gem, group);
            flood(r, c - 1, gem, group);
        }

        // find groups
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (visited[r][c]) continue;
                if (board[r][c] === "empty") continue;

                const group = [];
                flood(r, c, board[r][c], group);

                if (group.length >= 3) matched.push(...group);
            }
        }

        if (matched.length === 0) break;

        // Mark that THIS MOVE has matches
        moveMadeMatch = true;

        const comboMult = 1 + (1 - 1) * 0.5; // fixed: no cascade combo
        totalMoveScore += Math.floor(matched.length * 500 * 1);

        // Fade gems
        matched.forEach(([r, c]) => {
            const el = cells[r][c];
            if (el) el.style.opacity = ".3";
        });
        await delay(300);

        // Remove gems
        matched.forEach(([r, c]) => {
            board[r][c] = "empty";
            if (cells[r][c]) cells[r][c].remove();
            cells[r][c] = null;
        });

        await stabilize();
    }

    totalScore += totalMoveScore;
    Update();
    showScorePopup(totalMoveScore, totalCombo);

    playerLock = false;
}


// ======================= GRAVITY + REFILL ==========================
function gravity() {
    let moved = false;

    for (let c = 0; c < cols; c++) {
        for (let r = rows - 1; r >= 0; r--) {

            if (board[r][c] === "empty") {

                let k = r - 1;
                while (k >= 0 && board[k][c] === "empty") k--;

                if (k >= 0) {
                    move(k, c, r, c);
                    moved = true;
                }
            }
        }
    }
    return moved;
}

function refill() {
    let filled = false;

    for (let c = 0; c < cols; c++) {

        for (let r = 0; r < rows; r++) {

            if (board[r][c] !== "empty") break;

            const gem = randomGem();
            board[r][c] = gem;

            const el = document.createElement("div");
            el.className = "cell " + gem;
            el.dataset.r = r;
            el.dataset.c = c;

            el.style.opacity = "0";
            el.style.transform = `translate(${c * cellSize}px, ${-cellSize}px)`;

            grid.appendChild(el);
            cells[r][c] = el;

            requestAnimationFrame(() => {
                el.style.transition = "transform .3s, opacity .3s";
                el.style.transform =
                    `translate(${c * cellSize}px, ${r * cellSize}px)`;
                el.style.opacity = "1";
            });

            filled = true;
        }
    }

    return filled;
}

async function stabilize() {
    while (true) {
        if (gravity()) {
            await delay(300);
            continue;
        }

        if (refill()) {
            await delay(300);
            continue;
        }

        break;
    }
}


// ======================= RULES POPUPS ==========================
RulesA.showModal();

nextA.addEventListener("click", () => { RulesA.close(); RulesB.showModal(); });
nextB.addEventListener("click", () => { RulesB.close(); RulesC.showModal(); });
nextC.addEventListener("click", () => { RulesC.close(); RulesD.showModal(); });

closeA.addEventListener("click", () => { RulesA.close(); makeGrid(); });
closeB.addEventListener("click", () => { RulesB.close(); makeGrid(); });
closeC.addEventListener("click", () => { RulesC.close(); makeGrid(); });
closeD.addEventListener("click", () => { RulesD.close(); makeGrid(); });


// ======================= GRID INITIALIZATION ==========================
function makeGrid() {
    grid.innerHTML = "";
    for (let r = 0; r < rows; r++) {
        cells[r] = [];
        board[r] = [];
        for (let c = 0; c < cols; c++) {

            const gem = randomGem();
            board[r][c] = gem;

            const el = document.createElement("div");
            el.className = "cell " + gem;
            el.dataset.r = r;
            el.dataset.c = c;
            el.style.transform = `translate(${c * cellSize}px, ${r * cellSize}px)`;

            grid.appendChild(el);
            cells[r][c] = el;
        }
    }

    matchCheck();
}


// ======================= INPUT LISTENERS ==========================
let dragging = false;
let startX = 0, startY = 0;
let startCell = null;
let direction = null;

grid.addEventListener("mousedown", e => {
    if (playerLock) return;
    if (!e.target.classList.contains("cell")) return;

    startCell = e.target;
    startX = e.clientX;
    startY = e.clientY;
    dragging = true;
    direction = null;
});

grid.addEventListener("mousemove", e => {
    if (!dragging || playerLock) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const r = +startCell.dataset.r;
    const c = +startCell.dataset.c;

    if (!direction) {
        if (Math.abs(dx) > 15) direction = "row";
        else if (Math.abs(dy) > 15) direction = "col";
        else return;
    }

    if (direction === "row" && Math.abs(dx) >= cellSize) {
        shiftRow(r, Math.sign(dx));
        startX += Math.sign(dx) * cellSize;
    }

    if (direction === "col" && Math.abs(dy) >= cellSize) {
        shiftCol(c, Math.sign(dy));
        startY += Math.sign(dy) * cellSize;
    }
});

grid.addEventListener("mouseup", async e => {
    if (!dragging || playerLock) return;

    dragging = false;

    moveMadeMatch = false;
    await matchCheck();

    if (moveMadeMatch) totalCombo++;
    else totalCombo = 0;

    Update();
});

grid.addEventListener("dblclick", async e => {
    if (playerLock) return;
    if (!e.target.classList.contains("cell")) return;

    const r = +e.target.dataset.r;
    const c = +e.target.dataset.c;

    board[r][c] = "empty";
    cells[r][c].remove();
    cells[r][c] = null;

    await stabilize();

    moveMadeMatch = false;
    await matchCheck();
    if (moveMadeMatch) totalCombo++;
    else totalCombo = 0;

    Update();
});
