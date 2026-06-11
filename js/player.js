'use strict';

class Player {
  constructor() {
    this.x = GW / 2; this.y = GH - 80;
    this.w = 28; this.h = 32;
    this.speed = 230;
    this.hp = 3; this.maxHp = 3;
    this.weaponLevel = 0; // 0=single 1=double 2=triple 3=spread
    this.bulletSpeed = 550;
    this.hasShield = false;
    this.fireTimer = 0; this.fireRate = 0.35;
    this.iframes = 0;
    this.thrustAnim = 0;
    this.moving = false;
    this.engineFrame = 0; this.engineTimer = 0;
    this.alive = true;
  }

  update(dt) {
    if (!this.alive) return;
    this.iframes   = Math.max(0, this.iframes - dt);
    this.fireTimer = Math.max(0, this.fireTimer - dt);
    this.thrustAnim += dt * 8;

    let dx = 0, dy = 0;
    if (keys['ArrowLeft']  || keys['KeyA']) dx = -1;
    if (keys['ArrowRight'] || keys['KeyD']) dx =  1;
    if (keys['ArrowUp']    || keys['KeyW']) dy = -1;
    if (keys['ArrowDown']  || keys['KeyS']) dy =  1;
    if (dx && dy) { dx *= 0.707; dy *= 0.707; }

    this.x = clamp(this.x + dx * this.speed * dt, this.w / 2, GW - this.w / 2);
    this.y = clamp(this.y + dy * this.speed * dt, GH / 2, GH - this.h / 2 - 8);

    const wasMoving = this.moving;
    this.moving = !!(dx || dy);
    if (this.moving !== wasMoving) { this.engineFrame = 0; this.engineTimer = 0; }

    this.engineTimer += dt;
    const engineFps    = this.moving ? 12 : 4;
    const engineFrames = this.moving ? 4  : 2;
    if (this.engineTimer >= 1 / engineFps) {
      this.engineTimer -= 1 / engineFps;
      this.engineFrame = (this.engineFrame + 1) % engineFrames;
    }

    if ((keys['Space'] || keys['KeyZ']) && this.fireTimer <= 0) {
      this.shoot();
      this.fireTimer = this.fireRate;
    }
  }

  shoot() {
    playSound(sfxLaser);
    const configs = [
      [[0, 0, 0]],
      [[-7, 0, 0], [7, 0, 0]],
      [[-10, 0, 0], [0, 0, 0], [10, 0, 0]],
      [[-12, 0, -60], [-5, 0, -20], [5, 0, 20], [12, 0, 60]],
    ];
    const shots = configs[Math.min(this.weaponLevel, 3)];
    for (const [ox, , ang] of shots) {
      const rad = (ang * Math.PI) / 180;
      pBullets.push(new Bullet(
        this.x + ox, this.y - 20,
        Math.sin(rad) * this.bulletSpeed,
        -Math.cos(rad) * this.bulletSpeed,
        1, '#00ffff', 3, 12, 'player'
      ));
    }
  }

  hit() {
    if (this.iframes > 0) return;
    if (this.hasShield) {
      this.hasShield = false;
      shake = Math.max(shake, 4);
      burst(this.x, this.y, ['#4488ff', '#88aaff'], 10, 100, 0.4, 4);
      return;
    }
    this.hp--;
    this.iframes = 1.8;
    shake = Math.max(shake, 8);
    burst(this.x, this.y, ['#ff4444', '#ff8844', '#ffffff'], 14, 130, 0.5, 5);
    if (this.hp <= 0) this.alive = false;
  }

  draw() {
    if (!this.alive) return;
    ctx.save();
    const x = this.x, y = this.y;
    const EW = 48, EH = 48;
    const eCol = this.engineFrame;
    ctx.drawImage(engineSheet, eCol * EW, EH, EW, EH, x - EW / 2, y - 20, EW, EH);

    const sw = 64, sh = 64;
    const sprite = this.hp >= this.maxHp ? shipSprites.full
                 : this.hp >= 2          ? shipSprites.slight
                 : this.hp >= 1          ? shipSprites.damaged
                 :                         shipSprites.veryDamaged;
    ctx.drawImage(sprite, x - sw / 2, y - sh / 2, sw, sh);

    if (this.hasShield) {
      ctx.strokeStyle = '#4488ff'; ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
      ctx.shadowColor = '#4488ff'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}
