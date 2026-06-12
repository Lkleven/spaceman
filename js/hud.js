'use strict';

// ─── SCORE ───────────────────────────────────────────────────────────────────
function addScore(base) {
  score += base * combo;
  comboTimer = 2.5;
  combo = Math.min(combo + 1, 8);
  if (score > hiScore) hiScore = score;
}

// ─── COLLISION ───────────────────────────────────────────────────────────────
function rectHit(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax - aw/2 < bx + bw/2 && ax + aw/2 > bx - bw/2 &&
         ay - ah/2 < by + bh/2 && ay + ah/2 > by - bh/2;
}

function checkCollisions() {
  for (const b of pBullets) {
    if (!b.alive) continue;
    for (const e of enemies) {
      if (!e.alive) continue;
      if (rectHit(b.x, b.y, b.w, b.h, e.x, e.y, e.w, e.h)) {
        e.hit(b.dmg); b.alive = false; break;
      }
    }
  }
  if (player.alive) {
    for (const b of eBullets) {
      if (!b.alive) continue;
      if (rectHit(b.x, b.y, b.w, b.h, player.x, player.y, player.w, player.h)) {
        player.hit(); b.alive = false;
      }
    }
  }
  if (player.alive) {
    for (const e of enemies) {
      if (!e.alive) continue;
      if (rectHit(player.x, player.y, player.w, player.h, e.x, e.y, e.w * 0.7, e.h * 0.7)) {
        player.hit(); e.hit(99);
      }
    }
  }
  if (player.alive) {
    for (const pk of pickups) {
      if (!pk.alive) continue;
      if (rectHit(player.x, player.y, player.w + 14, player.h + 14, pk.x, pk.y, 20, 20)) {
        applyPickup(pk); pk.alive = false;
      }
    }
  }

  // Asteroid vs player bullets (bullet destroyed, asteroid explodes)
  for (const b of pBullets) {
    if (!b.alive) continue;
    for (const a of asteroids) {
      if (!a.alive || a.phase === 'exploding') continue;
      if (rectHit(b.x, b.y, b.w, b.h, a.x, a.y, a.size * 0.6, a.size * 0.6)) {
        b.alive = false;
        a.explode();
        break;
      }
    }
  }

  // Asteroid vs player (player takes damage, asteroid keeps going)
  if (player.alive) {
    for (const a of asteroids) {
      if (!a.alive || a.phase === 'exploding') continue;
      if (rectHit(player.x, player.y, player.w, player.h, a.x, a.y, a.size * 0.5, a.size * 0.5)) {
        player.hit();
      }
    }
  }
}

function applyPickup(pk) {
  switch (pk.type) {
    case 'weapon':
      player.weaponLevel = Math.min(3, player.weaponLevel + 1);
      floaters.push(new Floater(player.x, player.y - 20, 'WEAPON UP!', '#00ffcc'));
      break;
    case 'shield':
      player.hasShield = true;
      floaters.push(new Floater(player.x, player.y - 20, 'SHIELD!', '#4488ff'));
      break;
    case 'bomb':
      for (const e of enemies) if (e.alive) e.hit(999);
      burst(GW / 2, GH / 2, ['#ff8800', '#ffee00', '#ffffff'], 40, 300, 0.8, 6);
      shake = Math.max(shake, 14);
      floaters.push(new Floater(GW / 2, GH / 2 - 30, 'BOMB!', '#ff4400'));
      break;
    case 'life':
      player.hp = Math.min(player.maxHp + 1, player.hp + 1);
      player.maxHp = Math.max(player.maxHp, player.hp);
      floaters.push(new Floater(player.x, player.y - 20, '+ LIFE', '#ff44aa'));
      break;
  }
  burst(pk.x, pk.y, ['#ffffff', '#ffffaa'], 10, 80, 0.4, 4);
}

// ─── BACKGROUND ──────────────────────────────────────────────────────────────
function drawScrollLayer(img, offset, alpha) {
  // Display at 720×720 centred horizontally so it covers the 480×720 canvas
  const d = 720, x = (GW - d) / 2;
  ctx.globalAlpha = alpha;
  // Two tiles cover the full canvas height seamlessly
  const y = offset % d;
  ctx.drawImage(img, x, y - d, d, d);
  ctx.drawImage(img, x, y,     d, d);
  if (y + d < GH) ctx.drawImage(img, x, y + d, d, d);
  ctx.globalAlpha = 1;
}

