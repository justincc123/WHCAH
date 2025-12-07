// ==========================FIREBASE=============================================
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { addDoc, collection, getDocs, getFirestore, limit, onSnapshot, orderBy, query } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAeukRpuNoSSIgiElFS2eofuJ9c3MuaofE",
    authDomain: "final-projec-b1bf3.firebaseapp.com",
    projectId: "final-projec-b1bf3",
    storageBucket: "final-projec-b1bf3.firebasestorage.app",
    messagingSenderId: "978057527794",
    appId: "1:978057527794:web:dba5509a787cca4fb4eb6b",
    measurementId: "G-CB1MBH76ZJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const dailyL = collection(db, "Daily_Leaderboards");
const weeklyL = collection(db, "Weekly_Leaderboards");
const allTimeL = collection(db, "All-Time_Leaderboards");


async function init() {
    const snap = await getDocs(dailyL);
    snap.forEach(doc => console.log(doc.data()));
}
init();

// =================== LEADERBOARD SYSTEM ===================

// Map of main leaderboard containers
const mainLB = {
    daily: dailyL,
    weekly: weeklyL,
    all: allTimeL
};

// Game-Over leaderboard containers
const gameOverLB = {
    "alt-daily": dailyL,
    "alt-weekly": weeklyL,
    "alt-all": allTimeL
};

function renderLeaderboardSnapshot(snapshot, containerId, playerName, playerScore) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const scores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort by score descending, then timestamp descending
    scores.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0);
    });

    let html = "";

    // Calculate player rank
    let playerRank = -1;
    scores.forEach((entry, i) => {
        if (entry.name === playerName) {
            playerRank = i + 1;
        }
    });

    // Render top 10 leaderboard
    const top10 = scores.slice(0, 10);
    top10.forEach((entry, i) => {
    const isCurrentPlayer = playerName && entry.name === playerName && entry.score === playerScore;
    const highlight = isCurrentPlayer ? " class='highlight-score'" : "";
    html += `<div ${highlight}>${i + 1}. ${entry.name} — ${entry.score}</div>`;
});


    // If player is outside top 10, show their rank separately
    if (playerRank !== -1 && playerRank > 10) {
        html += `<div class="player-rank highlight-score">Your Rank: ${playerRank} — ${playerName}: ${playerScore}</div>`;
    }

    container.innerHTML = html;
}



function attachMainLeaderboards() {
    Object.entries(mainLB).forEach(([containerId, colRef]) => {
        const qMain = query(
            colRef,
            orderBy("score", "desc"),
            orderBy("timestamp", "desc"),
            limit(50)
        );

        onSnapshot(qMain, (snap) => {
            renderLeaderboardSnapshot(
                snap,
                containerId,
                currentPlayerName,
                currentPlayerScore
            );
        });
    });
}

// Attach live listeners to game-over leaderboard
function attachGameOverLeaderboards() {
    Object.entries(gameOverLB).forEach(([containerId, colRef]) => {
        const qOver = query(
            colRef,
            orderBy("score", "desc"),
            orderBy("timestamp", "desc"),
            limit(50)
        );

        onSnapshot(qOver, (snap) => {
            renderLeaderboardSnapshot(
                snap,
                containerId,
                currentPlayerName,
                currentPlayerScore
            );
        });
    });
}

attachMainLeaderboards();

document.querySelectorAll("#tabs .tab-btn")
    .forEach(btn => {
        btn.addEventListener("click", () => {

            document.querySelectorAll("#tabs .tab-btn")
                .forEach(b => b.classList.remove("active"));
            document.querySelectorAll("#leaderboards .lb-tab")
                .forEach(tab => tab.classList.remove("active"));

            btn.classList.add("active");
            const tabId = btn.dataset.target;
            document.getElementById(tabId).classList.add("active");
        });
    });

const backendbtn = document.querySelectorAll(".tab-btn")[2];

async function saveHighScore(name, score, callback) {
    try {
        // Daily leaderboard
        await addDoc(dailyL, { name, score, timestamp: new Date() });
        // Weekly leaderboard
        await addDoc(weeklyL, { name, score, timestamp: new Date() });
        // All-time leaderboard
        await addDoc(allTimeL, { name, score, timestamp: new Date() });

        console.log("Score saved successfully!");
        if (callback) callback();
    } catch (err) {
        console.error("Error saving score:", err);
    }
}

// ======================= CONSTANTS & VARIABLES ==========================
const rows = 6;
const cols = 6;
const cellSize = 100;

const gemsList = [
    "gemA", "gemB", "gemC", "gemD", "gemE",
    "gemF", "gemG", "gemH", "gemI", "gemJ"
];

