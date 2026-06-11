'use strict';

// ─── INIT ────────────────────────────────────────────────────────────────────
function initGame() {
  score = 0; lives = 3; levelIdx = 0;
  initLevel();
  player.weaponLevel = 0;
  player.bulletSpeed = 550;
  player.fireRate = 0.35;
}

function initLevel() {
  enemies = []; pBullets = []; eBullets = [];
  pickups = []; particles = []; floaters = [];
  asteroids = []; asteroidTimer = rnd(2, 5);
  bossSpawned = false; bossDefeated = false;
  waveIdx = 0; spawnTimer = 0; spawnQueue = [];
  combo = 1; comboTimer = 0;

  if (!player) {
    player = new Player();
  } else {
    player.x = GW / 2; player.y = GH - 80;
    player.iframes = 0; player.alive = true;
  }
  player.hp = lives;
  player.maxHp = Math.max(lives, player.maxHp || 3);

  const lvDef = LEVEL_DEFS[levelIdx];
  if (lvDef) bgCols = [...lvDef.bgColor];
  waveDelay = 1.2;
}

function nextLevel() {
  levelIdx++;
  lives = player.hp;
  if (levelIdx >= LEVEL_DEFS.length) { state = 'victory'; return; }
  const lvDef = LEVEL_DEFS[levelIdx];
  bgCols = [...lvDef.bgColor];
  enemies = []; pBullets = []; eBullets = [];
  pickups = []; particles = []; floaters = [];
  asteroids = []; asteroidTimer = rnd(2, 5);
  bossSpawned = false; bossDefeated = false;
  waveIdx = 0; spawnTimer = 0; spawnQueue = [];
  player.x = GW / 2; player.y = GH - 80;
  player.iframes = 0; player.alive = true;
  player.hp = lives;
  waveDelay = 1.0;
  state = 'playing';
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────
function update(dt) {
  totalTime += dt;
  shake = Math.max(0, shake - dt * 20);
  comboTimer = Math.max(0, comboTimer - dt);
  if (comboTimer <= 0 && combo > 1) combo = 1;

  for (const s of stars) s.update(dt);

  if (state === 'menu') {
    menuCtrlEl.style.display = 'flex';
    if (bgmMenu.paused) {
      bgmMenu.currentTime = 1;
      bgmMenu.volume = musicVolume;
      bgmMenu.play().catch(() => {});
    }
    if (jp['Space'] || jp['Enter']) {
      menuCtrlEl.style.display = 'none';
      stopAllBgm();
      state = 'playing';
      initGame();
      playLevelBgm(bgmLevel1);
    }
    return;
  }
  menuCtrlEl.style.display = 'none';
  if (state === 'gameover') {
    if (jp['Space'] || jp['Enter']) { stopAllBgm(); state = 'playing'; initGame(); playLevelBgm(bgmLevel1); }
    return;
  }
  if (state === 'victory') {
    if (jp['Space'] || jp['Enter']) { stopAllBgm(); state = 'menu'; }
    return;
  }
  if (state === 'levelclear') {
    stateTimer -= dt;
    for (const p of particles) p.update(dt);
    particles = particles.filter((p) => p.alive);
    if (stateTimer <= 0) nextLevel();
    return;
  }

  // ── PLAYING ──────────────────────────────────────────────────────────────
  player.update(dt);

  if (!debugMode) {
    const lvDef = LEVEL_DEFS[levelIdx];
    if (!bossSpawned) {
      if (waveDelay > 0) {
        waveDelay -= dt;
        if (waveDelay <= 0 && spawnQueue.length === 0 && waveIdx < lvDef.waves.length)
          buildQueue(lvDef.waves[waveIdx]);
      } else if (spawnQueue.length > 0) {
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          const s = spawnQueue.shift();
          spawnEnemy(s.x, s.type, s.speedMult);
          const waveDef = lvDef.waves[waveIdx];
          spawnTimer = waveDef ? waveDef.interval : 0.5;
        }
      } else {
        const livingEnemies = enemies.filter((e) => e.alive).length;
        if (livingEnemies === 0) {
          waveIdx++;
          if (waveIdx < lvDef.waves.length) {
            waveDelay = lvDef.waves[waveIdx].delay || 1.5;
          } else {
            bossSpawned = true;
            enemies.push(new Boss(levelIdx));
            floaters.push(new Floater(GW / 2, GH / 2 - 60, '⚠ BOSS ⚠', '#ff2200'));
            shake = Math.max(shake, 10);
          }
        }
      }
    } else {
      const boss = enemies.find((e) => e.alive && e instanceof Boss);
      if (!boss && !bossDefeated) {
        bossDefeated = true;
        state = 'levelclear';
        stateTimer = 3.5;
        burst(GW / 2, GH / 4, ['#ffdd00', '#ffffff', '#ffaa00', '#ff6600'], 40, 200, 1.2, 7);
        shake = Math.max(shake, 15);
      }
    }
  }

  // Asteroid spawning
  asteroidTimer -= dt;
  if (asteroidTimer <= 0) {
    asteroids.push(new Asteroid());
    asteroidTimer = rnd(3, 8);
  }

  for (const e of enemies) e.update(dt);
  for (const b of pBullets) b.update(dt);
  for (const b of eBullets) b.update(dt);
  for (const pk of pickups) pk.update(dt);
  for (const p of particles) p.update(dt);
  for (const f of floaters) f.update(dt);
  for (const a of asteroids) a.update(dt);

  checkCollisions();

  enemies   = enemies.filter((e) => e.alive);
  pBullets  = pBullets.filter((b) => b.alive);
  eBullets  = eBullets.filter((b) => b.alive);
  pickups   = pickups.filter((pk) => pk.alive);
  particles = particles.filter((p) => p.alive);
  floaters  = floaters.filter((f) => f.alive);
  asteroids = asteroids.filter((a) => a.alive);

  if (!player.alive) {
    burst(player.x, player.y, ['#ff4444', '#ff8844', '#ffee00', '#ffffff'], 25, 180, 1.0, 7);
    shake = Math.max(shake, 15);
    state = 'gameover';
  }
}

