'use strict';

// ─── ENEMY BASE ───────────────────────────────────────────────────────────────
class Enemy {
  constructor(x, y, opts) {
    this.x = x; this.y = y;
    this.w = opts.w || 28; this.h = opts.h || 28;
    this.hp = opts.hp || 1; this.maxHp = this.hp;
    this.score = opts.score || 100;
    this.color = opts.color || '#ff4444';
    this.accentColor = opts.accent || '#ff8888';
    this.speed = opts.speed || 80;
    this.alive = true; this.hitFlash = 0; this.t = 0;
    this.spawnX = x;
    this.fireTimer = opts.fireDelay || rnd(1, 3);
    this.fireRate  = opts.fireRate  || 2.5;
    this.drops     = opts.drops     || 0.12;
    this.shieldHp         = opts.shieldHp         || 0;
    this.shieldMaxHp      = this.shieldHp;
    this.shieldFrameCount = opts.shieldFrameCount || 10;
    this.shieldFrame = 0;
    this.shieldTimer = 0;
    this.shieldFlash = 0;
    this.engineFrameCount = opts.engineFrameCount || 0;
    this.engineFps        = opts.engineFps        || 10;
    this.engineFrame = 0;
    this.engineTimer = 0;
  }

  baseUpdate(dt) {
    this.t += dt;
    this.hitFlash  = Math.max(0, this.hitFlash - dt * 8);
    this.shieldFlash = Math.max(0, this.shieldFlash - dt * 8);
    this.fireTimer = Math.max(0, this.fireTimer - dt);
    if (this.shieldHp > 0) {
      this.shieldTimer += dt;
      if (this.shieldTimer >= 1 / 10) {
        this.shieldTimer -= 1 / 10;
        this.shieldFrame = (this.shieldFrame + 1) % this.shieldFrameCount;
      }
    }
    if (this.engineFrameCount > 0) {
      this.engineTimer += dt;
      if (this.engineTimer >= 1 / this.engineFps) {
        this.engineTimer -= 1 / this.engineFps;
        this.engineFrame = (this.engineFrame + 1) % this.engineFrameCount;
      }
    }
  }

  hit(dmg) {
    if (this.shieldHp > 0) {
      this.shieldHp = Math.max(0, this.shieldHp - dmg);
      this.shieldFlash = 1;
      burst(this.x, this.y, ['#00ccff', '#88ddff', '#ffffff'], 4, 60, 0.2, 3);
      if (this.shieldHp <= 0)
        burst(this.x, this.y, ['#00ccff', '#ffffff', '#88ddff'], 14, 120, 0.5, 4);
      return;
    }
    this.hp -= dmg;
    this.hitFlash = 1;
    burst(this.x, this.y, [this.color, this.accentColor, '#ffffff'], 5, 80, 0.3, 3);
    if (this.hp <= 0) this.die();
  }

  die() {
    this.alive = false;
    if (this._chargeAudio) { this._chargeAudio.pause(); this._chargeAudio = null; }
    if (this._fireAudio)   { this._fireAudio.pause();   this._fireAudio   = null; }
    playSound(this.w >= 30 ? sfxExplosionLarge : sfxExplosion);
    burst(this.x, this.y, [this.color, this.accentColor, '#fff', '#ffee00'], 18, 140, 0.7, 5);
    shake = Math.max(shake, 5);
    addScore(this.score);
    floaters.push(new Floater(this.x, this.y - 10, `+${this.score * combo}`, this.accentColor));
    if (Math.random() < this.drops) dropPickup(this.x, this.y);
  }

  shootAt(tx, ty, speed, color) {
    const dx = tx - this.x, dy = ty - this.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    eBullets.push(new Bullet(
      this.x, this.y + this.h / 2,
      (dx / d) * speed, (dy / d) * speed,
      1, color || '#ff4400', 4, 4, 'enemy'
    ));
  }

