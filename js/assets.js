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

const asteroidSprites = {
  base:    mkImg('sprites/world/asteroid/Asteroid 01 - Base.png'),
  flame:   mkImg('sprites/world/asteroid/Asteroid - Flame.png'),
  explode: mkImg('sprites/world/asteroid/Asteroid 01 - Explode.png'),
};