// ─── RENDER ──────────────────────────────────────────────────────────────────
function render() {
  ctx.save();
  if (shake > 0.5) ctx.translate(rnd(-shake, shake), rnd(-shake, shake));

  drawBG();
  for (const s of stars) s.draw();

  if (state === 'menu')     { drawMenu();     ctx.restore(); return; }
  if (state === 'gameover') { for (const p of particles) p.draw(); drawGameOver(); ctx.restore(); return; }
  if (state === 'victory')  { drawVictory();  ctx.restore(); return; }

  for (const a of asteroids) a.draw();
  for (const pk of pickups)  pk.draw();
  for (const p of particles) p.draw();
  for (const e of enemies)   e.draw();
  for (const b of eBullets)  b.draw();
  for (const b of pBullets)  b.draw();
  player.draw();
  for (const f of floaters)  f.draw();
  drawHUD();

  if (state === 'levelclear') drawLevelClear();
  if (paused) drawPause();

  ctx.restore();
}

// ─── SOUND CONTROLS (shared by menu + pause) ─────────────────────────────────
function applyMusicVolume(val) {
  musicVolume = val;
  localStorage.setItem('spaceman_vol_music', musicVolume);
  [bgmMenu, bgmLevel1].forEach(b => { if (!b.paused) b.volume = musicVolume; });
  const v = Math.round(val * 100);
  [document.getElementById('vol-master'),      document.getElementById('menu-vol-music')]
    .forEach(el => { if (el) el.value = v; });
  [document.getElementById('vol-master-val'),  document.getElementById('menu-vol-music-val')]
    .forEach(el => { if (el) el.textContent = v; });
}
function applySfxVolume(val) {
  sfxVolume = val;
  localStorage.setItem('spaceman_vol_sfx', sfxVolume);
  const v = Math.round(val * 100);
  [document.getElementById('vol-sfx'),         document.getElementById('menu-vol-sfx')]
    .forEach(el => { if (el) el.value = v; });
  [document.getElementById('vol-sfx-val'),     document.getElementById('menu-vol-sfx-val')]
    .forEach(el => { if (el) el.textContent = v; });
}

// Initialise all sliders from saved values
applyMusicVolume(musicVolume);
applySfxVolume(sfxVolume);

['vol-master', 'menu-vol-music'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', e => applyMusicVolume(e.target.value / 100));
});
['vol-sfx', 'menu-vol-sfx'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', e => applySfxVolume(e.target.value / 100));
});

// ─── PAUSE MENU ──────────────────────────────────────────────────────────────
const pmEl       = document.getElementById('pause-menu');
const menuCtrlEl = document.getElementById('menu-controls');

function setPaused(val) {
  paused = val;
  pmEl.style.display = paused ? 'flex' : 'none';
}

// ─── BOOTSTRAP ───────────────────────────────────────────────────────────────
stars     = Array.from({ length: 80 }, () => new Star());
player    = new Player();
enemies   = []; pBullets = []; eBullets = [];
pickups   = []; particles = []; floaters = [];
asteroids = []; asteroidTimer = rnd(2, 5);

let lastTime = 0;
function loop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  if (jp['KeyP'] && state === 'playing') setPaused(!paused);
  if (!paused) update(dt);
  render();
  clearJP();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
