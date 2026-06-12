'use strict';

// ─── ITEM DEFINITIONS ────────────────────────────────────────────────────────
const SHOP_ITEMS = [
  { id: 'auto_cannon',   name: 'AUTO CANNON',   cat: 'weapon', price: 150,
    sprite: () => shopSprites.autoCannon,   frameW: 48, frameH: 48, frameCount: 7,  fps: 10 },
  { id: 'big_space_gun', name: 'BIG SPACE GUN', cat: 'weapon', price: 300,
    sprite: () => shopSprites.bigSpaceGun,  frameW: 48, frameH: 48, frameCount: 12, fps: 10 },
  { id: 'rockets',       name: 'ROCKETS',       cat: 'weapon', price: 400,
    sprite: () => shopSprites.rockets,      frameW: 48, frameH: 48, frameCount: 17, fps: 10 },
  { id: 'zapper',        name: 'ZAPPER',        cat: 'weapon', price: 350,
    sprite: () => shopSprites.zapper,       frameW: 48, frameH: 48, frameCount: 14, fps: 10 },
  { id: 'front_shield',  name: 'FRONT SHIELD',  cat: 'shield', price: 250,
    sprite: () => shopSprites.frontShield,  frameW: 64, frameH: 64, frameCount: 10, fps: 10 },
  { id: 'big_pulse',     name: 'BIG PULSE',     cat: 'engine', price: 200,
    sprite: () => shopSprites.bigPulse,     frameW: 48, frameH: 48, frameCount: 1,  fps: 0  },
  { id: 'burst_engine',  name: 'BURST ENGINE',  cat: 'engine', price: 300,
    sprite: () => shopSprites.burstEngine,  frameW: 48, frameH: 48, frameCount: 1,  fps: 0  },
  { id: 'supercharged',  name: 'SUPERCHARGED',  cat: 'engine', price: 500,
    sprite: () => shopSprites.supercharged, frameW: 48, frameH: 48, frameCount: 1,  fps: 0  },
];

// ─── STATE ───────────────────────────────────────────────────────────────────
const shopAnim  = {}; // id → { frame, timer }
let   shopHover = null;
let   shopCards = []; // { id, x, y, w, h } rebuilt each draw

function initShop() {
  for (const item of SHOP_ITEMS) shopAnim[item.id] = { frame: 0, timer: 0 };
  shopHover = null;
  shopCards = [];
}

function updateShop(dt) {
  for (const item of SHOP_ITEMS) {
    if (item.fps <= 0 || item.frameCount <= 1) continue;
    const a = shopAnim[item.id];
    a.timer += dt;
    if (a.timer >= 1 / item.fps) { a.timer -= 1 / item.fps; a.frame = (a.frame + 1) % item.frameCount; }
  }
}

// ─── INPUT ───────────────────────────────────────────────────────────────────
function shopCanvasPos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (GW / r.width), y: (e.clientY - r.top) * (GH / r.height) };
}

canvas.addEventListener('mousemove', (e) => {
  if (state !== 'shop') return;
  const p = shopCanvasPos(e);
  shopHover = null;
  for (const c of shopCards) {
    if (p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h) { shopHover = c.id; break; }
  }
});

canvas.addEventListener('click', (e) => {
  if (state !== 'shop') return;
  e.stopPropagation();
  const p = shopCanvasPos(e);
  for (const c of shopCards) {
    if (p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h) {
      if (c.id === '__continue__') startNextLevel();
      else shopBuy(c.id);
      break;
    }
  }
});

function shopBuy(id) {
  if (shopOwned.has(id)) return;
  const item = SHOP_ITEMS.find(i => i.id === id);
  if (!item || credits < item.price) return;
  credits -= item.price;
  shopOwned.add(id);
  if (item.cat === 'weapon') player.equipWeapon(id);
}

// ─── DRAW ────────────────────────────────────────────────────────────────────
const CARD_H = 78, PAD = 14, GAP = 8;

