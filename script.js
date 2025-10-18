/* Haunted Lights Out – fixed tap behavior */
(() => {
  const boardEl   = document.getElementById('board');
  const moveEl    = document.getElementById('moveCount');
  const sizeLbl   = document.getElementById('sizeLabel');
  const newBtn    = document.getElementById('newBtn');
  const resetBtn  = document.getElementById('resetBtn');
  const startUI   = document.getElementById('startScreen');
  const startBtn  = document.getElementById('startBtn');

  const winModal  = document.getElementById('winModal');
  const copyBtn   = document.getElementById('copyBtn');
  const codeField = document.getElementById('codeField');
  const againBtn  = document.getElementById('playAgain');
  const gameUI    = document.getElementById('gameUI');

  // Config
  const N = 5; // grid size
  const SCRAMBLE_STEPS = 18; // medium difficulty
  sizeLbl.textContent = `${N}×${N}`;

  // State
  let grid = [];
  let moves = 0;
  let initialGrid = [];

  const idx = (r, c) => r * N + c;
  const inBounds = (r, c) => r >= 0 && r < N && c >= 0 && c < N;

  function buildBlank() {
    grid = Array.from({ length: N * N }, () => false);
  }

  function render() {
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
    moveEl.textContent = String(moves);

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const i = idx(r, c);
        const btn = document.createElement('button');
        btn.className = 'cell ' + (grid[i] ? 'on' : 'off');
        btn.addEventListener('click', () => handleTap(r, c));
        boardEl.appendChild(btn);
      }
    }
  }

  function toggleAt(r, c) {
    if (!inBounds(r, c)) return;
    const i = idx(r, c);
    grid[i] = !grid[i];
  }

  function handleTap(r, c) {
    toggleAt(r, c);
    toggleAt(r-1, c);
    toggleAt(r+1, c);
    toggleAt(r, c-1);
    toggleAt(r, c+1);

    moves++;
    render();
    if (isSolved()) showWin();
  }

  function isSolved() {
    return grid.every(v => v === false);
  }

  function scramble() {
    buildBlank();
    for (let k = 0; k < SCRAMBLE_STEPS; k++) {
      const r = Math.floor(Math.random() * N);
      const c = Math.floor(Math.random() * N);
      toggleAt(r, c);
      toggleAt(r-1, c);
      toggleAt(r+1, c);
      toggleAt(r, c-1);
      toggleAt(r, c+1);
    }
    moves = 0;
    initialGrid = grid.slice();
    render();
  }

  function reset() {
    grid = initialGrid.slice();
    moves = 0;
    render();
  }

  function showWin() {
    winModal.showModal();
  }

  newBtn.addEventListener('click', scramble);
  resetBtn.addEventListener('click', reset);
  againBtn.addEventListener('click', () => {
    winModal.close();
    scramble();
  });
  copyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    codeField.select();
    codeField.setSelectionRange(0, codeField.value.length);
    navigator.clipboard?.writeText(codeField.value);
  });

  // Start gate
  startBtn.addEventListener('click', () => {
    startUI.remove();
    gameUI.classList.remove('hidden');
    scramble();
  });

  // ✅ Fix: only block scroll / long-press highlighting, not taps
  boardEl.addEventListener('touchmove', e => e.preventDefault(), { passive:false });
})();
