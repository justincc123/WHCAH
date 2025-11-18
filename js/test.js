const cells = [];
const board = [];
const grid = document.getElementById('grid');

const rows = 6;
const cols = 6;
const cellsize = 100;
var totalScore = 0;
var totalCombo = 0;
let playerLock = false;

const e = document.getElementsByClassName('close');
const closeA = e[0];
const closeB = e[1];
const closeC = e[2];
const closeD = e[3];

const n = document.getElementsByClassName('next');
const nextA = n[0];
const nextB = n[1];
const nextC = n[2];

function Update() {
    document.getElementById('displayScore').textContent = totalScore;
    document.getElementById('displayMult').textContent = totalCombo;
}

function showScorePopup(score, mult) {
    let popup = document.createElement('div');
    if (mult > 1 && score > 0) {
        popup.textContent = `Combo! ${score} × ${mult}!`;
        console.log(`Combo! ${score} × ${mult}!`);
        popup.className = 'score-popup';
    } else if (mult <=1 && score > 0) {
        popup.textContent = `+ ${score}!`;
        console.log(`+ ${score}!`);
        popup.className = 'score-popup';
    }

    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
}

function move(r, c, newR, newC){
    const e = cells[r][c];
    const g = board[r][c]
    e.dataset.r = newR;
    e.dataset.c = newC;
    e.style.transform = `translate(${newC * cellsize}px, ${newR * cellsize}px)`;

    cells[newR][newC] = e;
    cells[r][c] = null;

    board[newR][newC] = g;
    board[r][c] = 'empty';
}


function shiftRow(r, dir) {
        if (dir > 0) {
            const lastGem = board[r][cols - 1];
            const lastCell = cells[r][cols - 1];

            for (let j = cols - 1; j > 0; j--) {
                cells[r][j] = cells[r][j - 1];
                board[r][j] = board[r][j - 1];
            }
            cells[r][0] = lastCell;
            board[r][0] = lastGem;
        } else {
            const firstGem = board[r][0];
            const firstCell = cells[r][0];

            for (let j = 0; j < cols - 1; j++){
                board[r][j] = board[r][j + 1];
                cells[r][j] = cells[r][j + 1];
            }
            cells[r][cols - 1] = firstCell;
            board[r][cols - 1] = firstGem;
        }
    for(let c = 0; c < cols; c++){
        const e = cells[r][c];
        e.dataset.c = c;
        e.style.transform = `translate(${c * cellsize}px, ${r * cellsize}px)`;
    }
}

function shiftCol(c, dir) {
        if (dir > 0) {
            const lastGem = board[rows - 1][c];
            const lastCell = cells[rows - 1][c];
            for (let j = rows - 1; j > 0; j--){
                cells[j][c] = cells[j - 1][c];
                board[j][c] = board[j - 1][c];
            }
            board[0][c] = lastGem;
            cells[0][c] = lastCell;
        } else {
            const firstGem = board[0][c];
            const firstCell = cells[0][c];
            for (let j = 0; j < rows - 1; j++){
                cells[j][c] = cells[j + 1][c];
                board[j][c] = board[j + 1][c];
            }
            board[rows - 1][c] = firstGem;
            cells[rows - 1][c] = firstCell;
        }
    for(let r = 0; r < rows; r++){
        const e = cells[r][c];
        e.dataset.r = r;
        e.style.transform = `translate(${c * cellsize}px, ${r * cellsize}px)`;
    }
}

async function matchCheck() {
    if(playerLock){
        return;
    }
    playerLock = true;
    let matched;
    let combo = totalCombo;
    let score = 0;
    do {
        matched = false;
        const toClear = [];
        const checked = Array.from({
            length: rows
        },
            () => Array(cols).fill(false));

        function flood(r, c, gemType, group) {
            if (r < 0 || r >= rows || c < 0 || c >= cols) {
                return;
            }
            if (checked[r][c]) {
                return;
            }
            if (board[r][c] != gemType) {
                return;
            }

            checked[r][c] = true;
            group.push([r, c]);

            flood(r + 1, c, gemType, group);
            flood(r - 1, c, gemType, group);
            flood(r, c + 1, gemType, group);
            flood(r, c - 1, gemType, group);
        }

        let moveScore = 0;

        // Check for all matches
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (checked[r][c]) {
                    continue;
                }
                const gemType = board[r][c];
                if (gemType === 'empty') {
                    continue;
                }

                const group = [];
                flood(r, c, gemType, group);

                if (group.length >= 3) {
                    //score increases based on number of matched gems
                    matched = true;
                    group.forEach(([gr, gc]) =>
                        toClear.push([gr, gc]));

                    const baseScore = group.length * 500;
                    const countBonus = group.length >= 4 ? (group.length - 2) * 5 : 0;
                    moveScore += baseScore + countBonus;
                }
            }
        }
        // Clear matched cells (if any)
        if (matched) {
            combo++;
            const mult = 1 + (combo - 1) * .5;

            toClear.forEach(([r, c]) => {
                cells[r][c].style.opacity = '.3';
            });

            await new Promise(resolve =>
                setTimeout(resolve, 400)
            );

            toClear.forEach(([r, c]) => {
                board[r][c] = 'empty';
                const e = cells[r][c];
                e.className = "cell empty";
                e.style.opacity = '0';
            });

            await stabilize();

            var finalpoints = Math.floor(moveScore * mult);
            totalScore += finalpoints;
            score = moveScore;

            console.log(`${combo}: +${finalpoints} points`);
            console.log(`Total: ${totalScore}`);

             // Apply gravity after clearing
            await new Promise(resolve =>
                setTimeout(resolve, 400)
            );
        }
    } while (matched);

    if(combo === totalCombo){
        totalCombo = 0;
    }else{
        totalCombo = combo > 1 ? combo : 0;
    }
    
    if (combo > 1) {
        console.log(`Combo! ×${totalCombo}`);
    }
    showScorePopup(score, totalCombo);
    Update();
    playerLock = false;
}