function drawScrollLayerLarge(img, offset, alpha, displaySize) {
  // For large non-tiling images: show one tile slow-scrolled, wrap when needed
  const d = displaySize, x = (GW - d) / 2;
  ctx.globalAlpha = alpha;
  const y = offset % d;
  ctx.drawImage(img, x, y - d, d, d);
  ctx.drawImage(img, x, y,     d, d);
  if (y + d < GH) ctx.drawImage(img, x, y + d, d, d);
  ctx.globalAlpha = 1;
}

function drawBG() {
  if (levelIdx === 0) {
    ctx.fillStyle = '#00010a';
    ctx.fillRect(0, 0, GW, GH);
    drawScrollLayer(bgSprites.starfield,  bgScrollBase,  1.0);
    drawScrollLayer(bgSprites.starsSmall, bgScrollSmall, 0.55);
    drawScrollLayer(bgSprites.starsBig,   bgScrollBig,   0.45);
  } else if (levelIdx === 1) {
    ctx.fillStyle = '#0d0010';
    ctx.fillRect(0, 0, GW, GH);
    drawScrollLayerLarge(bgSprites.nebula,      bgScrollNebula, 0.7,  720);
    drawScrollLayer(bgSprites.starsSmall2, bgScrollSmall,  0.45);
    drawScrollLayer(bgSprites.starsBig2,   bgScrollBig,    0.35);
  } else {
    const grd = ctx.createLinearGradient(0, 0, 0, GH);
    grd.addColorStop(0, bgCols[0]);
    grd.addColorStop(1, bgCols[1]);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, GW, GH);
  }
}

