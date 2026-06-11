'use strict';

let debugMode = false;
let debugType = 'grunt';

const _dp        = document.getElementById('debug-panel');
const _dpShield  = document.getElementById('dp-shield');
const _dpBtns    = document.querySelectorAll('.dp-btn[data-type]');

function toggleDebug() {
  debugMode = !debugMode;
  _dp.style.display = debugMode ? 'flex' : 'none';
  if (debugMode && state !== 'playing') {
    state = 'playing';
    initGame();
  }
}

function debugSpawnAt(x, y) {
  if (state !== 'playing') { state = 'playing'; }
  const shield = { shieldHp: _dpShield.checked ? 10 : 0 };
  switch (debugType) {
    case 'grunt':    enemies.push(new Grunt(x, y, shield));    break;
    case 'drifter':  enemies.push(new Drifter(x, y, shield));  break;
    case 'gunner':   enemies.push(new Gunner(x, y, shield));   break;
    case 'kamikaze': enemies.push(new Kamikaze(x, y, shield)); break;
    case 'tank':     enemies.push(new Tank(x, y, shield));     break;
    case 'boss':     enemies.push(new Boss(0, shield));        break;
  }
}

// Enemy type buttons — select + spawn one at random top position
_dpBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    _dpBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    debugType = btn.dataset.type;
    debugSpawnAt(rnd(60, GW - 60), rnd(60, GH * 0.45));
  });
});

// Clear button
document.getElementById('dp-clear').addEventListener('click', () => {
  enemies = []; eBullets = []; particles = []; floaters = [];
  bossSpawned = false; bossDefeated = false;
});

// Canvas click → place selected type at cursor
canvas.addEventListener('click', e => {
  if (!debugMode) return;
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * (GW / r.width);
  const y = (e.clientY - r.top)  * (GH / r.height);
  debugSpawnAt(x, y);
});

// Backtick toggles debug mode
document.addEventListener('keydown', e => {
  if (e.code === 'F1') { e.preventDefault(); toggleDebug(); }
});