// Gravity function
function Grav() {
    let moved = false;
    for (let c = 0; c < cols; c++) {
        for (let r = rows - 1; r >= 0; r--) {
            if (board[r][c] === 'empty') {
                // find the closest non-empty cell above
                let k = r - 1;
                while (k >= 0 && board[k][c] === 'empty') k--;
                if (k >= 0) {
                    move(k, c, r, c);
                    moved = true;
                }
            }
        }
    }
    return moved;
}

function fillTop() {
    const gems = ['gemA', 'gemB', 'gemC', 'gemD', 'gemE', 'gemF', 'gemG', 'gemH', 'gemI', 'gemJ'];
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            if (board[r][c] === 'empty' && (r === 0 || board[r-1][c] !== 'empty')) {
                const gem = gems[Math.floor(Math.random() * gems.length)];
                board[r][c] = gem;
                const e = cells[r][c];
                e.className = "cell " + gem;
                e.style.opacity = '0';
                requestAnimationFrame(() => {
                    e.style.transition = 'opacity 0.3s';
                    e.style.opacity = '1';
                });
                filled = true;
            }
        }
    }
    return filled;
}

async function stablize(){
    let moved;
    do{
        moved = Grav();
        fillTop();
        await new Promise(resolve => setTimeout(resolve, 300));
    } while (moved);
}

RulesA.showModal();

nextA.addEventListener("click", function () {
    RulesA.close();
    RulesB.showModal();
});
nextB.addEventListener("click", function () {
    RulesB.close();
    RulesC.showModal();
});
nextC.addEventListener("click", function () {
    RulesC.close();
    RulesD.showModal();
});

closeA.addEventListener("click", function () {
    RulesA.close();
    makeGrid();
    // Start the game timer in these spots
});
closeB.addEventListener("click", function () {
    RulesB.close();
    makeGrid();
    // Start the game timer in these spots
});
closeC.addEventListener("click", function () {
    RulesC.close();
    makeGrid();
    // Start the game timer in these spots
});
closeD.addEventListener("click", function () {
    RulesD.close();
    makeGrid();
    // Start the game timer in these spots
});



function makeGrid(){
for (let r = 0; r < rows; r++) {
    cells[r] = [];
    board[r] = [];

    for (let c = 0; c < cols; c++) {
        const cellC = document.createElement("div");
        let gem = "gemA";
        // Randomly fill some cells at start
        switch (Math.ceil(Math.random() * 10)) {
            case 1:
                // A";
                gem = "gemA";
                break;
            case 2:
                // B";
                gem = "gemB";
                break;
            case 3:
                // C";
                gem = "gemC";
                break;
            case 4:
                // D";
                gem = "gemD";
                break;
            case 5:
                // E";
                gem = "gemE";
                break;
            case 6:
                // F";
                gem = "gemF";
                break;
            case 7:
                // G";
                gem = "gemG";
                break;
            case 8:
                // H";
                gem = "gemH";
                break;
            case 9:
                // I";
                gem = "gemI";
                break;
            case 10:
                // J";
                gem = "gemJ";
                break;
        }

        cellC.className = 'cell ' + gem;
        cellC.style.transform = `translate(${c * cellsize}px, ${r * cellsize}px)`;
        cellC.dataset.r = r;
        cellC.dataset.c = c;

        grid.appendChild(cellC);
        cells[r][c] = cellC;
        board[r][c] = gem;
    }
}
matchCheck();
playerLock = false;

}


let startCell = null;
let startX = 0;
let startY = 0;
let dragging = false;
let direction = null;

grid.addEventListener('dblclick', async e => {
    if(playerLock){
        return;
    }
    if (!e.target.classList.contains("cell")) return;
    e.preventDefault();
    const r = parseInt(e.target.dataset.r);
    const c = parseInt(e.target.dataset.c);
    board[r][c] = 'empty';
    e.target.className = 'cell empty'
    Grav();
    await matchCheck();
});

grid.addEventListener('mousedown', e => {
    if(playerLock){
        return;
    }

    if (!e.target.classList.contains('cell')) return;
    startCell = e.target;
    startX = e.clientX;
    startY = e.clientY;
    dragging = true;
    direction = null;
});

grid.addEventListener('mousemove', e => {
    if(playerLock){
        return;
    }

    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const r = parseInt(startCell.dataset.r);
    const c = parseInt(startCell.dataset.c);

    if (!direction) {
        if (Math.abs(dx) > 15) {
            direction = 'row';
        } else if (Math.abs(dy) > 15) {
            direction = 'col';
        }else{
            return;
        }
    }

    if (direction == 'row' && Math.abs(dx) >= cellsize) {
            shiftRow(r, Math.sign(dx));
            startX += Math.sign(dx) * cellsize;
    } else if (direction === 'col' && Math.abs(dy) >= cellsize) {
            shiftCol(c, Math.sign(dy));
            startY += Math.sign(dy) * cellsize;
    }
});

grid.addEventListener('mouseup', async e => {
    if(playerLock){
        return;
    }

    dragging = false;
    startCell = null;
    direction = null;
    Grav();
    await matchCheck();
});