import {
  ENEMY_MARGIN_LEFT, ENEMY_MAX_ENERGY, ENEMY_FIRE_INTERVAL_MS,
  ENEMY_AIM_SPREAD_RAD, ENEMY_STAY_MIN_MS, ENEMY_STAY_MAX_MS,
  ENEMY_MOVE_MIN_PX, ENEMY_MOVE_MAX_PX, ENEMY_ENTRY_SPEED, ENEMY_RESPAWN_DELAY_MS,
  ENEMY_PROJECTILE_HOMING_ACCELERATION, ENEMY_STILL_THRESHOLD_MS,
  ENEMY_STILL_AIM_SPREAD_RAD, ENEMY_STILL_SIM_STEP,
  ENEMY_STILL_SIM_ANGLE_OFFSETS, ENEMY_STILL_SIM_Y_OFFSETS,
  PROJECTILE_SPEED, PROJECTILE_RADIUS, PROJECTILE_MAX_LIFETIME_MS,
  PROJECTILE_SHIP_COLLISION_GRACE_MS, PROJECTILE_GRAVITY_CONSTANT,
  PROJECTILE_GRAVITY_MIN_DISTANCE, PROJECTILE_MAX_GRAVITY_ACCELERATION,
} from './constants.js';
import type { Projectile } from './types.js';
import { state, canvas, context } from './state.js';
import { clamp, randomBetween } from './utils.js';
import { playShootSound } from './audio.js';
import { isProjectileCollidingWithAsteroid, isProjectileCollidingWithTarget, calculateProjectileEnergy } from './physics.js';
import { spawnParticles, triggerShake } from './particles.js';
import { drawEnergyBar } from './ship.js';

export function initializeEnemyShip(width: number, height: number): void {
  if (state.enemyShip.x === 0 && state.enemyShip.y === 0) {
    state.enemyShip.x = ENEMY_MARGIN_LEFT; state.enemyShip.y = height / 2;
  }
  const h = state.enemyShip.length / 2;
  state.enemyShip.x = clamp(state.enemyShip.x, h, width - h);
  state.enemyShip.y = clamp(state.enemyShip.y, h, height - h);
  state.enemyShip.targetY = state.enemyShip.y;
}

export function respawnEnemyShip(now: number): void {
  state.enemyShip.x = -state.enemyShip.length * 2;
  state.enemyShip.y = randomBetween(state.enemyShip.length / 2, canvas.height - state.enemyShip.length / 2);
  state.enemyShip.angle = 0; state.enemyShip.energy = ENEMY_MAX_ENERGY;
  state.enemyShip.active = true; state.enemyShip.entering = true;
  state.enemyShip.lastFiredAt = now; state.enemyShip.nextMoveAt = -1;
  state.enemyShip.targetY = state.enemyShip.y; state.enemyShip.respawnAt = -1;
  state.enemyShotCount = 0;
}

function simulateHitsPlayer(startX: number, startY: number, angle: number): boolean {
  let x = startX + Math.cos(angle) * (state.enemyShip.length / 2);
  let y = startY + Math.sin(angle) * (state.enemyShip.length / 2);
  let vx = Math.cos(angle) * PROJECTILE_SPEED, vy = Math.sin(angle) * PROJECTILE_SPEED;
  const maxSteps = Math.ceil((PROJECTILE_MAX_LIFETIME_MS / 1000) / ENEMY_STILL_SIM_STEP);
  const scr = Math.max(state.ship.length, state.ship.width) / 2;
  for (let step = 0; step < maxSteps; step++) {
    if (state.circles.some((c) => isProjectileCollidingWithAsteroid(x, y, c))) return false;
    if (isProjectileCollidingWithTarget(x, y, state.ship.x, state.ship.y, scr)) return true;
    let ax = 0, ay = 0;
    for (const circle of state.circles) {
      const dx = circle.x - x, dy = circle.y - y;
      const dSq = dx*dx + dy*dy, minD = Math.max(PROJECTILE_GRAVITY_MIN_DISTANCE, circle.radius * 0.35);
      const cdSq = Math.max(dSq, minD*minD), d = Math.sqrt(cdSq);
      const mag = Math.min((PROJECTILE_GRAVITY_CONSTANT * circle.mass) / cdSq, PROJECTILE_MAX_GRAVITY_ACCELERATION);
      ax += (dx/d)*mag; ay += (dy/d)*mag;
    }
    const hdx = state.ship.x - x, hdy = state.ship.y - y, hdist = Math.hypot(hdx, hdy);
    if (hdist > 0) { ax += (hdx/hdist)*ENEMY_PROJECTILE_HOMING_ACCELERATION; ay += (hdy/hdist)*ENEMY_PROJECTILE_HOMING_ACCELERATION; }
    vx += ax*ENEMY_STILL_SIM_STEP; vy += ay*ENEMY_STILL_SIM_STEP;
    x += vx*ENEMY_STILL_SIM_STEP; y += vy*ENEMY_STILL_SIM_STEP;
  }
  return false;
}

