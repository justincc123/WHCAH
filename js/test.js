const rows = 6;
const cols = 5;
const grid = document.getElementById('grid');

// Create the table
const cells = [];
for (let r = 0; r < rows; r++) {
    const row = document.createElement('tr');
    const rowCells = [];
    for (let c = 0; c < cols; c++) {
        const cell = document.createElement('td');
        // Randomly fill some cells at start
        if (Math.random() < 0.3) {
            cell.textContent = 'x';
            cell.classList.add('filled');
        } else {
            cell.textContent = '0';
            cell.classList.add('filled');
        }
        row.appendChild(cell);
        rowCells.push(cell);
    }
    grid.appendChild(row);
    cells.push(rowCells);
}

// Gravity function
function Grav() {
    for (let c = 0; c < cols; c++) {
        for (let r = rows - 2; r >= 0; r--) {
            if (cells[r][c].classList.contains('filled')) {
                let nextR = r;
                while (nextR + 1 < rows && !cells[nextR + 1][c].classList.contains('filled')) {
                    nextR++;
                }
                if (nextR !== r) {
                    // Move content down
                    cells[nextR][c].textContent = cells[r][c].textContent;
                    cells[nextR][c].classList.add('filled');
                    cells[r][c].textContent = '';
                    cells[r][c].classList.remove('filled');
                }
            }
        }
    }
}
const intervals = setInterval(Grav, 100);  // Apply gravity every 100 ms

let startCell = null;
let startX = 0;
let startY = 0;
let dragging = false;

grid.addEventListener('mousedown', e => {
    if (e.target.tagName !== 'TD') return;
    startCell = e.target;
    startX = e.clientX;
    startY = e.clientY;
    dragging = true;
});

grid.addEventListener('mousemove', e => {
    if (!dragging || !startCell) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (Math.abs(dx) > 100 || Math.abs(dy) > 100) {
        const rowIndex = [...startCell.parentNode.parentNode.children].indexOf(startCell.parentNode);
        const colIndex = [...startCell.parentNode.children].indexOf(startCell);

        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal drag → shift row
            if (dx > 0) shiftRow(rowIndex, 1);
            else shiftRow(rowIndex, -1);
        } else {
            // Vertical drag → shift column
            if (dy > 0) shiftCol(colIndex, 1);
            else shiftCol(colIndex, -1);
        }

        dragging = true;
    }
});

grid.addEventListener('mouseup', e => {
  if (!startCell || e.target.tagName !== 'TD') return;
  const endCell = e.target;

  const startR = [...startCell.parentNode.parentNode.children].indexOf(startCell.parentNode);
  const startC = [...startCell.parentNode.children].indexOf(startCell);
  const endR = [...endCell.parentNode.parentNode.children].indexOf(endCell.parentNode);
  const endC = [...endCell.parentNode.children].indexOf(endCell);

  // Move step by step toward the target with a small delay
  const interval = setInterval(() => {
    if (startR < endR) shiftCol(startC, 1);
    else if (startR > endR) shiftCol(startC, -1);
    else if (startC < endC) shiftRow(startR, 1);
    else if (startC > endC) shiftRow(startR, -1);
    else clearInterval(interval); // reached target
  }, 350);
});

function shiftRow(r, dir) {
    const row = cells[r];

    row.forEach((cell, i) => {
        cell.style.transform = `translateX(${dir * 100}%`
    });

    setTimeout(() => {
        if(dir > 0){
            const last = row[col-1].innerHTML;
            const lastFilled = row[col-1].classList.contains('filled');
            for(let i = cols-1; i > 0; i++){
                row[i].innerHTML = row[i-1].innerHTML;
                row[i].classList.toggle('filled', row[i-1], classList.contains('filled'));
            }
            row[0].innerHTML = last;
            row.classList.toggle('filled', lastFilled);
        }else{
            const first = row[0].innerHTML;
            const firstFilled = row[0].classList.contains('filled');
            for (let c = 0; c < cols - 1; c++) {
                row[c].innerHTML = row[c + 1].innerHTML;
                row[c].classList.toggle('filled', row[c + 1].classList.contains('filled'));
            }
            row[cols - 1].innerHTML = first;
            row[cols - 1].classList.toggle('filled', firstFilled);
        }

        row.forEach(cell => {
            cell.style.transition = 'none';
            cell.style.transform = 'none';

            void cell.offsetWidth
            cell.style.transition = 'transform 0.3s ease';
        });
    }, 300);
}

function shiftCol(c, dir) {
    const col = cells[row];

    col.forEach((cell, i) => {
        cell.style.transform = `translateY(${dir * 100}%`
    });

    setTimeout(() => {
        if(dir > 0){
            const last = col[row-1].innerHTML;
            const lastFilled = col[row-1].classList.contains('filled');
            for(let i = cols-1; i > 0; i++){
                col[i].innerHTML = col[i-1].innerHTML;
                col[i].classList.toggle('filled', col[i-1], classList.contains('filled'));
            }
            col[0].innerHTML = last;
            col.classList.toggle('filled', lastFilled);
        }else{
            const first = col[0].innerHTML;
            const firstFilled = col[0].classList.contains('filled');
            for (let c = 0; c < cols - 1; c++) {
                col[c].innerHTML = col[c + 1].innerHTML;
                col[c].classList.toggle('filled', col[c + 1].classList.contains('filled'));
            }
            col[cols - 1].innerHTML = first;
            col[cols - 1].classList.toggle('filled', firstFilled);
        }

        col.forEach(cell => {
            cell.style.transition = 'none';
            cell.style.transform = 'none';

            void cell.offsetWidth
            cell.style.transition = 'transform 0.3s ease';
        });
    }, 300);
}