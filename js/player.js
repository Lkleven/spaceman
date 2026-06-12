"use strict";

const WEAPON_DEFS = {
  auto_cannon: {
    sprite: () => shopSprites.autoCannon,
    frameW: 48,
    frameCount: 7,
    fps: 15,
    projSprite: () => playerProjectileSprites.autoCannon,
    projFrameW: 32,
    projFrameH: 32,
    projFrameCount: 4,
    projFps: 14,
    projW: 18,
    projH: 18,
    projDmg: 1,
    // Each entry fires one shot when weaponFrame reaches that value
    shotSchedule: [
      { frame: 1, ox: -7, ang: 0 },
      { frame: 2, ox: 7, ang: 0 },
    ],
  },
  big_space_gun: {
    sprite: () => shopSprites.bigSpaceGun,
    frameW: 48,
    frameCount: 12,
    fps: 15,
    projSprite: () => playerProjectileSprites.bigSpaceGun,
    projFrameW: 32,
    projFrameH: 32,
    projFrameCount: 10,
    projFps: 14,
    projW: 26,
    projH: 26,
    projDmg: 8,
    fireRate: 1.6,
  },
  rockets: {
    sprite: () => shopSprites.rockets,
    frameW: 48,
    frameCount: 17,
    fps: 15,
    projSprite: () => playerProjectileSprites.rockets,
    projFrameW: 32,
    projFrameH: 32,
    projFrameCount: 3,
    projFps: 14,
    projW: 28,
    projH: 44,
    projDmg: 10,
    perPress: true,
    ammo: 6,
    // x offsets in fire order: positions 5,3,1,2,4,6 (left=-22 … right=22)
    shotOffsets: [-4, 4, -13, 13, -22, 22],
  },
  zapper: {
    sprite: () => shopSprites.zapper,
    frameW: 48,
    frameCount: 14,
    fps: 15,
    projSprite: () => playerProjectileSprites.zapper,
    projFrameW: 32,
    projFrameH: 32,
    projFrameCount: 8,
    projFps: 14,
    projW: 22,
    projH: 22,
    projDmg: 1,
    beamMode: true,
    beamFrame: 5,
    beamRate: 0.05,
    maxBeamTime: 3, // seconds before forced shutdown
    cooldownTime: 3, // seconds of cooldown after hitting the cap
  },
};

class Player {
  constructor() {
    this.x = GW / 2;
    this.y = GH - 80;
    this.w = 28;
    this.h = 32;
    this.speed = 230;
    this.hp = 3;
    this.maxHp = 3;
    this.weaponLevel = 0; // used when no weapon equipped
    this.bulletSpeed = 550;
    this.hasShield = false;
    this.fireTimer = 0;
    this.fireRate = 0.5;
    this.iframes = 0;
    this.thrustAnim = 0;
    this.moving = false;
    this.engineFrame = 0;
    this.engineTimer = 0;
    this.alive = true;
    this.equippedWeapon = null;
    this.weaponFrame = 0;
    this.weaponTimer = 0;
    this.weaponFiring = false;
    this._weaponSchedIdx = 0;
    this.rocketAmmo = 0;
    this.beaming = false;
    this.beamTimer = 0;
    this.beamShutdown = false;
    this.beamCharge = 0;
    this.beamCooldown = 0;
    this._beamAudio = null;
  }

  equipWeapon(id) {
    this._stopBeamAudio();
    this.equippedWeapon = id;
    this.weaponFrame = 0;
    this.weaponFiring = false;
    this.weaponTimer = 0;
    this.beaming = false;
    this.beamTimer = 0;
    this.beamShutdown = false;
    this.beamCharge = 0;
    this.beamCooldown = 0;
    const wDef = id ? WEAPON_DEFS[id] : null;
    this.rocketAmmo = wDef?.perPress ? wDef.ammo : 0;
  }

  _stopBeamAudio() {
    if (this._beamAudio) {
      this._beamAudio.pause();
      this._beamAudio = null;
    }
  }