function drawCard(item, cx, cy, cw) {
  const owned     = shopOwned.has(item.id);
  const canAfford = credits >= item.price;
  const hov       = shopHover === item.id;

  ctx.fillStyle = hov
    ? (owned ? 'rgba(0,50,35,0.95)' : canAfford ? 'rgba(0,25,55,0.97)' : 'rgba(28,8,8,0.95)')
    : 'rgba(0,4,18,0.88)';
  ctx.strokeStyle = owned ? '#00ffcc66' : hov ? '#00ccff' : canAfford ? '#00ffff28' : '#441111';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.rect(cx, cy, cw, CARD_H); ctx.fill(); ctx.stroke();

  // Sprite preview
  const sz  = 60;
  const sx  = cx + (CARD_H - sz) / 2;
  const sy  = cy + (CARD_H - sz) / 2;
  const a   = shopAnim[item.id];
  ctx.save();
  ctx.globalAlpha = owned ? 0.45 : 1;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(item.sprite(), a.frame * item.frameW, 0, item.frameW, item.frameH, sx, sy, sz, sz);
  ctx.restore();

  // Text
  const tx = cx + CARD_H + 4;
  ctx.font      = 'bold 9px monospace';
  ctx.fillStyle = owned ? '#00ffcc99' : hov ? '#fff' : '#cccce8';
  ctx.textAlign = 'left';
  ctx.fillText(item.name, tx, cy + 18);

  ctx.font      = '9px monospace';
  ctx.fillStyle = owned ? '#00ffcc' : canAfford ? '#ffdd00' : '#ff5555';
  ctx.fillText(owned ? 'OWNED' : `¢ ${item.price}`, tx, cy + 33);

  if (!owned) {
    ctx.font      = 'bold 8px monospace';
    ctx.fillStyle = canAfford ? (hov ? '#00ffcc' : '#00ffcc66') : '#ff444455';
    ctx.fillText(canAfford ? 'BUY' : 'FUNDS', tx, cy + CARD_H - 10);
  }
  ctx.textAlign = 'left';
}

function drawShop() {
  // Semi-transparent overlay over the scrolling background
  ctx.fillStyle = 'rgba(0,2,14,0.78)';
  ctx.fillRect(0, 0, GW, GH);

  // Header
  ctx.save();
  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = '#00ffcc';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 20;
  ctx.fillText('ARMORY', GW / 2, 30);
  ctx.shadowBlur = 0;
  ctx.font = '11px monospace';
  ctx.fillStyle = '#ffdd00';
  ctx.fillText(`¢ ${credits}  CREDITS`, GW / 2, 50);
  ctx.restore();

  shopCards = [];
  let y = 66;

  function secLabel(txt) {
    ctx.font = '8px monospace'; ctx.fillStyle = '#334455'; ctx.textAlign = 'left';
    ctx.fillText('── ' + txt + ' ──', PAD, y + 8);
    y += 16;
  }

  function drawRow(items) {
    const cw = Math.floor((GW - PAD * 2 - GAP * (items.length - 1)) / items.length);
    for (let i = 0; i < items.length; i++) {
      const cx = PAD + i * (cw + GAP);
      drawCard(items[i], cx, y, cw);
      shopCards.push({ id: items[i].id, x: cx, y, w: cw, h: CARD_H });
    }
    y += CARD_H + GAP;
  }

  const weapons = SHOP_ITEMS.filter(i => i.cat === 'weapon');
  const shields = SHOP_ITEMS.filter(i => i.cat === 'shield');
  const engines = SHOP_ITEMS.filter(i => i.cat === 'engine');

  secLabel('WEAPONS');
  drawRow(weapons.slice(0, 2));
  drawRow(weapons.slice(2, 4));

  y += 4;
  secLabel('SHIELDS');
  const shW = 200, shX = (GW - shW) / 2;
  drawCard(shields[0], shX, y, shW);
  shopCards.push({ id: shields[0].id, x: shX, y, w: shW, h: CARD_H });
  y += CARD_H + GAP;

  y += 4;
  secLabel('ENGINES');
  drawRow(engines);

  // Continue button
  y += 10;
  const bw = 160, bh = 36, bx = (GW - bw) / 2;
  const bhov = shopHover === '__continue__';
  ctx.fillStyle   = bhov ? '#00ffcc' : 'rgba(0,255,200,0.1)';
  ctx.strokeStyle = bhov ? '#00ffcc' : '#00ffcc55';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.rect(bx, y, bw, bh); ctx.fill(); ctx.stroke();
  ctx.font      = 'bold 12px monospace';
  ctx.fillStyle = bhov ? '#001a12' : '#00ffcc';
  ctx.textAlign = 'center';
  ctx.fillText('CONTINUE  ▶', GW / 2, y + bh / 2 + 5);
  ctx.textAlign = 'left';
  shopCards.push({ id: '__continue__', x: bx, y, w: bw, h: bh });

  // SPACE hint
  ctx.font      = '9px monospace';
  ctx.fillStyle = '#334455';
  ctx.textAlign = 'center';
  ctx.fillText('SPACE / ENTER to continue', GW / 2, y + bh + 18);
  ctx.textAlign = 'left';
}
