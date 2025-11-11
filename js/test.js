const rows = 6;
const cols = 6;
const grid = document.getElementById('grid');
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
    if (mult > 1 && score > 0) {
        const popup = document.createElement('div');
        popup.textContent = `Combo! ${score} × ${mult}!`;
        console.log(`Combo! ${score} × ${mult}!`);
        popup.className = 'score-popup';
        document.body.appendChild(popup);
    } else if (mult <=1 && score > 0) {
        const popup = document.createElement('div');
        popup.textContent = `+ ${score}!`;
        console.log(`+ ${score}!`);
        popup.className = 'score-popup';
        document.body.appendChild(popup);
    }


    setTimeout(() => popup.remove(), 1000);
}


function shiftRow(r, dir, count = 1) {
    for (let i = 0; i < count; i++) {
        if (dir > 0) {
            const lastGem = cells[r][cols - 1].className;
            for (let j = cols - 1; j > 0; j--) cells[r][j].className = cells[r][j - 1].className;
            cells[r][0].className = lastGem;
        } else {
            const firstGem = cells[r][0].className;
            for (let j = 0; j < cols - 1; j++) cells[r][j].className = cells[r][j + 1].className;
            cells[r][cols - 1].className = firstGem;
        }
    }
}

function shiftCol(c, dir, count = 1) {
    for (let i = 0; i < count; i++) {
        if (dir > 0) {
            const lastGem = cells[rows - 1][c].className;
            for (let j = rows - 1; j > 0; j--) cells[j][c].className = cells[j - 1][c].className;
            cells[0][c].className = lastGem;
        } else {
            const firstGem = cells[0][c].className;
            for (let j = 0; j < rows - 1; j++) cells[j][c].className = cells[j + 1][c].className;
            cells[rows - 1][c].className = firstGem;
        }
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
            if (cells[r][c].className != gemType) {
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
                const gemType = cells[r][c].className;
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
                cells[r][c].className = 'empty';
                cells[r][c].style.opacity = '1'
            });

            var finalpoints = Math.floor(moveScore * mult);
            totalScore += finalpoints;
            score = moveScore;

            console.log(`${combo}: +${finalpoints} points`);
            console.log(`Total: ${totalScore}`);

            Grav(); // Apply gravity after clearing
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
    for (let c = 0; c < cols; c++) {
        for (let r = rows - 1; r >= 0; r--) {
            if (cells[r][c].className === 'empty') {
                // find the closest non-empty cell above
                let k = r - 1;
                while (k >= 0 && cells[k][c].className === 'empty') k--;
                if (k >= 0) {
                    cells[r][c].className = cells[k][c].className;
                    cells[k][c].className = 'empty';
                }
            }
        }
    }
    fillTop();
}

function fillTop() {
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            if (cells[r][c].className === 'empty') {
                const rand = Math.ceil(Math.random() * 10);
                const gem = ['gemA', 'gemB', 'gemC', 'gemD', 'gemE', 'gemF', 'gemG', 'gemH', 'gemI', 'gemJ'][rand - 1];
                cells[r][c].className = gem;
            }
        }
    }
}

RulesA.showModal(e);

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
    matchCheck();
    // Start the game timer in these spots
});
closeB.addEventListener("click", function () {
    RulesB.close();
    matchCheck();
    // Start the game timer in these spots
});
closeC.addEventListener("click", function () {
    RulesC.close();
    matchCheck();
    // Start the game timer in these spots
});
closeD.addEventListener("click", function () {
    RulesD.close();
    matchCheck();
    // Start the game timer in these spots
});




// Create the table
const cells = [];

for (let r = 0; r < rows; r++) {
    const row = document.createElement('tr');
    const rowCells = [];
    for (let c = 0; c < cols; c++) {
        const cell = document.createElement('td');
        // Randomly fill some cells at start
        switch (Math.ceil(Math.random() * 10)) {
            case 1:
                cell.className = "gemA";
                break;
            case 2:
                cell.className = "gemB";
                break;
            case 3:
                cell.className = "gemC";
                break;
            case 4:
                cell.className = "gemD";
                break;
            case 5:
                cell.className = "gemE";
                break;
            case 6:
                cell.className = "gemF";
                break;
            case 7:
                cell.className = "gemG";
                break;
            case 8:
                cell.className = "gemH";
                break;
            case 9:
                cell.className = "gemI";
                break;
            case 10:
                cell.className = "gemJ";
                break;
        }
        row.appendChild(cell);
        rowCells.push(cell);
    }
    grid.appendChild(row);
    cells.push(rowCells);
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
    if (e.target.tagName !== 'TD') return;
    e.preventDefault();
    e.target.className = 'empty';
    Grav();
    await matchCheck();
});

grid.addEventListener('mousedown', e => {
    if(playerLock){
        return;
    }
    if (e.target.tagName !== 'TD') return;
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
    if (!dragging || !startCell) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const rowIndex = [...startCell.parentNode.parentNode.children].indexOf(startCell.parentNode);
    const colIndex = [...startCell.parentNode.children].indexOf(startCell);

    if (!direction) {
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            direction = Math.abs(dx) > Math.abs(dy) ? 'row' : 'col';
        } else {
            return;
        }
    }

    if (direction == 'row') {
        const shiftnum = Math.floor(dx / cellsize);
        if (shiftnum !== 0) {
            shiftRow(rowIndex, Math.sign(shiftnum), Math.abs(shiftnum));
            startX += shiftnum * cellsize;
        }
    } else if (direction === 'col') {
        const shiftnum = Math.floor(dy / cellsize);
        if (shiftnum !== 0) {
            shiftCol(colIndex, Math.sign(shiftnum), Math.abs(shiftnum));
            startY += shiftnum * cellsize;
        }
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