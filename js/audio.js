'use strict';

const sfxLaser           = new Audio('sounds/weapons/laser.mp3');
const sfxExplosion       = new Audio('sounds/explosions/explosion.mp3');
const sfxExplosionLarge  = new Audio('sounds/explosions/explosion_large.mp3');
const sfxBossCharge      = new Audio('sounds/weapons/heavy_laser_charge.mp3');
const sfxBossFire        = new Audio('sounds/weapons/heavy_laser.mp3');
const sfxTorpedo         = new Audio('sounds/weapons/torpedo_fired.wav');
const sfxZapper          = new Audio('sounds/weapons/zapper.mp3');

const bgmMenu = new Audio("sounds/music/Miracle Warriors_ Seal of the Dark Lord (Master System PSG) - BGM 03_ World Map.mp3");
bgmMenu.loop = true;

const bgmLevel1 = new Audio("sounds/music/2020-06-18_-_8_Bit_Retro_Funk_-_www.FesliyanStudios.com_David_Renda.mp3");
bgmLevel1.loop = true;

function stopAllBgm() {
  [bgmMenu, bgmLevel1].forEach(b => { b.pause(); b.currentTime = 0; });
}

function playLevelBgm(bgm) {
  stopAllBgm();
  bgm.volume = musicVolume;
  bgm.play().catch(() => {});
}

let musicVolume = parseFloat(localStorage.getItem('spaceman_vol_music') ?? '1');
let sfxVolume   = parseFloat(localStorage.getItem('spaceman_vol_sfx')   ?? '1');

function playSound(snd) {
  const clone = new Audio(snd.src);
  clone.volume = Math.min(1, sfxVolume);
  clone.play().catch(() => {});
}