const tipList = [
    "Be careful, breaking a gem costs 1s, and breaks your combo too...",
    "In a pinch? Double clicking removes locks from gems",
    "A higher combo grants more time",
    "Try to save bigger matches for when you have a higher combo",
]

const grid = document.getElementById("grid");
const cells = [];
const board = [];

const timer = document.getElementById('time');
let running = false;
let loop = null;
let lFrame = null;
let scoreTime = null;

let playerLock = false;
let totalScore = 0;
let totalCombo = 0;
var time = 60;

let lockToast = false;
let moveMadeMatch = false;
const pauseTip = document.getElementById("pauseTip");
const gameOverTip = document.getElementById("gameOverTip");


// ======================= UI ==============================
const e = document.getElementsByClassName('close');
const closeA = e[0];
const closeB = e[1];
const closeC = e[2];
const closeD = e[3];
const resume = e[4];

const n = document.getElementsByClassName('next');
const nextA = n[0];
const nextB = n[1];
const nextC = n[2];

const pause = document.getElementById('pause');
const rules = document.getElementById('rules');


function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}

function pauseGame() {
    pauseScreen.showModal();
    running = false;
    chooseTip(pauseTip);
}

function RulesPauseGame() {
    RulesA.showModal();
    running = false;
}

function resumeGame() {
    pauseScreen.close();
    timerStart();
}

function Update() {
    document.getElementById('displayScore').textContent = totalScore;
    document.getElementById('displayMult').textContent = totalCombo;
}

function showScorePopup(score, mult) {
    let popup = document.createElement('div');
    if (mult > 1 && score > 0) {
        popup.textContent = `Combo ×${1 + (mult * 0.5)}! +${score}`;
        popup.className = 'score-popup';
    } else if (mult <= 1 && score > 0) {
        popup.textContent = `+ ${score} pts!`;
        popup.className = 'score-popup';
    }

    if (score > 0) document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
}

// ==========================BACKEND FUNCTIONS=================================================================


// ================= GAME-OVER LEADERBOARD TABS ===================
document.querySelectorAll("#gameOverTabs .gameOver-tab-btn")
    .forEach(button => {
        button.addEventListener("click", () => {

            // remove active from buttons
            document.querySelectorAll("#gameOverTabs .gameOver-tab-btn")
                .forEach(btn => btn.classList.remove("active"));

            // remove active from tab contents
            document.querySelectorAll("#gameOver .lb-tab")
                .forEach(tab => tab.classList.remove("active"));

            // activate clicked button
            button.classList.add("active");

            // show correct leaderboard
            const targetId = button.dataset.target;
            document.getElementById(targetId).classList.add("active");
        });
    });



function randomGem() {
    return gemsList[Math.floor(Math.random() * gemsList.length)];
}

function locked(gem) {
    return gem === "locked";
}

function showLockToast() {
    if (lockToast) {
        return;
    }
    const tX = document.createElement("div");
    tX.className = "lock-toast";
    tX.textContent = "⚠This is a locked gem! This column and row cannot be moved until a match is made beside it!";
    document.body.appendChild(tX);

    lockToast = true;
    setTimeout(() => tX.remove(), 5000);
}

function unlock(r, c) {
    if (!locked(board[r][c])) return;
    const newGem = randomGem();
    board[r][c] = newGem;

    const el = cells[r][c];
    el.classList.remove("locked");
    el.className = "cell " + newGem;
}

function chooseTip(txt) {
    let index = Math.floor(Math.random() * 6);
    txt.textContent = "Tip: " + tipList[index];
}

function timerStart() {
    if (running) return;
    running = true;
    lFrame = performance.now();
    loop = requestAnimationFrame(tick);
}

function maybeLockRandomGem() {
    // === RANDOM GEM LOCKING EVENT ===
    let lockChance = Math.min(.25, totalScore / 200000);
    if (Math.random() < lockChance) {

        // Pick a random non-locked, non-empty gem
        const candidates = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (board[r][c] !== "empty" && !locked(board[r][c])) {
                    candidates.push([r, c]);
                }
            }
        }

        if (candidates.length > 0) {
            const [lr, lc] = candidates[Math.floor(Math.random() * candidates.length)];

            board[lr][lc] = "locked";

            const el = cells[lr][lc];
            if (el) {
                el.classList.add("locked");
            } else {
                console.warn("Tried to lock missing cell:", lr, lc);
            }

            showLockToast();
        }
    }
}

function tick(x) {
    if (!running) return;

    const downTime = (x - lFrame) / 1000;
    lFrame = x;

    time -= downTime;
    if (time < 0) time = 0;

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, "0");
    timer.textContent = `${minutes}:${seconds}`;

    if (time > 0) {
        loop = requestAnimationFrame(tick);
    } else {
        running = false;
        currentPlayerScore = totalScore;  // capture final score before showing Game Over
        gameOver.showModal();
        chooseTip(gameOverTip);
        attachGameOverLeaderboards();
    }
}


