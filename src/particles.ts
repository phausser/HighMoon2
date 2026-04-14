import {
  PARTICLE_COUNT, PARTICLE_MIN_RANGE, PARTICLE_MAX_RANGE,
  PARTICLE_LIFETIME_MS, SHAKE_DURATION_MS,
} from './constants.js';
import { state, canvas, context } from './state.js';
import { randomBetween } from './utils.js';
import { playExplosionSound } from './audio.js';

export function spawnParticles(x: number, y: number, energy: number, colorRGB: string, now: number): void {
  const energyPercent = energy / 100;
  const range = PARTICLE_MIN_RANGE + energyPercent * (PARTICLE_MAX_RANGE - PARTICLE_MIN_RANGE);
  const baseSpeed = range / (PARTICLE_LIFETIME_MS / 1000);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = baseSpeed * (0.4 + Math.random() * 0.6);
    state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, createdAt: now, colorRGB });
  }
  playExplosionSound(energy);
}

export function triggerShake(now: number): void {
  state.shakeUntil = now + SHAKE_DURATION_MS;
}

export function updateParticles(deltaSeconds: number, now: number): void {
  for (const p of state.particles) { p.x += p.vx * deltaSeconds; p.y += p.vy * deltaSeconds; }
  state.particles = state.particles.filter((p) => now - p.createdAt <= PARTICLE_LIFETIME_MS);
}

export function drawParticles(now: number): void {
  for (const p of state.particles) {
    const age = now - p.createdAt;
    const alpha = Math.max(0, 1 - age / PARTICLE_LIFETIME_MS);
    const zx = p.x * state.zoomLevel + (canvas.width * (1 - state.zoomLevel)) / 2;
    const zy = p.y * state.zoomLevel + (canvas.height * (1 - state.zoomLevel)) / 2;
    context.fillStyle = `rgba(${p.colorRGB}, ${alpha})`;
    context.fillRect(zx - 0.5, zy - 0.5, 1.5, 1.5);
  }
}
