'use strict';

// ─── LEVEL DEFINITIONS ───────────────────────────────────────────────────────
// Wave: { type, count, interval, xMode, delay, speedMult }
// xMode: 'spread' | 'random' | 'left' | 'right' | 'center' | 'sides' | 'v'
const LEVEL_DEFS = [
  {
    name: 'SECTOR 1 — FRONTIER SPACE',
    bgColor: ['#000520', '#020a20'],
    waves: [
      { type: 'grunt',   count: 8,  interval: 0.7, xMode: 'spread', delay: 0 },
      { type: 'grunt',   count: 10, interval: 0.5, xMode: 'v',      delay: 3 },
      { type: 'drifter', count: 5,  interval: 1.0, xMode: 'random', delay: 2 },
    ],
  },
  {
    name: 'SECTOR 2 — NEBULA EXPANSE',
    bgColor: ['#1a0020', '#0d0010'],
    waves: [
      { type: 'grunt',    count: 16, interval: 0.35, xMode: 'spread', delay: 0 },
      { type: 'kamikaze', count: 10, interval: 0.45, xMode: 'random', delay: 2 },
      { type: 'drifter',  count: 12, interval: 0.45, xMode: 'sides',  delay: 2 },
      { type: 'gunner',   count: 6,  interval: 1.0,  xMode: 'spread', delay: 2 },
      { type: 'grunt',    count: 14, interval: 0.3,  xMode: 'v',      delay: 2 },
      { type: 'kamikaze', count: 10, interval: 0.4,  xMode: 'sides',  delay: 2 },
      { type: 'tank',     count: 2,  interval: 2.5,  xMode: 'spread', delay: 3 },
      { type: 'drifter',  count: 12, interval: 0.4,  xMode: 'random', delay: 2 },
      { type: 'gunner',   count: 6,  interval: 0.8,  xMode: 'center', delay: 2 },
      { type: 'kamikaze', count: 8,  interval: 0.35, xMode: 'random', delay: 2 },
      { type: 'tank',     count: 2,  interval: 2.0,  xMode: 'sides',  delay: 3 },
    ],
  },
  {
    name: 'SECTOR 3 — NEBULA DRIFT',
    bgColor: ['#0a001a', '#14002a'],
    waves: [
      { type: 'gunner',   count: 5,  interval: 1.0, xMode: 'spread', delay: 0 },
      { type: 'kamikaze', count: 10, interval: 0.4, xMode: 'random', delay: 2 },
      { type: 'drifter',  count: 10, interval: 0.4, xMode: 'v',      delay: 2 },
      { type: 'tank',     count: 2,  interval: 2.5, xMode: 'center', delay: 3 },
    ],
  },
  {
    name: 'SECTOR 4 — ENEMY STRONGHOLD',
    bgColor: ['#001a00', '#002a00'],
    waves: [
      { type: 'tank',     count: 3,  interval: 2.0,  xMode: 'spread', delay: 0 },
      { type: 'kamikaze', count: 12, interval: 0.3,  xMode: 'random', delay: 3 },
      { type: 'gunner',   count: 6,  interval: 0.8,  xMode: 'spread', delay: 2 },
      { type: 'drifter',  count: 12, interval: 0.35, xMode: 'sides',  delay: 2 },
    ],
  },
  {
    name: 'SECTOR 5 — THE LAST STAND',
    bgColor: ['#1a0000', '#2a0000'],
    waves: [
      { type: 'grunt',    count: 15, interval: 0.3,  xMode: 'random', delay: 0 },
      { type: 'kamikaze', count: 10, interval: 0.4,  xMode: 'sides',  delay: 2 },
      { type: 'tank',     count: 4,  interval: 1.5,  xMode: 'spread', delay: 2 },
      { type: 'gunner',   count: 8,  interval: 0.7,  xMode: 'random', delay: 2 },
      { type: 'drifter',  count: 14, interval: 0.3,  xMode: 'v',      delay: 2 },
    ],
  },
];

// ─── WAVE SPAWNER ────────────────────────────────────────────────────────────
let bossSpawned = false, bossDefeated = false;
let spawnQueue = [];

function buildQueue(waveDef) {
  const speedMult  = waveDef.speedMult || 1;
  const xPositions = getXPositions(waveDef.xMode, waveDef.count);
  spawnQueue = [];
  for (let i = 0; i < waveDef.count; i++)
    spawnQueue.push({ x: xPositions[i], type: waveDef.type, speedMult });
  spawnTimer = waveDef.interval;
}

function getXPositions(mode, count) {
  const out = [], pad = 40;
  switch (mode) {
    case 'spread':
      for (let i = 0; i < count; i++)
        out.push(pad + (i / (count - 1 || 1)) * (GW - pad * 2));
      break;
    case 'v':
      for (let i = 0; i < count; i++) {
        const half = Math.floor(count / 2);
        const side = i < half ? -1 : 1;
        const idx  = i < half ? i : i - half;
        out.push(GW / 2 + (side * (idx + 1) * (GW / 2 - pad)) / (half + 1));
      }
      break;
    case 'sides':
      for (let i = 0; i < count; i++)
        out.push(i % 2 === 0 ? rnd(pad, GW / 2 - 20) : rnd(GW / 2 + 20, GW - pad));
      break;
    case 'center':
      for (let i = 0; i < count; i++)
        out.push(GW / 2 + (i - (count - 1) / 2) * 60);
      break;
    default:
      for (let i = 0; i < count; i++) out.push(rnd(pad, GW - pad));
  }
  return out;
}

function spawnEnemy(x, type, speedMult) {
  const s      = speedMult || 1;
  const faster = 1 + levelIdx * 0.12;
  switch (type) {
    case 'grunt':    enemies.push(new Grunt(x,    -20, { speed: 80  * faster * s })); break;
    case 'drifter':  enemies.push(new Drifter(x,  -20, { speed: 70  * faster * s })); break;
    case 'kamikaze': enemies.push(new Kamikaze(x, -20, { speed: 120 * faster * s })); break;
    case 'gunner':   enemies.push(new Gunner(x,   -20, { speed: 65  * faster * s })); break;
    case 'tank':     enemies.push(new Tank(x,     -20, { speed: 40  * faster * s })); break;
  }
}

function dropPickup(x, y) {
  const types   = ['weapon', 'shield', 'bomb', 'life'];
  const weights = [0.45, 0.3, 0.15, 0.1];
  let r = Math.random(), t = 0;
  for (let i = 0; i < types.length; i++) {
    t += weights[i];
    if (r < t) { pickups.push(new Pickup(x, y, types[i])); return; }
  }
}
