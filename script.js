/* ===================================
   Franco Urrutia CV — Script
   =================================== */

/* ── CUSTOM CURSOR ── */
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top = mouseY + 'px';
});

(function loop() {
  ringX += (mouseX - ringX) * .12;
  ringY += (mouseY - ringY) * .12;
  ring.style.left = ringX + 'px';
  ring.style.top = ringY + 'px';
  requestAnimationFrame(loop);
})();

document.querySelectorAll('a,.tag,button').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width = '1rem';
    cursor.style.height = '1rem';
    cursor.style.background = '#3B0764';
    ring.style.width = '3.25rem';
    ring.style.height = '3.25rem';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width = '0.625rem';
    cursor.style.height = '0.625rem';
    cursor.style.background = '#6D28D9';
    ring.style.width = '2.25rem';
    ring.style.height = '2.25rem';
  });
});

/* ── SCROLL REVEAL — SECTIONS ── */
const secObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: .08 });
document.querySelectorAll('section').forEach(s => secObs.observe(s));

/* ── SCROLL REVEAL — LANGUAGE BARS ── */
const langObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: .4 });
document.querySelectorAll('.lang-item').forEach(li => langObs.observe(li));

/* ── STAGGER EXPERIENCE ITEMS ── */
const expObs = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }, i * 80);
    }
  });
}, { threshold: .1 });

document.querySelectorAll('.exp-item').forEach(item => {
  item.style.opacity = '0';
  item.style.transform = 'translateY(1rem)';
  item.style.transition = 'opacity .5s ease, transform .5s ease';
  expObs.observe(item);
});

/* ══════════════════════════════════════
   BATALLA NAVAL — DEMO ANIMADA
══════════════════════════════════════ */
const G = 8;
const SHIPS = [
  { len: 4, name: 'Portaaviones' },
  { len: 3, name: 'Crucero' },
  { len: 3, name: 'Submarino' },
  { len: 2, name: 'Destructor' },
  { len: 2, name: 'Lancha' },
];

let pBoard, eBoard, eShips, timer, hits, misses, sunkCount, running = false, lastHits = [];

function emptyBoard() {
  return Array.from({ length: G }, () => Array(G).fill(0));
}

function placeShips(board) {
  const list = [];
  for (const s of SHIPS) {
    let ok = false, tries = 0;
    while (!ok && tries++ < 300) {
      const h = Math.random() < .5;
      const r = Math.floor(Math.random() * (G - (h ? 0 : s.len)));
      const c = Math.floor(Math.random() * (G - (h ? s.len : 0)));
      const cells = [];
      let valid = true;
      for (let i = 0; i < s.len; i++) {
        const nr = h ? r : r + i;
        const nc = h ? c + i : c;
        if (board[nr][nc] !== 0) { valid = false; break; }
        cells.push([nr, nc]);
      }
      if (valid) {
        cells.forEach(([nr, nc]) => board[nr][nc] = s.name);
        list.push({ ...s, cells, sunk: false });
        ok = true;
      }
    }
  }
  return list;
}

function renderBoard(id, board, reveal) {
  const el = document.getElementById(id);
  el.innerHTML = '';
  for (let r = 0; r < G; r++) {
    for (let c = 0; c < G; c++) {
      const div = document.createElement('div');
      div.className = 'bn-cell';
      div.dataset.r = r;
      div.dataset.c = c;
      const v = board[r][c];
      if (v === 'hit') { div.classList.add('hit'); div.textContent = '✕'; }
      else if (v === 'miss') { div.classList.add('miss'); div.textContent = '·'; }
      else if (v === 'sunk') { div.classList.add('sunk'); div.textContent = '✕'; }
      else if (reveal && typeof v === 'string') div.classList.add('ship');
      el.appendChild(div);
    }
  }
}

function getCell(gridId, r, c) {
  return document.querySelector(`#${gridId} .bn-cell[data-r="${r}"][data-c="${c}"]`);
}