  drawBody(ctx, drawFn) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.hitFlash > 0) ctx.filter = `brightness(${1 + this.hitFlash * 5})`;
    drawFn(ctx);
    ctx.restore();
  }

  drawHPBar(ctx) {
    if (this.hp >= this.maxHp || this.maxHp <= 1) return;
    const bw = this.w * 1.4, bh = 4;
    const bx = this.x - bw / 2, by = this.y - this.h / 2 - 8;
    ctx.fillStyle = '#330000';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = this.color;
    ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), bh);
  }

  drawShieldBar(ctx) {
    if (this.shieldMaxHp <= 0) return;
    const bw = this.w * 1.4, bh = 4;
    const bx = this.x - bw / 2, by = this.y - this.h / 2 - 14;
    ctx.fillStyle = '#003344';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#00ccff';
    ctx.fillRect(bx, by, bw * Math.max(0, this.shieldHp / this.shieldMaxHp), bh);
  }

  drawShieldSprite(ctx, sheet, frameW, frameH, displayW, displayH) {
    if (this.shieldHp <= 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = 0.85;
    if (this.shieldFlash > 0) ctx.filter = `brightness(${1 + this.shieldFlash * 3})`;
    ctx.scale(1, -1);
    ctx.drawImage(sheet, this.shieldFrame * frameW, 0, frameW, frameH,
      -displayW / 2, -displayH / 2, displayW, displayH);
    ctx.restore();
  }

  drawEngineSprite(ctx, sheet, frameW, frameH, displayW, displayH) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(1, -1);
    ctx.drawImage(sheet, this.engineFrame * frameW, 0, frameW, frameH,
      -displayW / 2, -displayH / 2, displayW, displayH);
    ctx.restore();
  }

  drawShieldGlow(ctx) {
    if (this.shieldHp <= 0) return;
    const r = Math.max(this.w, this.h) * 0.75;
    const pulse = 0.7 + Math.sin(this.t * 4) * 0.15;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.shieldFlash > 0) ctx.filter = `brightness(${1 + this.shieldFlash * 2})`;
    ctx.strokeStyle = '#00ccff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ccff';
    ctx.shadowBlur = 10;
    ctx.globalAlpha = pulse * 0.5;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = pulse * 0.12;
    ctx.fillStyle = '#00ccff';
    ctx.fill();
    ctx.restore();
  }
}

// ─── GRUNT ───────────────────────────────────────────────────────────────────
class Grunt extends Enemy {
  constructor(x, y, opts) {
    super(x, y, { w: 24, h: 22, hp: 1, score: 100, color: '#ff5533', accent: '#ffaa66',
                  speed: opts?.speed || 80, shieldFrameCount: 14, engineFrameCount: 10, ...opts });
    this.vy = this.speed;
  }
  update(dt) {
    this.baseUpdate(dt);
    this.y += this.vy * dt;
    if (this.y > GH + 40) this.alive = false;
  }
  draw() {
    this.drawEngineSprite(ctx, enemyEngineSprites.scout, 64, 64, 64, 64);
    this.drawShieldSprite(ctx, shieldSprites.scout, 64, 64, 64, 64);
    this.drawBody(ctx, (ctx) => {
      ctx.scale(1, -1);
      ctx.drawImage(enemySprites.scout, -32, -32, 64, 64);
    });
    this.drawHPBar(ctx);
    this.drawShieldBar(ctx);
  }
}

// ─── DRIFTER ─────────────────────────────────────────────────────────────────
class Drifter extends Enemy {
  constructor(x, y, opts) {
    super(x, y, { w: 26, h: 24, hp: 2, score: 150, color: '#aa44ff', accent: '#cc88ff',
                  speed: opts?.speed || 70, shieldHp: 1, shieldFrameCount: 10,
                  engineFrameCount: 10, ...opts });
    this.amplitude = rnd(40, 80);
    this.freq = rnd(1.2, 2.2);
    this.vy = this.speed * 0.7;
  }
  update(dt) {
    this.baseUpdate(dt);
    this.y += this.vy * dt;
    this.x = this.spawnX + Math.sin(this.t * this.freq) * this.amplitude;
    this.x = clamp(this.x, 20, GW - 20);
    if (this.y > GH + 40) this.alive = false;
  }
  draw() {
    this.drawEngineSprite(ctx, enemyEngineSprites.fighter, 64, 64, 64, 64);
    this.drawShieldSprite(ctx, shieldSprites.fighter, 64, 64, 64, 64);
    this.drawBody(ctx, (ctx) => {
      ctx.scale(1, -1);
      ctx.drawImage(enemySprites.fighter, -32, -32, 64, 64);
    });
    this.drawHPBar(ctx);
    this.drawShieldBar(ctx);
  }
}

