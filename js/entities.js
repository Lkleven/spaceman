'use strict';

// ─── PARALLAX STARS ──────────────────────────────────────────────────────────
class Star {
  constructor() { this.reset(true); }
  reset(initial) {
    this.x = rnd(0, GW);
    this.y = initial ? rnd(0, GH) : -2;
    this.speed = rnd(40, 160);
    this.r = rnd(0.5, 2.0);
    this.bright = rnd(80, 255) | 0;
  }
  update(dt) {
    this.y += this.speed * dt;
    if (this.y > GH + 4) this.reset(false);
  }
  draw() {
    ctx.fillStyle = `rgb(${this.bright},${this.bright},${Math.min(255, this.bright + 40)})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── PARTICLES ───────────────────────────────────────────────────────────────
class Particle {
  constructor(x, y, vx, vy, life, color, size) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.life = life; this.maxLife = life;
    this.color = color; this.size = size;
    this.alive = true;
  }
  update(dt) {
    this.life -= dt;
    if (this.life <= 0) { this.alive = false; return; }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 30 * dt; // slight gravity
    this.vx *= 0.97;
  }
  draw() {
    const a = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * a, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function burst(x, y, colors, n, speed, life, size) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = rnd(speed * 0.4, speed);
    particles.push(new Particle(
      x, y,
      Math.cos(a) * s, Math.sin(a) * s,
      rnd(life * 0.5, life),
      colors[rndInt(0, colors.length - 1)],
      rnd(size * 0.5, size)
    ));
  }
}

// ─── FLOATING SCORE TEXT ─────────────────────────────────────────────────────
class Floater {
  constructor(x, y, text, color) {
    this.x = x; this.y = y;
    this.text = text; this.color = color;
    this.life = 1.1; this.alive = true;
  }
  update(dt) {
    this.life -= dt;
    this.y -= 30 * dt;
    if (this.life <= 0) this.alive = false;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.life * 2);
    ctx.fillStyle = this.color;
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.textAlign = 'left';
    ctx.restore();
  }
}

// ─── BULLET ──────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, vx, vy, dmg, color, w, h, owner) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.dmg = dmg; this.color = color;
    this.w = w || 3; this.h = h || 10;
    this.owner = owner; this.alive = true;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.y < -20 || this.y > GH + 20 || this.x < -20 || this.x > GW + 20)
      this.alive = false;
  }
  draw() {
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
    ctx.restore();
  }
}

// ─── SPRITE BULLET (player weapon projectiles) ───────────────────────────────
class SpriteBullet {
  constructor(x, y, vx, vy, sheet, frameW, frameH, frameCount, fps, dmg, dispW, dispH) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.sheet = sheet;
    this.frameW = frameW; this.frameH = frameH;
    this.frameCount = frameCount; this.fps = fps;
    this.dmg = dmg;
    this.w = dispW; this.h = dispH;
    this.owner = 'player'; this.alive = true;
    this.frame = 0; this.timer = 0;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.timer += dt;
    if (this.timer >= 1 / this.fps) { this.timer -= 1 / this.fps; this.frame = (this.frame + 1) % this.frameCount; }
    if (this.y < -40 || this.y > GH + 40 || this.x < -40 || this.x > GW + 40) this.alive = false;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.atan2(this.vx, -this.vy)); // 0 = pointing up
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.sheet, this.frame * this.frameW, 0, this.frameW, this.frameH,
                  -this.w / 2, -this.h / 2, this.w, this.h);
    ctx.restore();
  }
}

// ─── TORPEDO BULLET ──────────────────────────────────────────────────────────
class TorpedoBullet {
  constructor(x, y, vx, vy) {
    this.x = x; this.y = y;
    this.speed = Math.sqrt(vx * vx + vy * vy);
    this.angle = Math.atan2(vy, vx);
    this.dmg = 2;
    this.w = 11; this.h = 24;
    this.owner = 'enemy';
    this.alive = true;
    this.frame = 0;
    this.frameTimer = 0;
  }
  update(dt) {
    // Steer toward player with limited turn radius
    const targetAngle = Math.atan2(player.y - this.y, player.x - this.x);
    let diff = targetAngle - this.angle;
    if (diff > Math.PI)  diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    this.angle += Math.sign(diff) * Math.min(Math.abs(diff), 0.7 * dt);

    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;

    this.frameTimer += dt;
    if (this.frameTimer >= 1 / 8) {
      this.frameTimer -= 1 / 8;
      this.frame = (this.frame + 1) % 3;
    }
    if (this.y < -40 || this.y > GH + 40 || this.x < -40 || this.x > GW + 40)
      this.alive = false;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + Math.PI / 2);
    ctx.scale(1, -1);
    ctx.drawImage(torpedoProjectileSprite, this.frame * 11, 0, 11, 32, -6, -16, 11, 32);
    ctx.restore();
  }
}

// ─── ASTEROID ────────────────────────────────────────────────────────────────
class Asteroid {
  constructor() {
    const edge = rndInt(0, 3);
    const speed = rnd(120, 220);
    let x, y, vx, vy;
    if (edge === 0) {
      x = rnd(0, GW); y = -50;
      vx = rnd(-60, 60); vy = rnd(0.7, 1) * speed;
    } else if (edge === 1) {
      x = GW + 50; y = rnd(0, GH);
      vx = -rnd(0.7, 1) * speed; vy = rnd(-60, 60);
    } else if (edge === 2) {
      x = rnd(0, GW); y = GH + 50;
      vx = rnd(-60, 60); vy = -rnd(0.7, 1) * speed;
    } else {
      x = -50; y = rnd(0, GH);
      vx = rnd(0.7, 1) * speed; vy = rnd(-60, 60);
    }
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.size = rnd(36, 56);
    this.w = this.size * 0.65; this.h = this.size * 0.65;
    this.angle = Math.random() * Math.PI * 2;
    this.rotSpeed = rnd(-2, 2);
    this.alive = true;
    this.phase = 'moving';
    this.flameFrame = 0; this.flameTimer = 0;
    this.explodeFrame = 0; this.explodeTimer = 0;
  }

  update(dt) {
    if (this.phase === 'exploding') {
      this.explodeTimer += dt;
      if (this.explodeTimer >= 1 / 12) {
        this.explodeTimer -= 1 / 12;
        this.explodeFrame++;
        if (this.explodeFrame >= 8) this.alive = false;
      }
      return;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.angle += this.rotSpeed * dt;
    this.flameTimer += dt;
    if (this.flameTimer >= 1 / 8) {
      this.flameTimer -= 1 / 8;
      this.flameFrame = (this.flameFrame + 1) % 3;
    }
    if (this.x < -120 || this.x > GW + 120 || this.y < -120 || this.y > GH + 120)
      this.alive = false;
  }

  explode() {
    this.phase = 'exploding';
    this.explodeFrame = 0;
    this.explodeTimer = 0;
    playSound(sfxExplosion);
    addScore(80);
    floaters.push(new Floater(this.x, this.y - 10, '+80', '#ffaa44'));
  }

  draw() {
    const s = this.size;
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.phase === 'exploding') {
      ctx.drawImage(asteroidSprites.explode, this.explodeFrame * 96, 0, 96, 96, -s/2, -s/2, s, s);
      ctx.restore();
      return;
    }

    // Flame at trailing end, pointing away from travel direction
    const trailAngle = Math.atan2(-this.vy, -this.vx);
    ctx.save();
    const fs = s * 0.75;
    ctx.translate(Math.cos(trailAngle) * s * 0.1, Math.sin(trailAngle) * s * 0.1);
    ctx.rotate(trailAngle);
    ctx.drawImage(asteroidSprites.flame, this.flameFrame * 96, 0, 96, 96, -fs/2, -fs/2, fs, fs);
    ctx.restore();

    // Base with spin
    ctx.rotate(this.angle);
    ctx.drawImage(asteroidSprites.base, 0, 0, 96, 96, -s/2, -s/2, s, s);
    ctx.restore();
  }
}

// ─── PICKUP ──────────────────────────────────────────────────────────────────
class Pickup {
  constructor(x, y, type) {
    this.x = x; this.y = y;
    this.type = type; this.vy = 60;
    this.alive = true; this.t = 0;
    this.colors = { weapon: '#00ffcc', shield: '#4488ff', bomb: '#ff4400', life: '#ff44aa' };
    this.labels = { weapon: 'W', shield: 'S', bomb: 'B', life: '♥' };
  }
  update(dt) {
    this.y += this.vy * dt;
    this.t += dt;
    if (this.y > GH + 20) this.alive = false;
  }
  draw() {
    const col = this.colors[this.type];
    const bob = Math.sin(this.t * 4) * 3;
    ctx.save();
    ctx.shadowColor = col; ctx.shadowBlur = 12;
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    const s = 11;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + bob - s);
    ctx.lineTo(this.x + s, this.y + bob);
    ctx.lineTo(this.x, this.y + bob + s);
    ctx.lineTo(this.x - s, this.y + bob);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.labels[this.type], this.x, this.y + bob + 4);
    ctx.textAlign = 'left';
    ctx.restore();
  }
}