function findEnemyAimAngle(now: number): number {
  const base = Math.atan2(state.ship.y - state.enemyShip.y, state.ship.x - state.enemyShip.x);
  if (now - state.playerLastMovedAt < ENEMY_STILL_THRESHOLD_MS)
    return base + (Math.random() - 0.5) * 2 * ENEMY_AIM_SPREAD_RAD;
  for (const off of ENEMY_STILL_SIM_ANGLE_OFFSETS)
    if (simulateHitsPlayer(state.enemyShip.x, state.enemyShip.y, base + off))
      return base + off + (Math.random() - 0.5) * 2 * ENEMY_STILL_AIM_SPREAD_RAD;
  const h = state.enemyShip.length / 2;
  for (const yOff of ENEMY_STILL_SIM_Y_OFFSETS) {
    if (yOff === 0) continue;
    const testY = clamp(state.enemyShip.y + yOff, h, canvas.height - h);
    const testAngle = Math.atan2(state.ship.y - testY, state.ship.x - state.enemyShip.x);
    let found = false;
    for (const aOff of ENEMY_STILL_SIM_ANGLE_OFFSETS)
      if (simulateHitsPlayer(state.enemyShip.x, testY, testAngle + aOff)) { found = true; break; }
    if (found) { state.enemyShip.targetY = testY; state.enemyShip.nextMoveAt = now + ENEMY_STAY_MAX_MS; break; }
  }
  return base + (Math.random() - 0.5) * 2 * ENEMY_STILL_AIM_SPREAD_RAD;
}

export function spawnEnemyProjectile(now: number): void {
  const angle = findEnemyAimAngle(now);
  const dx = Math.cos(angle), dy = Math.sin(angle), nose = state.enemyShip.length / 2;
  state.enemyProjectiles.push({
    x: state.enemyShip.x + dx*nose, y: state.enemyShip.y + dy*nose,
    vx: dx*PROJECTILE_SPEED, vy: dy*PROJECTILE_SPEED,
    createdAt: now, canHitShipAfter: now + PROJECTILE_SHIP_COLLISION_GRACE_MS,
  });
  playShootSound(420);
}

export function updateEnemyShip(deltaSeconds: number, now: number): void {
  if (!state.gameActive) return;
  if (!state.enemyShip.active) {
    if (state.enemyShip.respawnAt >= 0 && now >= state.enemyShip.respawnAt) respawnEnemyShip(now);
    return;
  }
  if (state.enemyShip.entering) {
    state.enemyShip.x += ENEMY_ENTRY_SPEED * deltaSeconds;
    state.enemyShip.angle = 0;
    if (state.enemyShip.x >= ENEMY_MARGIN_LEFT) {
      state.enemyShip.x = ENEMY_MARGIN_LEFT; state.enemyShip.entering = false;
      state.enemyShip.nextMoveAt = now + randomBetween(ENEMY_STAY_MIN_MS, ENEMY_STAY_MAX_MS);
    }
    return;
  }
  if (state.enemyShip.nextMoveAt < 0)
    state.enemyShip.nextMoveAt = now + randomBetween(ENEMY_STAY_MIN_MS, ENEMY_STAY_MAX_MS);
  if (now >= state.enemyShip.nextMoveAt) {
    const dir = Math.random() < 0.5 ? -1 : 1;
    const h = state.enemyShip.length / 2;
    state.enemyShip.targetY = clamp(state.enemyShip.y + dir * randomBetween(ENEMY_MOVE_MIN_PX, ENEMY_MOVE_MAX_PX), h, canvas.height - h);
    state.enemyShip.nextMoveAt = now + randomBetween(ENEMY_STAY_MIN_MS, ENEMY_STAY_MAX_MS);
  }
  const dy = state.enemyShip.targetY - state.enemyShip.y;
  if (Math.abs(dy) > 2) {
    state.enemyShip.y += Math.sign(dy) * state.enemyShip.speedY * deltaSeconds;
    const h = state.enemyShip.length / 2;
    state.enemyShip.y = clamp(state.enemyShip.y, h, canvas.height - h);
  }
  state.enemyShip.angle = Math.atan2(state.ship.y - state.enemyShip.y, state.ship.x - state.enemyShip.x);
  if (now - state.enemyShip.lastFiredAt >= ENEMY_FIRE_INTERVAL_MS) {
    spawnEnemyProjectile(now); state.enemyShip.lastFiredAt = now;
  }
}

