import {
  CIRCLE_COUNT, MIN_CIRCLE_RADIUS, MAX_CIRCLE_RADIUS, MIN_CIRCLE_GAP,
  MAX_ATTEMPTS_PER_CIRCLE, ASTEROID_GRAY_MIN, ASTEROID_GRAY_MAX, ASTEROID_DENSITY,
} from './constants.js';
import type { Circle } from './types.js';
import { randomBetween } from './utils.js';
import { state, canvas, context } from './state.js';

export function calculateAsteroidMass(radius: number): number {
  return ASTEROID_DENSITY * ((4 / 3) * Math.PI * radius * radius * radius);
}

export function createCircles(width: number, height: number): Circle[] {
  const minX = width / 4, maxX = (width * 3) / 4;
  const minY = height / 4, maxY = (height * 3) / 4;
  const result: Circle[] = [];
  let minGap = MIN_CIRCLE_GAP;
  for (let i = 0; i < CIRCLE_COUNT; i++) {
    let selected: Circle | null = null;
    let bestCandidate: Circle | null = null;
    let bestGap = -Infinity;
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_CIRCLE; attempt++) {
      const candidate: Circle = {
        x: randomBetween(minX, maxX), y: randomBetween(minY, maxY),
        radius: randomBetween(MIN_CIRCLE_RADIUS, MAX_CIRCLE_RADIUS), mass: 0,
        grayShade: Math.floor(randomBetween(ASTEROID_GRAY_MIN, ASTEROID_GRAY_MAX)),
      };
      candidate.mass = calculateAsteroidMass(candidate.radius);
      let smallestEdgeGap = Infinity;
      for (const existing of result) {
        const edgeGap = Math.hypot(candidate.x - existing.x, candidate.y - existing.y) - (candidate.radius + existing.radius);
        smallestEdgeGap = Math.min(smallestEdgeGap, edgeGap);
      }
      if (result.length === 0 || smallestEdgeGap >= minGap) { selected = candidate; break; }
      if (smallestEdgeGap > bestGap) { bestGap = smallestEdgeGap; bestCandidate = candidate; }
    }
    if (!selected) {
      minGap = Math.max(6, minGap * 0.85);
      selected = bestCandidate ?? {
        x: randomBetween(minX, maxX), y: randomBetween(minY, maxY),
        radius: randomBetween(MIN_CIRCLE_RADIUS, MAX_CIRCLE_RADIUS), mass: 0,
        grayShade: Math.floor(randomBetween(ASTEROID_GRAY_MIN, ASTEROID_GRAY_MAX)),
      };
      if (selected.mass === 0) selected.mass = calculateAsteroidMass(selected.radius);
    }
    result.push(selected);
  }
  return result;
}

export function drawCenterCircles(): void {
  for (const circle of state.circles) {
    const g = circle.grayShade;
    context.fillStyle = `rgb(${g}, ${g}, ${g})`;
    context.beginPath();
    context.arc(
      circle.x * state.zoomLevel + (canvas.width * (1 - state.zoomLevel)) / 2,
      circle.y * state.zoomLevel + (canvas.height * (1 - state.zoomLevel)) / 2,
      circle.radius * state.zoomLevel, 0, Math.PI * 2,
    );
    context.fill();
  }
}