// ─── GUNNER ──────────────────────────────────────────────────────────────────
class Gunner extends Enemy {
  constructor(x, y, opts) {
    super(x, y, { w: 48, h: 48, hp: 3, score: 200, color: '#ff9900', accent: '#ffcc44',
                  speed: opts?.speed || 65, fireRate: 2.0, shieldHp: 2,
                  shieldFrameCount: 40, engineFrameCount: 12, ...opts });
    this.phase = 'descend';
    this.hoverY = rnd(GH * 0.2, GH * 0.45);
    this.hoverTime = 0;
    this.aimAngle = Math.PI / 2;
    this.burstLeft = 0;
    this.burstTimer = 0;
  }
  update(dt) {
    this.baseUpdate(dt);
    if (this.phase === 'descend') {
      this.y += this.speed * dt;
      if (this.y >= this.hoverY) { this.phase = 'hover'; this.hoverTime = rnd(3, 5); }
    } else if (this.phase === 'hover') {
      this.x += Math.sin(this.t * 1.5) * 60 * dt;
      this.x = clamp(this.x, 30, GW - 30);
      this.hoverTime -= dt;

      // Track player aim
      const targetAngle = Math.atan2(player.y - this.y, player.x - this.x);
      let diff = targetAngle - this.aimAngle;
      if (diff > Math.PI)  diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      this.aimAngle += diff * Math.min(1, 5 * dt);

      // Burst fire
      this.burstTimer = Math.max(0, this.burstTimer - dt);
      if (this.burstLeft > 0 && this.burstTimer <= 0) {
        const spd = 260;
        eBullets.push(new Bullet(
          this.x, this.y,
          Math.cos(this.aimAngle) * spd, Math.sin(this.aimAngle) * spd,
          1, '#ff9900', 4, 8, 'enemy'
        ));
        playSound(sfxLaser);
        this.burstLeft--;
        this.burstTimer = 0.1;
      }
      if (this.fireTimer <= 0 && this.burstLeft === 0) {
        this.burstLeft = 3;
        this.fireTimer = this.fireRate;
      }

      if (this.hoverTime <= 0) this.phase = 'exit';
    } else {
      this.y += this.speed * 1.5 * dt;
      if (this.y > GH + 40) this.alive = false;
    }
  }
  draw() {
    const sz = this.w;
    const rot = this.aimAngle - Math.PI / 2;
    // Engine and body share the same rotation
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(rot);
    ctx.scale(1, -1);
    ctx.drawImage(enemyEngineSprites.frigate, this.engineFrame * 64, 0, 64, 64, -sz / 2, -sz / 2, sz, sz);
    ctx.restore();
    this.drawShieldSprite(ctx, shieldSprites.frigate, 64, 64, sz, sz);
    this.drawBody(ctx, (ctx) => {
      ctx.rotate(rot);
      ctx.scale(1, -1);
      ctx.drawImage(enemySprites.frigate, -sz / 2, -sz / 2, sz, sz);
    });
    this.drawHPBar(ctx);
    this.drawShieldBar(ctx);
  }
}