function addTime(a) {
    time += a;
    let timePop = document.createElement('div');
    timePop.className = "time-popup";
    timePop.textContent = `+${a.toFixed(2)}s`;
    document.getElementById("timer-ui").appendChild(timePop);
    setTimeout(() => timePop.remove(), 800);
}

function removeTime() {
    time -= 1;
    let timePop = document.createElement('div');
    timePop.className = "bad-time-popup";
    timePop.textContent = `-1s`;
    document.getElementById("timer-ui").appendChild(timePop);
    setTimeout(() => timePop.remove(), 800);
}

const submitScoreBtn = document.getElementById("submitScoreBtn");
const playerNameInput = document.getElementById("playerName");
let scoreSaved = false;

let currentPlayerScore = null;
let currentPlayerName = null;

submitScoreBtn.addEventListener("click", async () => {
    if (scoreSaved) return;

    currentPlayerName = playerNameInput.value.trim() || "Player";

    try {
        await saveHighScore(currentPlayerName, currentPlayerScore);
        scoreSaved = true;
        submitScoreBtn.textContent = "Saved!";
        submitScoreBtn.disabled = true;

    } catch (err) {
        console.error("Error saving score:", err);
        submitScoreBtn.textContent = "Error, try again";
    }
});





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
    for (let i = 0; i < cols; i++) {
        if (locked(board[r][i])) return;
    }
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
    for (let i = 0; i < rows; i++) {
        if (locked(board[i][c])) return;
    }
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
            if (locked(board[r][c])) return;

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

        for (const [r, c] of matched) {
            const neighbors = [
                [r + 1, c],
                [r - 1, c],
                [r, c + 1],
                [r, c - 1]
            ];

            for (const [nr, nc] of neighbors) {
                if (nr >= 0 && nr < rows &&
                    nc >= 0 && nc < cols &&
                    locked(board[nr][nc])
                ) {
                    unlock(nr, nc);
                }
            }
        }

        const comboMult = 1 + (totalCombo * 0.5); // no cascade combo
        totalMoveScore += Math.floor(matched.length * 500 * comboMult);

        scoreTime = Math.ceil((totalMoveScore / 3000) + totalCombo / 8);

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

            let gem = randomGem();

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

        if (!gravity() && !refill()) {
            maybeLockRandomGem();
            break;
        }
        break;
    }
}


// ======================= RULES POPUPS ==========================
RulesA.showModal();
makeGrid();


nextA.addEventListener("click", () => { RulesA.close(); RulesB.showModal(); });
nextB.addEventListener("click", () => { RulesB.close(); RulesC.showModal(); });
nextC.addEventListener("click", () => { RulesC.close(); RulesD.showModal(); });
pause.addEventListener("click", pauseGame);
rules.addEventListener("click", RulesPauseGame);

closeA.addEventListener("click", () => { RulesA.close(); matchCheck(); timerStart(); });
closeB.addEventListener("click", () => { RulesB.close(); matchCheck(); timerStart(); });
closeC.addEventListener("click", () => { RulesC.close(); matchCheck(); timerStart(); });
closeD.addEventListener("click", () => { RulesD.close(); matchCheck(); timerStart(); });
resume.addEventListener("click", resumeGame);


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
}


// ======================= INPUT LISTENERS ==========================
let dragging = false;
let startX = 0, startY = 0;
let startCell = null;
let direction = null;

backendbtn.addEventListener("dblclick", () => {
    time = 1;
});

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

    Update();

    moveMadeMatch = false;
    await matchCheck();

    if (moveMadeMatch && totalCombo >= 10) {
        addTime(scoreTime);
    }
    else if (moveMadeMatch && totalCombo < 10) {
        totalCombo++;
        addTime(scoreTime);
    }
    else totalCombo = 0;
    Update();
});

grid.addEventListener("dblclick", async e => {
    if (playerLock) return;
    if (!e.target.classList.contains("cell")) return;

    removeTime();

    const r = +e.target.dataset.r;
    const c = +e.target.dataset.c;

    if (locked(board[r][c])) {
        unlock(r, c);
    } else {
        board[r][c] = "empty";
        cells[r][c].remove();
        cells[r][c] = null;
    }

    await stabilize();

    Update();
    moveMadeMatch = false;
    totalCombo = 0;
    await matchCheck();
});

const restart = document.getElementById("restartBtn");
restart.addEventListener("click", () => {
    window.location.reload(true);
});