import { STAR_COUNT, STAR_ALPHA_LEVELS, STAR_COLOR } from './constants.js';
import type { Star } from './types.js';
import { randomBetween } from './utils.js';
import { state, context } from './state.js';

function pickStarAlpha(): number {
  const roll = Math.random();
  if (roll < 0.4) return STAR_ALPHA_LEVELS[0]!;
  if (roll < 0.72) return STAR_ALPHA_LEVELS[1]!;
  if (roll < 0.92) return STAR_ALPHA_LEVELS[2]!;
  return STAR_ALPHA_LEVELS[3]!;
}

export function createStars(width: number, height: number): Star[] {
  return Array.from({ length: STAR_COUNT }, () => ({
    x: Math.floor(Math.random() * width),
    y: Math.floor(Math.random() * height),
    alpha: pickStarAlpha(),
    size: randomBetween(1, 2),
  }));
}

export function updateBlink(now: number): void {
  if (state.blinkingStarIndex === -1 && now >= state.nextBlinkAt) {
    state.blinkingStarIndex = Math.floor(Math.random() * state.stars.length);
    state.blinkUntil = now + randomBetween(1300, 3200);
  }
  if (state.blinkingStarIndex !== -1 && now >= state.blinkUntil) {
    state.blinkingStarIndex = -1;
    state.nextBlinkAt = now + randomBetween(600, 800);
  }
}

export function drawStars(now: number): void {
  for (let index = 0; index < state.stars.length; index++) {
    const star = state.stars[index]!;
    let alpha = star.alpha;
    if (index === state.blinkingStarIndex) {
      alpha = 0.1 + Math.abs(Math.sin(now * 0.045)) * 0.9;
    }
    context.fillStyle = `rgba(${STAR_COLOR}, ${alpha})`;
    context.fillRect(star.x, star.y, star.size, star.size);
  }
}