export function drawEnemyShip(): void {
  if (!state.enemyShip.active) return;
  const zx = state.enemyShip.x * state.zoomLevel + (canvas.width * (1 - state.zoomLevel)) / 2;
  const zy = state.enemyShip.y * state.zoomLevel + (canvas.height * (1 - state.zoomLevel)) / 2;
  const zl = state.enemyShip.length * state.zoomLevel, zw = state.enemyShip.width * state.zoomLevel;
  context.save();
  context.translate(zx, zy); context.rotate(state.enemyShip.angle);
  context.fillStyle = '#ff4444';
  context.beginPath();
  context.moveTo(zl/2, 0); context.lineTo(-zl/2, -zw/2); context.lineTo(-zl/2, zw/2);
  context.closePath(); context.fill();
  context.restore();
  drawEnergyBar(zx, zy, state.enemyShip.energy, ENEMY_MAX_ENERGY);
}

export function updateEnemyProjectiles(deltaSeconds: number, now: number): void {
  const surviving: Projectile[] = [];
  const scr = Math.max(state.ship.length, state.ship.width) / 2;
  for (const p of state.enemyProjectiles) {
    if (state.circles.some((c) => isProjectileCollidingWithAsteroid(p.x, p.y, c))) {
      spawnParticles(p.x, p.y, calculateProjectileEnergy(p, now), '255, 68, 68', now); continue;
    }
    if (now >= p.canHitShipAfter && isProjectileCollidingWithTarget(p.x, p.y, state.ship.x, state.ship.y, scr)) {
      const e = calculateProjectileEnergy(p, now);
      state.ship.energy = Math.max(0, state.ship.energy - e);
      spawnParticles(p.x, p.y, e, '255, 68, 68', now); triggerShake(now); continue;
    }
    let ax = 0, ay = 0;
    for (const circle of state.circles) {
      const dx = circle.x - p.x, dy = circle.y - p.y;
      const dSq = dx*dx + dy*dy, minD = Math.max(PROJECTILE_GRAVITY_MIN_DISTANCE, circle.radius * 0.35);
      const cdSq = Math.max(dSq, minD*minD), d = Math.sqrt(cdSq);
      const mag = Math.min((PROJECTILE_GRAVITY_CONSTANT * circle.mass) / cdSq, PROJECTILE_MAX_GRAVITY_ACCELERATION);
      ax += (dx/d)*mag; ay += (dy/d)*mag;
    }
    const hdx = state.ship.x - p.x, hdy = state.ship.y - p.y, hdist = Math.hypot(hdx, hdy);
    if (hdist > 0) { ax += (hdx/hdist)*ENEMY_PROJECTILE_HOMING_ACCELERATION; ay += (hdy/hdist)*ENEMY_PROJECTILE_HOMING_ACCELERATION; }
    p.vx += ax*deltaSeconds; p.vy += ay*deltaSeconds;
    p.x += p.vx*deltaSeconds; p.y += p.vy*deltaSeconds;
    if (state.circles.some((c) => isProjectileCollidingWithAsteroid(p.x, p.y, c))) {
      spawnParticles(p.x, p.y, calculateProjectileEnergy(p, now), '255, 68, 68', now); continue;
    }
    if (now >= p.canHitShipAfter && isProjectileCollidingWithTarget(p.x, p.y, state.ship.x, state.ship.y, scr)) {
      const e = calculateProjectileEnergy(p, now);
      state.ship.energy = Math.max(0, state.ship.energy - e);
      spawnParticles(p.x, p.y, e, '255, 68, 68', now); triggerShake(now); continue;
    }
    surviving.push(p);
  }
  state.enemyProjectiles = surviving.filter((p) => now - p.createdAt <= PROJECTILE_MAX_LIFETIME_MS);
}

export function drawEnemyProjectiles(now: number): void {
  for (const p of state.enemyProjectiles) {
    const alpha = Math.max(0, 1 - (now - p.createdAt) / PROJECTILE_MAX_LIFETIME_MS);
    const zx = p.x * state.zoomLevel + (canvas.width * (1 - state.zoomLevel)) / 2;
    const zy = p.y * state.zoomLevel + (canvas.height * (1 - state.zoomLevel)) / 2;
    context.fillStyle = `rgba(255, 68, 68, ${alpha})`;
    context.beginPath();
    context.arc(zx, zy, PROJECTILE_RADIUS * state.zoomLevel, 0, Math.PI * 2);
    context.fill();
  }
}