// ─── HUD ─────────────────────────────────────────────────────────────────────
function drawHUD() {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, GW, 36);

  ctx.fillStyle = '#e0e0ff';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`SCORE  ${score}`, 12, 22);

  ctx.fillStyle = '#aaaacc';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`HI  ${hiScore}`, GW / 2, 22);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#ff44aa';
  for (let i = 0; i < player.hp; i++) {
    ctx.font = '16px monospace';
    ctx.fillText('♥', GW - 24 - i * 20, 22);
  }

  ctx.fillStyle = '#00ffcc';
  ctx.font = '10px monospace';
  const wLabels = ['·', '=', '≡', '✦'];
  ctx.fillText(`WPN ${wLabels[player.weaponLevel]}`, GW - 70, 34);

  if (combo > 1 && comboTimer > 0) {
    const a = Math.min(1, comboTimer * 2);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = '#ffee00';
    ctx.font = `bold ${12 + combo}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`x${combo} COMBO`, GW / 2, GH / 2);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  const lvDef = LEVEL_DEFS[levelIdx];
  if (lvDef) {
    ctx.fillStyle = 'rgba(100,150,255,0.6)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(lvDef.name, GW / 2, GH - 8);
    ctx.textAlign = 'left';
  }

  drawZapperBar();
}

function drawZapperBar() {
  if (player.equippedWeapon !== 'zapper') return;
  const def = WEAPON_DEFS['zapper'];
  const onCooldown = player.beamCooldown > 0;
  const hasCharge  = player.beaming || player.beamCharge > 0;
  if (!onCooldown && !hasCharge) return;

  const bw = 120, bh = 5;
  const bx = (GW - bw) / 2, by = GH - 44;

  // Trough
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(bx, by, bw, bh);

  if (onCooldown) {
    const t = player.beamCooldown / def.cooldownTime;
    const pulse = 0.65 + Math.sin(totalTime * 10) * 0.35;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ff2200';
    ctx.fillRect(bx, by, bw * t, bh);
    ctx.restore();
    ctx.font = '8px monospace';
    ctx.fillStyle = '#ff4422';
    ctx.textAlign = 'center';
    ctx.fillText('COOLDOWN', GW / 2, by - 4);
  } else {
    const t = Math.min(1, player.beamCharge / def.maxBeamTime);
    // Cyan → yellow → red based on heat
    const r = t < 0.5 ? Math.round(t * 2 * 255)       : 255;
    const g = t < 0.5 ? 255                             : Math.round((1 - (t - 0.5) * 2) * 255);
    const b = t < 0.5 ? Math.round((1 - t * 2) * 200)  : 0;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(bx, by, bw * t, bh);
    ctx.font = '8px monospace';
    ctx.fillStyle = '#6688aa';
    ctx.textAlign = 'center';
    ctx.fillText('ZAPPER', GW / 2, by - 4);
  }

  ctx.textAlign = 'left';
}

// ─── SCREENS ─────────────────────────────────────────────────────────────────
function drawMenu() {
  drawBG();
  for (const s of stars) s.draw();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#00eeff';
  ctx.font = 'bold 58px monospace';
  ctx.shadowColor = '#00eeff'; ctx.shadowBlur = 30;
  ctx.fillText('SPACEMAN', GW / 2, 220);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#aaaacc'; ctx.font = '13px monospace';
  ctx.fillText('TOP-DOWN SPACE SHOOTER', GW / 2, 255);
  ctx.fillStyle = '#c8c8e0'; ctx.font = '12px monospace';
  const lines = [
    'ARROW KEYS / WASD — Move', 'SPACE — Shoot (hold)', '',
    'Collect power-ups from defeated enemies.',
    '5 Sectors — boss at the end of each.',
  ];
  lines.forEach((l, i) => ctx.fillText(l, GW / 2, 320 + i * 22));
  if (Math.floor(totalTime * 2) % 2 === 0) {
    ctx.fillStyle = '#ffee44'; ctx.font = 'bold 18px monospace';
    ctx.fillText('PRESS SPACE TO START', GW / 2, 470);
  }
  ctx.shadowBlur = 0; ctx.textAlign = 'left';
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, GW, GH);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff2200'; ctx.font = 'bold 48px monospace';
  ctx.shadowColor = '#ff2200'; ctx.shadowBlur = 25;
  ctx.fillText('GAME OVER', GW / 2, GH / 2 - 60);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#e0e0ff'; ctx.font = '18px monospace';
  ctx.fillText(`SCORE: ${score}`, GW / 2, GH / 2);
  ctx.fillText(`HI-SCORE: ${hiScore}`, GW / 2, GH / 2 + 28);
  if (Math.floor(totalTime * 2) % 2 === 0) {
    ctx.fillStyle = '#ffee44'; ctx.font = 'bold 16px monospace';
    ctx.fillText('PRESS SPACE TO RETRY', GW / 2, GH / 2 + 80);
  }
  ctx.textAlign = 'left'; ctx.shadowBlur = 0;
}

function drawLevelClear() {
  ctx.fillStyle = 'rgba(0,0,10,0.5)';
  ctx.fillRect(0, 0, GW, GH);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#00ffaa'; ctx.font = 'bold 34px monospace';
  ctx.shadowColor = '#00ffaa'; ctx.shadowBlur = 20;
  ctx.fillText('SECTOR CLEAR', GW / 2, GH / 2 - 40);
  ctx.shadowBlur = 0;
  if (levelIdx < LEVEL_DEFS.length) {
    ctx.fillStyle = '#aaccff'; ctx.font = '14px monospace';
    ctx.fillText(LEVEL_DEFS[levelIdx].name, GW / 2, GH / 2 + 10);
  }
  ctx.fillStyle = '#e0e0cc'; ctx.font = '12px monospace';
  ctx.fillText('Get ready...', GW / 2, GH / 2 + 40);
  ctx.textAlign = 'left'; ctx.shadowBlur = 0;
}

function drawVictory() {
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, GW, GH);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffdd00'; ctx.font = 'bold 44px monospace';
  ctx.shadowColor = '#ffdd00'; ctx.shadowBlur = 28;
  ctx.fillText('YOU WIN!', GW / 2, GH / 2 - 70);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#e0e0ff'; ctx.font = '16px monospace';
  ctx.fillText(`FINAL SCORE: ${score}`, GW / 2, GH / 2 - 20);
  ctx.fillText(`HI-SCORE: ${hiScore}`, GW / 2, GH / 2 + 12);
  ctx.fillStyle = '#aaaacc'; ctx.font = '13px monospace';
  ctx.fillText('All 5 sectors cleared. Earth is safe.', GW / 2, GH / 2 + 50);
  if (Math.floor(totalTime * 2) % 2 === 0) {
    ctx.fillStyle = '#ffee44'; ctx.font = 'bold 16px monospace';
    ctx.fillText('PRESS SPACE TO PLAY AGAIN', GW / 2, GH / 2 + 100);
  }
  ctx.textAlign = 'left'; ctx.shadowBlur = 0;
}

function drawPause() {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, GW, GH);
}