// ─── KAMIKAZE ────────────────────────────────────────────────────────────────
class Kamikaze extends Enemy {
  constructor(x, y, opts) {
    super(x, y, { w: 36, h: 36, hp: 1, score: 120, color: '#ff2244', accent: '#ff88aa',
                  speed: opts?.speed || 120, drops: 0.05,
                  shieldHp: 1, shieldFrameCount: 14, engineFrameCount: 10, ...opts });
    this.diving = false; this.diveAngle = 0;
  }
  update(dt) {
    this.baseUpdate(dt);
    if (!this.diving) {
      this.y += this.speed * 0.5 * dt;
      if (this.y > GH * 0.3 || this.t > 1.5) {
        this.diving = true;
        this.diveAngle = Math.atan2(player.y - this.y, player.x - this.x);
      }
    } else {
      const targetAngle = Math.atan2(player.y - this.y, player.x - this.x);
      let diff = targetAngle - this.diveAngle;
      // Normalise to [-PI, PI]
      if (diff > Math.PI)  diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      const maxTurn = 0.9 * dt; // radians per second — very limited steering
      this.diveAngle += Math.sign(diff) * Math.min(Math.abs(diff), maxTurn);
      const spd = this.speed * 2;
      this.x += Math.cos(this.diveAngle) * spd * dt;
      this.y += Math.sin(this.diveAngle) * spd * dt;
    }
    if (this.y > GH + 40 || this.x < -40 || this.x > GW + 40) this.alive = false;
  }
  draw() {
    const sz = 40;
    const angle = this.diving ? this.diveAngle - Math.PI / 2 : 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    // Engine effect (flipped so it trails behind)
    ctx.save();
    ctx.scale(1, -1);
    ctx.drawImage(enemyEngineSprites.support, this.engineFrame * 64, 0, 64, 64, -sz / 2, -sz / 2, sz, sz);
    ctx.restore();
    // Base sprite (flipped to face downward)
    if (this.hitFlash > 0) ctx.filter = `brightness(${1 + this.hitFlash * 5})`;
    ctx.scale(1, -1);
    ctx.drawImage(enemySprites.support, -sz / 2, -sz / 2, sz, sz);
    ctx.restore();
    this.drawShieldSprite(ctx, shieldSprites.support, 64, 64, sz, sz);
    this.drawShieldBar(ctx);
  }
}

// ─── TANK ────────────────────────────────────────────────────────────────────
class Tank extends Enemy {
  constructor(x, y, opts) {
    super(x, y, { w: 62, h: 62, hp: 8, score: 350, color: '#33aa66', accent: '#66ddaa',
                  speed: opts?.speed || 40, drops: 0.4, fireRate: 3.0,
                  shieldHp: 5, shieldFrameCount: 10, engineFrameCount: 10, ...opts });
    this.holdY = rnd(60, 140);
    this.tankPhase = 'approach'; // 'approach' | 'hold' | 'rush'
    this.vy = this.speed * 2;
    this.fireTimer = rnd(0.4, 1.2);
    this.weaponPhase = 'idle'; // 'idle' | 'waiting' | 'charging'
    this.weaponFrame = 0;
    this.weaponTimer = 0;
    this.waitTimer = 0;
    this._rocketIdx = 0;
  }
  // Frame index → [rocketSlot, offsetFraction] left-to-right (slots 1-6)
  static get ROCKET_SCHEDULE() {
    return [
      { frame: 4,  slot: 4, ox:  0.08 },
      { frame: 6,  slot: 3, ox: -0.08 },
      { frame: 8,  slot: 5, ox:  0.24 },
      { frame: 10, slot: 2, ox: -0.24 },
      { frame: 12, slot: 6, ox:  0.40 },
      { frame: 14, slot: 1, ox: -0.40 },
    ];
  }
  update(dt) {
    this.baseUpdate(dt);

    if (this.tankPhase === 'approach') {
      this.y += this.vy * dt;
      if (this.y >= this.holdY) {
        this.y = this.holdY;
        this.tankPhase = 'hold';
      }
    } else if (this.tankPhase === 'hold') {
      this.x += Math.sin(this.t * 0.6) * 28 * dt;
      this.x = Math.max(this.w / 2, Math.min(GW - this.w / 2, this.x));
    } else if (this.tankPhase === 'rush') {
      this.y += this.speed * 6 * dt;
    }

    if (this.tankPhase === 'hold') {
      if (this.weaponPhase === 'waiting') {
        this.waitTimer -= dt;
        if (this.waitTimer <= 0) {
          this.weaponPhase = 'charging';
          this.weaponFrame = 1;
          this.weaponTimer = 0;
          this._rocketIdx = 0;
        }
      } else if (this.weaponPhase === 'charging') {
        this.weaponTimer += dt;
        while (this.weaponTimer >= 1 / 12) {
          this.weaponTimer -= 1 / 12;
          this.weaponFrame++;
          const sched = Tank.ROCKET_SCHEDULE;
          if (this._rocketIdx < sched.length && this.weaponFrame >= sched[this._rocketIdx].frame) {
            const { ox } = sched[this._rocketIdx];
            const offsetPx = this.w * ox;
            eBullets.push(new TorpedoBullet(
              this.x + offsetPx, this.y + this.h * 0.35,
              offsetPx * 0.4, 220 + this.vy
            ));
            playSound(sfxTorpedo);
            this._rocketIdx++;
          }
          if (this.weaponFrame >= 16) {
            this.weaponPhase = 'idle';
            this.weaponFrame = 15; // hold last frame
            this.tankPhase = 'rush'; // salvo done — charge forward
            break;
          }
        }
      } else if (this.fireTimer <= 0) {
        this.weaponPhase = 'waiting';
        this.waitTimer = 3;
      }
    }
    if (this.y > GH + 80) this.alive = false;
  }
  draw() {
    const sz = this.w;
    this.drawEngineSprite(ctx, enemyEngineSprites.torpedo, 64, 64, sz, sz);
    this.drawShieldSprite(ctx, shieldSprites.torpedo, 64, 64, sz * 1.2, sz * 1.2);
    this.drawBody(ctx, (ctx) => {
      ctx.scale(1, -1);
      ctx.drawImage(enemySprites.torpedo, -sz / 2, -sz / 2, sz, sz);
      ctx.drawImage(bossWeaponSprites.torpedo, this.weaponFrame * 64, 0, 64, 64, -sz / 2, -sz / 2, sz, sz);
    });
    this.drawHPBar(ctx);
    this.drawShieldBar(ctx);
  }
}