  update(dt) {
    if (!this.alive) return;
    this.iframes = Math.max(0, this.iframes - dt);
    this.fireTimer = Math.max(0, this.fireTimer - dt);
    this.thrustAnim += dt * 8;

    let dx = 0,
      dy = 0;
    if (keys["ArrowLeft"] || keys["KeyA"]) dx = -1;
    if (keys["ArrowRight"] || keys["KeyD"]) dx = 1;
    if (keys["ArrowUp"] || keys["KeyW"]) dy = -1;
    if (keys["ArrowDown"] || keys["KeyS"]) dy = 1;
    if (dx && dy) {
      dx *= 0.707;
      dy *= 0.707;
    }

    this.x = clamp(this.x + dx * this.speed * dt, this.w / 2, GW - this.w / 2);
    this.y = clamp(this.y + dy * this.speed * dt, GH / 2, GH - this.h / 2 - 8);

    const wasMoving = this.moving;
    this.moving = !!(dx || dy);
    if (this.moving !== wasMoving) {
      this.engineFrame = 0;
      this.engineTimer = 0;
    }

    this.engineTimer += dt;
    const engineFps = this.moving ? 12 : 4;
    const engineFrames = this.moving ? 4 : 2;
    if (this.engineTimer >= 1 / engineFps) {
      this.engineTimer -= 1 / engineFps;
      this.engineFrame = (this.engineFrame + 1) % engineFrames;
    }

    // Weapon fire animation — returns to frame 0 when done (or stops at beamFrame)
    if (
      this.equippedWeapon &&
      this.weaponFiring &&
      !WEAPON_DEFS[this.equippedWeapon]?.perPress
    ) {
      const def = WEAPON_DEFS[this.equippedWeapon];
      this.weaponTimer += dt;
      while (this.weaponTimer >= 1 / def.fps) {
        this.weaponTimer -= 1 / def.fps;
        this.weaponFrame++;
        if (def.shotSchedule) this._fireScheduled();
        if (def.beamMode && this.weaponFrame >= def.beamFrame) {
          this.weaponFrame = def.beamFrame;
          this.weaponFiring = false;
          this.beaming = true;
          this.beamTimer = 0;
          this._beamAudio = new Audio(sfxZapper.src);
          this._beamAudio.volume = Math.min(1, sfxVolume);
          this._beamAudio.play().catch(() => {});
          break;
        }
        if (this.weaponFrame >= def.frameCount) {
          this.weaponFrame = 0;
          this.weaponFiring = false;
          break;
        }
      }
    }

    // Beam shutdown animation (frame 6 → last frame → 0)
    if (this.equippedWeapon && this.beamShutdown) {
      const def = WEAPON_DEFS[this.equippedWeapon];
      this.weaponTimer += dt;
      while (this.weaponTimer >= 1 / def.fps) {
        this.weaponTimer -= 1 / def.fps;
        this.weaponFrame++;
        if (this.weaponFrame >= def.frameCount) {
          this.weaponFrame = 0;
          this.beamShutdown = false;
          break;
        }
      }
    }

    const fireHeld = keys["Space"] || keys["KeyZ"];
    const def = this.equippedWeapon ? WEAPON_DEFS[this.equippedWeapon] : null;

    if (def?.beamMode) {
      this.beamCooldown = Math.max(0, this.beamCooldown - dt);
      if (!this.beaming) this.beamCharge = Math.max(0, this.beamCharge - dt);

      const forceStop = () => {
        this.beaming = false;
        this._stopBeamAudio();
        this.beamShutdown = true;
        this.weaponFrame = 6;
        this.weaponTimer = 0;
      };

      if (!fireHeld) {
        if (this.beaming) {
          forceStop();
        } else if (this.weaponFiring) {
          this.weaponFiring = false;
          this.weaponFrame = 0;
          this.weaponTimer = 0;
        }
      } else if (
        !this.weaponFiring &&
        !this.beaming &&
        !this.beamShutdown &&
        this.beamCooldown <= 0
      ) {
        this.weaponFiring = true;
        this.weaponFrame = 1;
        this.weaponTimer = 0;
      } else if (this.beaming) {
        this.beamCharge += dt;
        if (this.beamCharge >= def.maxBeamTime) {
          // Overheated — force shutdown and start cooldown
          forceStop();
          this.beamCooldown = def.cooldownTime;
        } else {
          this.beamTimer -= dt;
          if (this.beamTimer <= 0) {
            this.beamTimer += def.beamRate;
            pBullets.push(
              this._makeShot(this.x - 10, this.y - 20, 0, -this.bulletSpeed),
            );
            pBullets.push(
              this._makeShot(this.x + 10, this.y - 20, 0, -this.bulletSpeed),
            );
          }
        }
      }
    } else if (def?.perPress) {
      if (
        (jp["Space"] || jp["KeyZ"]) &&
        this.rocketAmmo > 0 &&
        !this.weaponFiring
      ) {
        const idx = def.ammo - this.rocketAmmo; // 0–5
        this.weaponFrame = 2 + idx * 2; // 2, 4, 6, 8, 10, 12
        this.weaponTimer = 0;
        this.weaponFiring = true;
        this.rocketAmmo--;
        playSound(sfxLaser);
        const ox = def.shotOffsets ? def.shotOffsets[idx] : 0;
        pBullets.push(
          this._makeShot(this.x + ox, this.y - 30, 0, -this.bulletSpeed),
        );
      }
      if (this.weaponFiring) {
        this.weaponTimer += dt;
        if (this.weaponTimer >= 1 / def.fps) {
          this.weaponFrame++; // advance to post-fire frame (3,5,7,9,11,13)
          this.weaponFiring = false;
          if (this.rocketAmmo === 0) this.weaponFrame = 16;
        }
      }
    } else if (fireHeld && this.fireTimer <= 0) {
      this.shoot();
      this.fireTimer = def?.fireRate ?? this.fireRate;
    }
  }

