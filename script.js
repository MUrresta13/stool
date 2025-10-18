/* Potion Path – Math Maze (medium difficulty) */
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

  const SIZE = 5;                               // 5x5 grid (medium)
  let grid = [];                                // {type:'start'|'op'|'num'|'target', value:string}
  let pathCells = new Set();                    // indices on the guaranteed path
  let startVal = 0, targetVal = 0;
  let expecting = 'op';                         // next click must be op or num
  let curVal = 0;
  let cursor = [0,0];                           // current position in grid
  let visited = new Set();

  function idx(r,c){ return r*SIZE + c; }

  function randPick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function coin(p=0.5){ return Math.random()<p; }

  // Generate a solvable path R/D from (0,0) to (4,4),
  // choose alternating operators and numbers to create a final target.
  function buildPuzzle(){
    // path coordinates
    const path = [[0,0]];
    let r=0,c=0;
    while(r<SIZE-1 || c<SIZE-1){
      // bias towards both directions to mix length
      if(r===SIZE-1) c++;
      else if(c===SIZE-1) r++;
      else coin() ? c++ : r++;
      path.push([r,c]);
    }

    // starting value
    startVal = Math.floor(Math.random()*8)+2; // 2..9
    curVal = startVal;

    const ops = ['+','-','×','÷'];
    const pathData = [{type:'start', value:startVal.toString()}];

    // create alternating op->num steps for the path (excluding start)
    for(let i=1;i<path.length;i++){
      // choose op that keeps values reasonable/integer
      let op = randPick(ops);
      let num;

      // choose valid operation based on current value
      const tryOps = ['×','+','-','÷']; // bias a bit
      for(const candidate of tryOps){
        if(candidate==='×'){
          const choices = [2,2,3,3,4,5];            // small multipliers
          num = randPick(choices);
          if(curVal*num <= 200){ op=candidate; break; }
        }
        if(candidate==='+'){
          num = Math.floor(Math.random()*10)+2;      // +2..+11
          if(curVal+num <= 200){ op=candidate; break; }
        }
        if(candidate==='-'){
          num = Math.floor(Math.random()*8)+1;       // -1..-8
          if(curVal-num >= 2){ op=candidate; break; }
        }
        if(candidate==='÷'){
          const divs = [2,3,4,5];
          const valid = divs.filter(d => curVal % d === 0);
          if(valid.length){ num = randPick(valid); op=candidate; break; }
        }
      }

      // apply op to compute new curVal, and store op + num
      pathData.push({type:'op', value:op});
      pathData.push({type:'num', value:String(num)});
      curVal = apply(curVal, op, num);
    }

    targetVal = curVal;

    // Build grid with distractors
    grid = Array.from({length:SIZE*SIZE}, ()=>({type:'num', value:String(Math.floor(Math.random()*12)+1)}));
    // sprinkle some operators
    for(let i=0;i<Math.floor(SIZE*SIZE*0.45);i++){
      grid[Math.floor(Math.random()*grid.length)] = {type:'op', value:randPick(['+','-','×','÷'])};
    }

    // Place the path cells in order along the coordinates
    pathCells = new Set();
    let k=0; // index in pathData
    for(let p=0;p<path.length;p++){
      const [rr,cc] = path[p];
      const cellIndex = idx(rr,cc);
      pathCells.add(cellIndex);
      if(p===0){
        grid[cellIndex] = {type:'start', value:String(startVal)};
      }else if(p===path.length-1){
        // last path placement will actually be an operator+number before reaching bottom-right;
        // but bottom-right still should be a special target cell that displays 🎯 & target.
        // We handle the operator/number in the step just before bottom-right.
      }
    }

    // Map path moves to alternating placements (after the origin).
    // Starting at (0,0) we expect an operator in the *next* cell we step onto.
    // We fill cells along the path (except [0,0] and [SIZE-1,SIZE-1])
    // using the sequence pathData[1..-2].
    let pdIdx = 1;
    for(let p=1;p<path.length-0;p++){ // fill up to the end cell as well if needed
      const [rr,cc] = path[p];
      const cellIndex = idx(rr,cc);
      // leave final cell as target
      if(rr===SIZE-1 && cc===SIZE-1) break;
      if(pdIdx < pathData.length){
        grid[cellIndex] = pathData[pdIdx++];
      }
    }

    // bottom-right is target display only
    grid[idx(SIZE-1,SIZE-1)] = {type:'target', value:'🎯'};

    // init play state
    expecting = 'op';
    curVal = startVal;
    cursor = [0,0];
    visited = new Set([idx(0,0)]);
  }

  function apply(a,op,b){
    switch(op){
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return a / b;
    }
  }

  function render(){
    boardEl.innerHTML = '';
    curEl.textContent = String(curVal);
    expEl.textContent = expecting.toUpperCase();
    tgtEl.textContent = String(targetVal);

    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++){
        const i = idx(r,c);
        const d = grid[i];
        const el = document.createElement('button');
        el.className = `cell ${d.type}`;
        el.textContent = (d.type==='target') ? '🎯' : d.value;
        if(visited.has(i)) el.classList.add('path');
        el.addEventListener('click', () => onCell(r,c));
        boardEl.appendChild(el);
      }
    }
  }

  function onCell(r,c){
    // movement restriction: only RIGHT or DOWN from current
    const [cr,cc] = cursor;
    const isNext = (r===cr && c===cc+1) || (c===cc && r===cr+1);
    if(!isNext) return;

    const d = grid[idx(r,c)];

    // Must alternate types
    if(expecting==='op' && d.type!=='op') return;
    if(expecting==='num' && d.type!=='num') return;

    visited.add(idx(r,c));
    if(d.type==='op'){
      // store pending operator on cursor; next we expect number
      cursor = [r,c];
      expecting = 'num';
      expEl.textContent = 'NUM';
      // store on element for next step
      boardEl.children[idx(r,c)].dataset.pendingOp = d.value;
    } else if(d.type==='num'){
      // apply the last operator we stepped on
      const opCell = boardEl.children[idx(cursor[0],cursor[1])];
      const op = opCell?.dataset?.pendingOp;
      if(!op) return; // safety
      const num = Number(d.value);
      curVal = apply(curVal, op, num);
      curEl.textContent = String(Math.round(curVal*100)/100);
      cursor = [r,c];
      expecting = 'op';
      expEl.textContent = 'OP';
    }
    render();

    // if we just moved into the cell above or left of target, allow stepping onto target
    maybeCheckTarget();
  }

  function maybeCheckTarget(){
    const [r,c] = cursor;
    const atTargetNext = (r===SIZE-1 && c===SIZE-2) || (r===SIZE-2 && c===SIZE-1);
    if(!atTargetNext) return;

    // Add a click handler to target based on where it is
    const trgI = idx(SIZE-1,SIZE-1);
    const trgBtn = boardEl.children[trgI];
    // ensure single bind
    trgBtn.onclick = () => tryFinish();
  }

  function tryFinish(){
    // To finish, you must be expecting an OP (i.e., last step completed a number)
    // and be adjacent to target; we already guarantee adjacency by enabling the click only then.
    if(Math.abs(cursor[0]-(SIZE-1)) + Math.abs(cursor[1]-(SIZE-1)) !== 1) return;

    if(Math.abs(targetVal - curVal) < 1e-9){
      openWin();
    } else {
      // soft fail: shake board & reset path but keep puzzle
      boardEl.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:220});
      resetPath();
    }
  }

  function resetPath(){
    visited = new Set([idx(0,0)]);
    curVal = startVal;
    expecting = 'op';
    cursor = [0,0];
    curEl.textContent = String(curVal);
    expEl.textContent = 'OP';
    render();
  }

  function newPuzzle(){
    buildPuzzle();
    render();
  }

  newBtn.addEventListener('click', newPuzzle);
  resetBtn.addEventListener('click', resetPath);

  // Success modal
  const winModal = document.getElementById('winModal');
  function openWin(){ winModal.showModal(); }
  document.getElementById('playAgain').addEventListener('click', () => {
    winModal.close(); newPuzzle();
  });
  document.getElementById('copyBtn').addEventListener('click', () => {
    const fld = document.getElementById('codeField');
    fld.select(); fld.setSelectionRange(0, fld.value.length);
    navigator.clipboard?.writeText(fld.value).catch(()=>{});
  });
})();