// ─── BOSS ────────────────────────────────────────────────────────────────────
class Boss extends Enemy {
  constructor(lvl, opts) {
    const bossTypes = [
      { hp: 60,  score: 5000,  color: '#ff3355', accent: '#ff8899', w: 80,  h: 80, speed: 50, shieldHp: 30, shieldFrameCount: 10, engineFrameCount: 12 },
      { hp: 100, score: 8000,  color: '#9922ff', accent: '#cc66ff', w: 90,  h: 70, speed: 60, shieldHp: 40 },
      { hp: 140, score: 12000, color: '#ff8800', accent: '#ffcc00', w: 100, h: 80, speed: 70, shieldHp: 50 },
      { hp: 180, score: 18000, color: '#00ccff', accent: '#88eeff', w: 110, h: 85, speed: 80, shieldHp: 60 },
      { hp: 250, score: 30000, color: '#ff2200', accent: '#ff8844', w: 120, h: 90, speed: 90, shieldHp: 80 },
    ];
    const bt = bossTypes[Math.min(lvl, bossTypes.length - 1)];
    super(GW / 2, -bt.h / 2, { ...bt, drops: 1.0, fireRate: 0.8, ...opts });
    this.phase = 'enter'; this.targetY = 100;
    this.t2 = 0; this.shootPhase = 0; this.lvl = lvl;
    this.moveTarget  = { x: GW / 2, y: 100 };
    this.moveTimer   = 0;
    this.dashTimer   = rnd(2, 5);
    this.dashing     = false;
    this.currentSpeed = bt.speed;
    if (lvl === 0) {
      this.beamPhase         = 'idle';
      this.beamCooldown      = 3;
      this.weaponFrame       = 0;
      this.weaponTimer       = 0;
      this.beamActive        = 0;
      this.beamDmgTimer      = 0;
      this._chargeSoundDelay = 0;
      this._chargeAudio      = null;
      this._fireAudio        = null;
      this._fireSoundTimer   = 0;
    }
  }
  update(dt) {
    this.baseUpdate(dt);
    this.t2 += dt;
    if (this.phase === 'enter') {
      this.y += this.speed * dt;
      if (this.y >= this.targetY) { this.y = this.targetY; this.phase = 'fight'; this.t2 = 0; }
    } else {
      // Waypoint movement with occasional dashes
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        if (!this.dashing) {
          this.dashing = true;
          this.moveTarget.x = rnd(this.w / 2 + 20, GW - this.w / 2 - 20);
          this.moveTarget.y = rnd(50, 170);
          this.currentSpeed = this.speed * rnd(2.5, 4.0);
          this.dashTimer = rnd(0.4, 0.9);
        } else {
          this.dashing = false;
          this.currentSpeed = rnd(this.speed * 0.5, this.speed * 1.2);
          this.dashTimer = rnd(2.5, 6.0);
        }
      }
      if (this.moveTimer <= 0 && !this.dashing) {
        this.moveTarget.x = rnd(this.w / 2 + 20, GW - this.w / 2 - 20);
        this.moveTarget.y = rnd(60, 190);
        this.currentSpeed = rnd(this.speed * 0.4, this.speed * 1.3);
        this.moveTimer = rnd(1.0, 2.8);
      }
      this.moveTimer -= dt;
      const dx = this.moveTarget.x - this.x;
      const dy = this.moveTarget.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 4) {
        this.x += (dx / dist) * this.currentSpeed * dt;
        this.y += (dy / dist) * this.currentSpeed * dt;
      }
      if (this.lvl === 0) {
        this.updateBeamAttack(dt);
      } else {
        if (this.fireTimer <= 0) { this.doBossShot(); this.fireTimer = this.fireRate; }
      }
    }
    if (this.y > GH + 100) this.alive = false;
  }
  doBossShot() {
    this.shootPhase = (this.shootPhase + 1) % 4;
    const px = player ? player.x : GW / 2;
    const py = player ? player.y : GH - 80;
    switch (this.shootPhase) {
      case 0:
        for (let i = 0; i < 3; i++) {
          const dx = px - this.x, dy = py - this.y, d = Math.sqrt(dx*dx + dy*dy) || 1;
          eBullets.push(new Bullet(this.x + (i-1)*14, this.y + this.h/2,
            (dx/d)*200, (dy/d)*200, 1, this.accent, 5, 5, 'enemy'));
        }
        break;
      case 1:
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          eBullets.push(new Bullet(this.x, this.y + 10,
            Math.cos(a)*160, Math.sin(a)*160 + 80, 1, this.color, 4, 4, 'enemy'));
        }
        break;
      case 2:
        this.shootAt(px, py, 260, this.accentColor);
        break;
      case 3:
        for (let i = 0; i < 5; i++) {
          const a = (i / 4 - 0.5) * 0.8;
          eBullets.push(new Bullet(this.x, this.y + this.h/2,
            Math.sin(a)*220, Math.abs(Math.cos(a))*220, 1, this.accentColor, 4, 4, 'enemy'));
        }
        break;
    }
  }
  updateBeamAttack(dt) {
    if (this.beamPhase === 'idle') {
      this.beamCooldown -= dt;
      if (this.beamCooldown <= 0) {
        this.beamPhase   = 'charging';
        this.weaponFrame = 0;
        this.weaponTimer = 0;
        this._chargeAudio = new Audio(sfxBossCharge.src);
        this._chargeAudio.currentTime = 1.0;
        this._chargeAudio.volume = Math.min(1, sfxVolume);
        this._chargeAudio.play().catch(() => {});
      }
    } else if (this.beamPhase === 'charging') {
      this.weaponTimer += dt;
      if (this.weaponTimer >= 1 / 15) {
        this.weaponTimer -= 1 / 15;
        this.weaponFrame++;
        if (this.weaponFrame >= 60) {
          this.beamPhase    = 'firing';
          this.beamActive   = 0.85;
          this.beamDmgTimer = 0;
          shake = Math.max(shake, 12);
          if (this._chargeAudio) { this._chargeAudio.pause(); this._chargeAudio = null; }
          this._fireAudio = new Audio(sfxBossFire.src);
          this._fireAudio.volume = Math.min(1, sfxVolume);
          this._fireAudio.play().catch(() => {});
        }
      }
    } else {
      this.beamActive -= dt;
      this.beamDmgTimer = Math.max(0, this.beamDmgTimer - dt);
      if (player && player.alive && this.beamDmgTimer <= 0) {
        if (Math.abs(player.x - this.x) < this.w / 2 + player.w / 2) {
          player.hit();
          this.beamDmgTimer = 0.3;
        }
      }
      if (this.beamActive <= 0) {
        this.beamPhase       = 'idle';
        this.beamCooldown    = rnd(2.5, 4.5);
        this._fireSoundTimer = 0.5;
      }
    }
    if (this._fireSoundTimer > 0) {
      this._fireSoundTimer -= dt;
      if (this._fireSoundTimer <= 0 && this._fireAudio) {
        this._fireAudio.pause();
        this._fireAudio = null;
      }
    }
  }

  drawBeam(ctx) {
    const bx = this.x - this.w / 2;
    const bh = GH - this.y + 20;

    ctx.save();
    ctx.shadowColor = '#cc00ff'; ctx.shadowBlur = 40;

    // Wide outer glow
    const gw = this.w * 2.8;
    const outerGrad = ctx.createLinearGradient(this.x - gw / 2, 0, this.x + gw / 2, 0);
    outerGrad.addColorStop(0,    'rgba(160, 0, 255, 0)');
    outerGrad.addColorStop(0.3,  'rgba(200, 0, 255, 0.25)');
    outerGrad.addColorStop(0.5,  'rgba(220, 80, 255, 0.4)');
    outerGrad.addColorStop(0.7,  'rgba(200, 0, 255, 0.25)');
    outerGrad.addColorStop(1,    'rgba(160, 0, 255, 0)');
    ctx.fillStyle = outerGrad;
    ctx.fillRect(this.x - gw / 2, this.y, gw, bh);

    // Core beam (boss-width)
    const coreGrad = ctx.createLinearGradient(bx, 0, bx + this.w, 0);
    coreGrad.addColorStop(0,    'rgba(180, 0, 255, 0.5)');
    coreGrad.addColorStop(0.25, 'rgba(255, 180, 255, 0.95)');
    coreGrad.addColorStop(0.5,  'rgba(255, 255, 255, 1)');
    coreGrad.addColorStop(0.75, 'rgba(255, 180, 255, 0.95)');
    coreGrad.addColorStop(1,    'rgba(180, 0, 255, 0.5)');
    ctx.fillStyle = coreGrad;
    ctx.fillRect(bx, this.y, this.w, bh);

    ctx.restore();
  }

  draw() {
    if (this.lvl === 0 && this.beamPhase === 'firing') this.drawBeam(ctx);
    if (this.lvl === 0)
      this.drawEngineSprite(ctx, enemyEngineSprites.dreadnought, 128, 128, this.w, this.w);
    if (this.lvl === 0)
      this.drawShieldSprite(ctx, shieldSprites.dreadnought, 128, 128, this.w * 1.4, this.w * 1.4);
    else
      this.drawShieldGlow(ctx);
    this.drawBody(ctx, (ctx) => {
      if (this.lvl === 0) {
        ctx.scale(1, -1);
        ctx.drawImage(enemySprites.dreadnought, -this.w / 2, -this.w / 2, this.w, this.w);
      } else {
        const s = this.w / 2, hs = this.h / 2;
        ctx.shadowColor = this.color; ctx.shadowBlur = 20;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -hs); ctx.lineTo(s, -hs * 0.3); ctx.lineTo(s * 0.8, hs);
        ctx.lineTo(-s * 0.8, hs); ctx.lineTo(-s, -hs * 0.3);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = this.accentColor;
        ctx.beginPath();
        ctx.moveTo(0, -hs * 0.5); ctx.lineTo(s * 0.35, hs * 0.4); ctx.lineTo(-s * 0.35, hs * 0.4);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
        for (const side of [-1, 1]) {
          ctx.fillStyle = this.color;
          ctx.fillRect(side * (s * 0.6) - 4, -8, 8, 16);
        }
      }
    });
    if (this.lvl === 0 && this.beamPhase === 'charging') {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(1, -1);
      ctx.drawImage(bossWeaponSprites.dreadnought,
        this.weaponFrame * 128, 0, 128, 128,
        -this.w / 2, -this.w / 2, this.w, this.w);
      ctx.restore();
      if (this.weaponFrame >= 50) {
        const t = (this.weaponFrame - 50) / 10;
        ctx.save();
        ctx.globalAlpha = t * 0.35 * (0.5 + 0.5 * Math.sin(this.t * 25));
        ctx.fillStyle = '#ff44ff';
        ctx.fillRect(this.x - this.w / 2, this.y, this.w, GH - this.y + 10);
        ctx.restore();
      }
    }

    this.drawHPBar(ctx);
    this.drawShieldBar(ctx);
    ctx.fillStyle = this.color;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`BOSS LV${this.lvl + 1}`, this.x, this.y - this.h / 2 - 22);
    ctx.textAlign = 'left';
  }
}