  _makeShot(x, y, vx, vy) {
    if (this.equippedWeapon) {
      const d = WEAPON_DEFS[this.equippedWeapon];
      return new SpriteBullet(
        x,
        y,
        vx,
        vy,
        d.projSprite(),
        d.projFrameW,
        d.projFrameH,
        d.projFrameCount,
        d.projFps,
        d.projDmg,
        d.projW,
        d.projH,
      );
    }
    return new Bullet(x, y, vx, vy, 1, "#00ffff", 3, 12, "player");
  }

  _fireScheduled() {
    const sched = WEAPON_DEFS[this.equippedWeapon].shotSchedule;
    while (
      this._weaponSchedIdx < sched.length &&
      sched[this._weaponSchedIdx].frame === this.weaponFrame
    ) {
      const s = sched[this._weaponSchedIdx++];
      const rad = (s.ang * Math.PI) / 180;
      playSound(sfxLaser);
      pBullets.push(
        this._makeShot(
          this.x + s.ox,
          this.y - 20,
          Math.sin(rad) * this.bulletSpeed,
          -Math.cos(rad) * this.bulletSpeed,
        ),
      );
    }
  }

  shoot() {
    if (this.equippedWeapon) {
      const def = WEAPON_DEFS[this.equippedWeapon];
      this.weaponFiring = true;
      this.weaponFrame = 1;
      this.weaponTimer = 0;
      this._weaponSchedIdx = 0;
      if (def.shotSchedule) {
        this._fireScheduled(); // frame 1 shots fire immediately; sound plays per shot
        return;
      }
    }
    playSound(sfxLaser);
    const configs = [
      [[0, 0, 0]],
      [
        [-7, 0, 0],
        [7, 0, 0],
      ],
      [
        [-10, 0, 0],
        [0, 0, 0],
        [10, 0, 0],
      ],
      [
        [-12, 0, -60],
        [-5, 0, -20],
        [5, 0, 20],
        [12, 0, 60],
      ],
    ];
    const shots = configs[Math.min(this.weaponLevel, 3)];
    for (const [ox, , ang] of shots) {
      const rad = (ang * Math.PI) / 180;
      pBullets.push(
        this._makeShot(
          this.x + ox,
          this.y - 20,
          Math.sin(rad) * this.bulletSpeed,
          -Math.cos(rad) * this.bulletSpeed,
        ),
      );
    }
  }

  hit() {
    if (this.iframes > 0) return;
    if (this.hasShield) {
      this.hasShield = false;
      shake = Math.max(shake, 4);
      burst(this.x, this.y, ["#4488ff", "#88aaff"], 10, 100, 0.4, 4);
      return;
    }
    this.hp--;
    this.iframes = 1.8;
    shake = Math.max(shake, 8);
    burst(this.x, this.y, ["#ff4444", "#ff8844", "#ffffff"], 14, 130, 0.5, 5);
    if (this.hp <= 0) this.alive = false;
  }

  draw() {
    if (!this.alive) return;
    ctx.save();
    const x = this.x,
      y = this.y;
    const EW = 48,
      EH = 48;
    ctx.drawImage(
      engineSheet,
      this.engineFrame * EW,
      EH,
      EW,
      EH,
      x - EW / 2,
      y - 20,
      EW,
      EH,
    );

    const sw = 64,
      sh = 64;
    const sprite =
      this.hp >= this.maxHp
        ? shipSprites.full
        : this.hp >= 2
          ? shipSprites.slight
          : this.hp >= 1
            ? shipSprites.damaged
            : shipSprites.veryDamaged;
    ctx.drawImage(sprite, x - sw / 2, y - sh / 2, sw, sh);

    // Equipped weapon overlay
    if (this.equippedWeapon) {
      const def = WEAPON_DEFS[this.equippedWeapon];
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        def.sprite(),
        this.weaponFrame * def.frameW,
        0,
        def.frameW,
        48,
        x - sw / 2,
        y - sh / 2,
        sw,
        sh,
      );
    }

    if (this.hasShield) {
      ctx.strokeStyle = "#4488ff";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      ctx.shadowColor = "#4488ff";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}
