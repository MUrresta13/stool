/* Potion Path – Math Maze (fixed version) */
(() => {
  const boardEl  = document.getElementById('board');
  const curEl    = document.getElementById('currentVal');
  const expEl    = document.getElementById('expecting');
  const tgtEl    = document.getElementById('targetVal');
  const newBtn   = document.getElementById('newBtn');
  const resetBtn = document.getElementById('resetBtn');

  const startScreen = document.getElementById('startScreen');
  document.getElementById('startBtn').addEventListener('click', () => {
    startScreen.remove();
    newPuzzle();
  });

  const SIZE = 5; // 5x5 grid
  let grid = [];
  let pathCells = new Set();
  let startVal = 0, targetVal = 0;
  let expecting = 'op';
  let curVal = 0;
  let cursor = [0, 0];
  let visited = new Set();
  let pendingOp = null; // ✅ FIXED – keep operator in real state

  const idx = (r, c) => r * SIZE + c;
  const randPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const coin = (p = 0.5) => Math.random() < p;

  function buildPuzzle() {
    const path = [[0, 0]];
    let r = 0, c = 0;
    while (r < SIZE - 1 || c < SIZE - 1) {
      if (r === SIZE - 1) c++;
      else if (c === SIZE - 1) r++;
      else coin() ? c++ : r++;
      path.push([r, c]);
    }

    startVal = Math.floor(Math.random() * 8) + 2;
    curVal = startVal;
    const ops = ['+', '-', '×', '÷'];
    const pathData = [{ type: 'start', value: startVal.toString() }];

    for (let i = 1; i < path.length; i++) {
      let op = randPick(ops);
      let num;
      const tryOps = ['×', '+', '-', '÷'];
      for (const candidate of tryOps) {
        if (candidate === '×') {
          const choices = [2, 2, 3, 3, 4, 5];
          num = randPick(choices);
          if (curVal * num <= 200) { op = candidate; break; }
        }
        if (candidate === '+') {
          num = Math.floor(Math.random() * 10) + 2;
          if (curVal + num <= 200) { op = candidate; break; }
        }
        if (candidate === '-') {
          num = Math.floor(Math.random() * 8) + 1;
          if (curVal - num >= 2) { op = candidate; break; }
        }
        if (candidate === '÷') {
          const divs = [2, 3, 4, 5];
          const valid = divs.filter(d => curVal % d === 0);
          if (valid.length) { num = randPick(valid); op = candidate; break; }
        }
      }

      pathData.push({ type: 'op', value: op });
      pathData.push({ type: 'num', value: String(num) });
      curVal = apply(curVal, op, num);
    }

    targetVal = curVal;

    grid = Array.from({ length: SIZE * SIZE },
      () => ({ type: 'num', value: String(Math.floor(Math.random() * 12) + 1) })
    );
    for (let i = 0; i < Math.floor(SIZE * SIZE * 0.45); i++) {
      grid[Math.floor(Math.random() * grid.length)] =
        { type: 'op', value: randPick(['+', '-', '×', '÷']) };
    }

    pathCells = new Set();
    let pdIdx = 1;
    for (let p = 0; p < path.length; p++) {
      const [rr, cc] = path[p];
      const cellIndex = idx(rr, cc);
      pathCells.add(cellIndex);
      if (p === 0) grid[cellIndex] = { type: 'start', value: String(startVal) };
      else if (p === path.length - 1) continue;
      else if (pdIdx < pathData.length) grid[cellIndex] = pathData[pdIdx++];
    }

    grid[idx(SIZE - 1, SIZE - 1)] = { type: 'target', value: '🎯' };
    expecting = 'op';
    curVal = startVal;
    cursor = [0, 0];
    visited = new Set([idx(0, 0)]);
    pendingOp = null;
  }

  function apply(a, op, b) {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return a / b;
    }
  }

  function render() {
    boardEl.innerHTML = '';
    curEl.textContent = String(curVal);
    expEl.textContent = expecting.toUpperCase();
    tgtEl.textContent = String(targetVal);

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const i = idx(r, c);
        const d = grid[i];
        const el = document.createElement('button');
        el.className = `cell ${d.type}`;
        el.textContent = d.value;
        if (visited.has(i)) el.classList.add('path');
        el.addEventListener('click', () => onCell(r, c));
        boardEl.appendChild(el);
      }
    }
  }

  function onCell(r, c) {
    const [cr, cc] = cursor;
    const isNext = (r === cr && c === cc + 1) || (c === cc && r === cr + 1);
    if (!isNext) return;

    const i = idx(r, c);
    const d = grid[i];

    if (expecting === 'op' && d.type !== 'op') return;
    if (expecting === 'num' && d.type !== 'num') return;

    visited.add(i);

    if (d.type === 'op') {
      pendingOp = d.value; // ✅ Fixed operator storage
      cursor = [r, c];
      expecting = 'num';
      expEl.textContent = 'NUM';
      render();
      return;
    }

    if (d.type === 'num') {
      if (!pendingOp) return;
      const num = Number(d.value);
      curVal = apply(curVal, pendingOp, num);
      pendingOp = null;
      curEl.textContent = String(Math.round(curVal * 100) / 100);
      cursor = [r, c];
      expecting = 'op';
      expEl.textContent = 'OP';
      render();

      const nearTarget =
        (r === SIZE - 1 && c === SIZE - 2) || (r === SIZE - 2 && c === SIZE - 1);
      if (nearTarget) {
        if (Math.abs(targetVal - curVal) < 1e-9) {
          openWin();
        } else {
          boardEl.animate(
            [
              { transform: 'translateX(0)' },
              { transform: 'translateX(-6px)' },
              { transform: 'translateX(6px)' },
              { transform: 'translateX(0)' }
            ],
            { duration: 220 }
          );
          resetPath();
        }
      }
    }
  }

  function resetPath() {
    visited = new Set([idx(0, 0)]);
    curVal = startVal;
    expecting = 'op';
    cursor = [0, 0];
    pendingOp = null;
    curEl.textContent = String(curVal);
    expEl.textContent = 'OP';
    render();
  }

  function newPuzzle() {
    buildPuzzle();
    render();
  }

  newBtn.addEventListener('click', newPuzzle);
  resetBtn.addEventListener('click', resetPath);

  const winModal = document.getElementById('winModal');
  function openWin() { winModal.showModal(); }

  document.getElementById('playAgain').addEventListener('click', () => {
    winModal.close();
    newPuzzle();
  });

  document.getElementById('copyBtn').addEventListener('click', () => {
    const fld = document.getElementById('codeField');
    fld.select();
    fld.setSelectionRange(0, fld.value.length);
    navigator.clipboard?.writeText(fld.value).catch(() => {});
  });
})();