function startGame() {
  clearTimeout(timer);
  running = false;
  hits = 0;
  misses = 0;
  sunkCount = 0;
  lastHits = [];
  pBoard = emptyBoard();
  eBoard = emptyBoard();
  placeShips(pBoard);
  eShips = placeShips(eBoard);
  renderBoard('gridPlayer', pBoard, true);
  renderBoard('gridEnemy', eBoard, false);
  upd('bnHits', 0);
  upd('bnMisses', 0);
  upd('bnSunk', 0);
  setStatus('Partida iniciada — disparando…');
  running = true;
  scheduleShot();
}

function upd(id, v) {
  document.getElementById(id).textContent = v;
}

function setStatus(s) {
  document.getElementById('bnStatus').textContent = s;
}

function availCells() {
  const a = [];
  for (let r = 0; r < G; r++) {
    for (let c = 0; c < G; c++) {
      const v = eBoard[r][c];
      if (v !== 'hit' && v !== 'miss' && v !== 'sunk') a.push([r, c]);
    }
  }
  return a;
}

function pickTarget() {
  if (lastHits.length && Math.random() < .65) {
    const [lr, lc] = lastHits[lastHits.length - 1];
    const adj = [[lr-1, lc], [lr+1, lc], [lr, lc-1], [lr, lc+1]]
      .filter(([r, c]) =>
        r >= 0 && r < G && c >= 0 && c < G &&
        eBoard[r][c] !== 'hit' && eBoard[r][c] !== 'miss' && eBoard[r][c] !== 'sunk'
      );
    if (adj.length) return adj[Math.floor(Math.random() * adj.length)];
  }
  const a = availCells();
  return a.length ? a[Math.floor(Math.random() * a.length)] : null;
}

function tryCheckSunk(r, c) {
  for (const s of eShips) {
    if (s.sunk) continue;
    if (!s.cells.some(([sr, sc]) => sr === r && sc === c)) continue;
    if (s.cells.every(([sr, sc]) => eBoard[sr][sc] === 'hit')) {
      s.sunk = true;
      s.cells.forEach(([sr, sc]) => {
        eBoard[sr][sc] = 'sunk';
        const el = getCell('gridEnemy', sr, sc);
        if (el) { el.className = 'bn-cell sunk'; el.textContent = '✕'; }
      });
      return s.name;
    }
    return null;
  }
  return null;
}

function fireShot() {
  if (!running) return;
  const t = pickTarget();
  if (!t) { endGame(); return; }
  const [r, c] = t;
  const v = eBoard[r][c];
  const isShip = typeof v === 'string' && v !== 'hit' && v !== 'miss' && v !== 'sunk';
  const cell = getCell('gridEnemy', r, c);

  if (isShip) {
    eBoard[r][c] = 'hit';
    hits++;
    lastHits.push([r, c]);
    if (lastHits.length > 4) lastHits.shift();
    if (cell) { cell.className = 'bn-cell hit explode'; cell.textContent = '✕'; }
    upd('bnHits', hits);
    const sunkName = tryCheckSunk(r, c);
    if (sunkName) {
      sunkCount++;
      lastHits = [];
      upd('bnSunk', sunkCount);
      setStatus(`¡${sunkName} hundido!`);
      if (sunkCount >= SHIPS.length) { setTimeout(endGame, 800); return; }
    } else {
      setStatus('¡Impacto directo!');
    }
  } else {
    eBoard[r][c] = 'miss';
    misses++;
    if (cell) { cell.className = 'bn-cell miss splash'; cell.textContent = '·'; }
    upd('bnMisses', misses);
    setStatus('Agua… siguiente turno.');
  }
  scheduleShot();
}

function scheduleShot() {
  if (!availCells().length) { endGame(); return; }
  timer = setTimeout(fireShot, 550 + Math.random() * 550);
}

function endGame() {
  running = false;
  setStatus(`Partida terminada — ${sunkCount}/5 hundidos, ${hits} impactos, ${misses} en agua.`);
}

document.getElementById('bnRestart').addEventListener('click', startGame);

/* Start battle when section enters viewport */
const projObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting && !running) {
      startGame();
      projObs.disconnect();
    }
  });
}, { threshold: .25 });
projObs.observe(document.getElementById('projects'));

/* ── CONTACT FORM ── */
document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const success = document.getElementById('formSuccess');
  success.classList.add('show');
  this.reset();
  setTimeout(() => {
    success.classList.remove('show');
  }, 4000);
});
