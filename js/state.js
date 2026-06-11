'use strict';

// 'menu' | 'playing' | 'levelclear' | 'gameover' | 'victory'
let state = 'menu';
let score = 0, hiScore = 0, lives = 3, levelIdx = 0;
let waveIdx = 0, spawnTimer = 0, waveDelay = 0;
let stateTimer = 0, shake = 0, totalTime = 0;
let combo = 1, comboTimer = 0;
let paused = false;

let player, enemies, pBullets, eBullets, pickups, particles, stars, floaters, asteroids;
let asteroidTimer = 0;

let bgCols  = ['#000520', '#020a20'];
let bgTarget = ['#000520', '#020a20'];
let bgT = 0;
