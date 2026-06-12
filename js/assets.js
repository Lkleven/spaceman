'use strict';

function mkImg(src) {
  const i = new Image();
  i.src = src;
  return i;
}


const shipSprites = {
  full:        mkImg('sprites/player/ship/Main Ship - Base - Full health.png'),
  slight:      mkImg('sprites/player/ship/Main Ship - Base - Slight damage.png'),
  damaged:     mkImg('sprites/player/ship/Main Ship - Base - Damaged.png'),
  veryDamaged: mkImg('sprites/player/ship/Main Ship - Base - Very damaged.png'),
};

// 192×96 sheet — 4 frames × 2 rows at 48×48; row 0 = idle, row 1 = thrust
const engineSheet = mkImg(
  'sprites/player/engine_effects/Main Ship - Engines - Base Engine - Spritesheet.png'
);

const enemySprites = {
  scout:       mkImg("sprites/enemies/Kla'ed/Base/Kla'ed - Scout - Base.png"),
  fighter:     mkImg("sprites/enemies/Kla'ed/Base/Kla'ed - Fighter - Base.png"),
  dreadnought: mkImg("sprites/enemies/Kla'ed/Base/Kla'ed - Dreadnought - Base.png"),
  support:     mkImg("sprites/enemies/Kla'ed/Base/Kla'ed - Support ship - Base.png"),
  torpedo:     mkImg("sprites/enemies/Kla'ed/Base/Kla'ed - Torpedo Ship - Base.png"),
  frigate:     mkImg("sprites/enemies/Kla'ed/Base/Kla'ed - Frigate - Base.png"),
};

const shieldSprites = {
  scout:       mkImg("sprites/enemies/Kla'ed/Shield/Kla'ed - Scout - Shield.png"),
  fighter:     mkImg("sprites/enemies/Kla'ed/Shield/Kla'ed - Fighter - Shield.png"),
  dreadnought: mkImg("sprites/enemies/Kla'ed/Shield/Kla'ed - Dreadnought - Shield.png"),
  support:     mkImg("sprites/enemies/Kla'ed/Shield/Kla'ed - Scout - Shield.png"),
  torpedo:     mkImg("sprites/enemies/Kla'ed/Shield/Kla'ed - Torpedo Ship - Shield.png"),
  frigate:     mkImg("sprites/enemies/Kla'ed/Shield/Kla'ed - Frigate - Shield.png"),
};

const enemyEngineSprites = {
  scout:       mkImg("sprites/enemies/Kla'ed/Engine/Kla'ed - Scout - Engine.png"),
  fighter:     mkImg("sprites/enemies/Kla'ed/Engine/Kla'ed - Fighter - Engine.png"),
  dreadnought: mkImg("sprites/enemies/Kla'ed/Engine/Kla'ed - Dreadnought - Engine.png"),
  support:     mkImg("sprites/enemies/Kla'ed/Engine/Kla'ed - Support ship - Engine.png"),
  torpedo:     mkImg("sprites/enemies/Kla'ed/Engine/Kla'ed - Torpedo Ship - Engine.png"),
  frigate:     mkImg("sprites/enemies/Kla'ed/Engine/Kla'ed - Frigate - Engine.png"),
};

const bossWeaponSprites = {
  dreadnought: mkImg("sprites/enemies/Kla'ed/Weapons/Kla'ed - Dreadnought - Weapons.png"),
  torpedo:     mkImg("sprites/enemies/Kla'ed/Weapons/Kla'ed - Torpedo Ship - Weapons.png"),
};

const torpedoProjectileSprite = mkImg("sprites/enemies/Kla'ed/Projectiles/Kla'ed - Torpedo.png");

const playerProjectileSprites = {
  autoCannon:  mkImg('sprites/player/projectiles/Main ship weapon - Projectile - Auto cannon bullet.png'),
  bigSpaceGun: mkImg('sprites/player/projectiles/Main ship weapon - Projectile - Big Space Gun.png'),
  rockets:     mkImg('sprites/player/projectiles/Main ship weapon - Projectile - Rocket.png'),
  zapper:      mkImg('sprites/player/projectiles/Main ship weapon - Projectile - Zapper.png'),
};

const shopSprites = {
  autoCannon:   mkImg('sprites/player/weapons/Main Ship - Weapons - Auto Cannon.png'),
  bigSpaceGun:  mkImg('sprites/player/weapons/Main Ship - Weapons - Big Space Gun.png'),
  rockets:      mkImg('sprites/player/weapons/Main Ship - Weapons - Rockets.png'),
  zapper:       mkImg('sprites/player/weapons/Main Ship - Weapons - Zapper.png'),
  frontShield:  mkImg('sprites/player/shield/Main Ship - Shields - Front Shield.png'),
  bigPulse:     mkImg('sprites/player/engine/Main Ship - Engines - Big Pulse Engine.png'),
  burstEngine:  mkImg('sprites/player/engine/Main Ship - Engines - Burst Engine.png'),
  supercharged: mkImg('sprites/player/engine/Main Ship - Engines - Supercharged Engine.png'),
};

const bgSprites = {
  starfield:   mkImg('img/background/Starfield_06-1024x1024.png'),
  starsSmall:  mkImg('img/background/transparent/Stars Small_1.png'),
  starsBig:    mkImg('img/background/transparent/Stars-Big_1_1_PC.png'),
  starsSmall2: mkImg('img/background/transparent/Stars Small_2.png'),
  starsBig2:   mkImg('img/background/transparent/Stars-Big_1_2_PC.png'),
  nebula:      mkImg('img/background/Nebula Aqua-Pink.png'),
};

const asteroidSprites = {
  base:    mkImg('sprites/world/asteroid/Asteroid 01 - Base.png'),
  flame:   mkImg('sprites/world/asteroid/Asteroid - Flame.png'),
  explode: mkImg('sprites/world/asteroid/Asteroid 01 - Explode.png'),
};
