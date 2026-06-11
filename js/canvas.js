'use strict';

const GW = 480, GH = 720;
const canvas = document.getElementById('c');
canvas.width = GW;
canvas.height = GH;
const ctx = canvas.getContext('2d');

function resize() {
  const s = Math.min(window.innerWidth / GW, window.innerHeight / GH);
  canvas.style.width  = Math.floor(GW * s) + 'px';
  canvas.style.height = Math.floor(GH * s) + 'px';
}
resize();
window.addEventListener('resize', resize);
