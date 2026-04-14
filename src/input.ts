import { SHIP_MAX_ENERGY } from './constants.js';
import { state } from './state.js';
import { spawnProjectile } from './ship.js';
import { startMusic } from './audio.js';

function setInputByKey(key: string, isPressed: boolean): void {
  switch (key) {
    case "ArrowLeft":  state.input.left  = isPressed; break;
    case "ArrowRight": state.input.right = isPressed; break;
    case "ArrowUp":    state.input.up    = isPressed; break;
    case "ArrowDown":  state.input.down  = isPressed; break;
    default: break;
  }
}

export function setupInput(): void {
  window.addEventListener("keydown", (event) => {
    if (event.key.startsWith("Arrow") || event.code === "Space") {
      event.preventDefault();
    }

    if (event.code === "Space" && !event.repeat) {
      if (!state.gameActive) {
        state.gameActive = true;
        state.ship.energy = SHIP_MAX_ENERGY;
        state.score = 0;
        state.enemyShotCount = 0;
        state.projectiles = [];
        state.enemyProjectiles = [];
        startMusic();
      } else {
        spawnProjectile(performance.now());
      }
    }

    setInputByKey(event.key, true);
  });

  window.addEventListener("keyup", (event) => {
    if (event.key.startsWith("Arrow") || event.code === "Space") {
      event.preventDefault();
    }
    setInputByKey(event.key, false);
  });
}

