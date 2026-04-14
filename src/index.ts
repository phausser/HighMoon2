import { randomBetween } from './utils.js';
import { state } from './state.js';
import { resizeCanvas, render } from './render.js';
import { setupInput } from './input.js';

resizeCanvas();
state.nextBlinkAt = performance.now() + randomBetween(600, 1800);
window.addEventListener("resize", resizeCanvas);
setupInput();
requestAnimationFrame(render);
