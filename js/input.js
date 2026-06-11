'use strict';

const keys = {}, jp = {};

window.addEventListener('keydown', (e) => {
  if (!keys[e.code]) jp[e.code] = true;
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

function clearJP() {
  for (const k in jp) delete jp[k];
}
