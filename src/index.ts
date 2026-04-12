const STAR_COUNT = 50;
const CIRCLE_COUNT = 5;
const BACKGROUND_COLOR = "#001133";
const STAR_COLOR = "255, 255, 255";
const MIN_CIRCLE_RADIUS = 36;
const MAX_CIRCLE_RADIUS = 72;
const MIN_CIRCLE_GAP = 14;
const MAX_ATTEMPTS_PER_CIRCLE = 240;
const STAR_ALPHA_LEVELS = [0.52, 0.68, 0.82, 0.95];
const SHIP_MARGIN_RIGHT = 120;
const PROJECTILE_RADIUS = 4;
const PROJECTILE_SPEED = 420;
const PROJECTILE_MAX_LIFETIME_MS = 5000;
const PROJECTILE_GRAVITY_CONSTANT = 5000;
const PROJECTILE_GRAVITY_MIN_DISTANCE = 18;
const PROJECTILE_MAX_GRAVITY_ACCELERATION = 4200;
const PROJECTILE_COLLISION_MARGIN = 0;
const ASTEROID_DENSITY = 0.0024;
const ZOOM_IN_SPEED = 1.2;
const MIN_ZOOM = 0.2;
const PROJECTILE_MARGIN_FROM_EDGE = 20;
const SHIP_MAX_ENERGY = 100;
const ENERGY_BAR_WIDTH = 20;
const ENERGY_BAR_HEIGHT = 2;
const ENERGY_BAR_OFFSET_Y = 25;
const PROJECTILE_SHIP_COLLISION_GRACE_MS = 200;
const ENEMY_MARGIN_LEFT = 120;
const ENEMY_MAX_ENERGY = 100;
const ENEMY_SPEED_Y = 180;
const ENEMY_FIRE_INTERVAL_MS = 2000;
const ENEMY_AIM_SPREAD_RAD = 0.12;
const ENEMY_STAY_MIN_MS = 10000;
const ENEMY_STAY_MAX_MS = 15000;
const ENEMY_MOVE_MIN_PX = 50;
const ENEMY_MOVE_MAX_PX = 150;
const ENEMY_PROJECTILE_HOMING_ACCELERATION = 160;
const ENEMY_ENTRY_SPEED = 300;
const ENEMY_RESPAWN_DELAY_MS = 2000;
const SHIP_COLOR = "#2244ff";
const PARTICLE_COUNT = 50;
const PARTICLE_MIN_RANGE = 25;
const PARTICLE_MAX_RANGE = 100;
const PARTICLE_LIFETIME_MS = 700;

const canvas = document.createElement("canvas");
const contextMaybe = canvas.getContext("2d");

if (!contextMaybe) {
  throw new Error("Canvas 2D Kontext konnte nicht erstellt werden.");
}

const context = contextMaybe;

document.body.appendChild(canvas);

type Star = {
  x: number;
  y: number;
  alpha: number;
  size: number;
};

type Circle = {
  x: number;
  y: number;
  radius: number;
  mass: number;
};

type ShipState = {
  x: number;
  y: number;
  angle: number;
  length: number;
  width: number;
  speedY: number;
  turnSpeed: number;
  energy: number;
};

type InputState = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

type Projectile = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  createdAt: number;
  canHitShipAfter: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  createdAt: number;
  colorRGB: string;
};

type EnemyShipState = {
  x: number;
  y: number;
  angle: number;
  length: number;
  width: number;
  speedY: number;
  energy: number;
  lastFiredAt: number;
  active: boolean;
  targetY: number;
  nextMoveAt: number;
  entering: boolean;
  respawnAt: number;
};

let stars: Star[] = [];
let circles: Circle[] = [];
let projectiles: Projectile[] = [];
let enemyProjectiles: Projectile[] = [];
let particles: Particle[] = [];
let ship: ShipState = {
  x: 0,
  y: 0,
  angle: Math.PI,
  length: 33,
  width: 20,
  speedY: 220,
  turnSpeed: 2.8,
  energy: SHIP_MAX_ENERGY,
};
let enemyShip: EnemyShipState = {
  x: 0,
  y: 0,
  angle: 0,
  length: 33,
  width: 20,
  speedY: ENEMY_SPEED_Y,
  energy: ENEMY_MAX_ENERGY,
  lastFiredAt: -Infinity,
  active: true,
  targetY: 0,
  nextMoveAt: -1,
  entering: false,
  respawnAt: -1,
};
const input: InputState = {
  left: false,
  right: false,
  up: false,
  down: false,
};
let blinkingStarIndex = -1;
let blinkUntil = 0;
let nextBlinkAt = 0;
let lastFrameTime = 0;
let zoomLevel = 1.0;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickStarAlpha(): number {
  const roll = Math.random();

  if (roll < 0.4) {
    return STAR_ALPHA_LEVELS[0];
  }

  if (roll < 0.72) {
    return STAR_ALPHA_LEVELS[1];
  }

  if (roll < 0.92) {
    return STAR_ALPHA_LEVELS[2];
  }

  return STAR_ALPHA_LEVELS[3];
}

function createStars(width: number, height: number): Star[] {
  return Array.from({ length: STAR_COUNT }, () => ({
	x: Math.floor(Math.random() * width),
	y: Math.floor(Math.random() * height),
  alpha: pickStarAlpha(),
  size: randomBetween(1, 2),
  }));
}

function createCircles(width: number, height: number): Circle[] {
  const minX = width / 4;
  const maxX = (width * 3) / 4;
  const minY = height / 4;
  const maxY = (height * 3) / 4;
  const result: Circle[] = [];

  let minGap = MIN_CIRCLE_GAP;

  for (let i = 0; i < CIRCLE_COUNT; i += 1) {
    let selected: Circle | null = null;
    let bestCandidate: Circle | null = null;
    let bestGap = -Infinity;

    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_CIRCLE; attempt += 1) {
      const candidate: Circle = {
        x: randomBetween(minX, maxX),
        y: randomBetween(minY, maxY),
        radius: randomBetween(MIN_CIRCLE_RADIUS, MAX_CIRCLE_RADIUS),
        mass: 0,
      };

      candidate.mass = calculateAsteroidMass(candidate.radius);

      let smallestEdgeGap = Infinity;

      for (const existing of result) {
        const dx = candidate.x - existing.x;
        const dy = candidate.y - existing.y;
        const centerDistance = Math.hypot(dx, dy);
        const edgeGap = centerDistance - (candidate.radius + existing.radius);
        smallestEdgeGap = Math.min(smallestEdgeGap, edgeGap);
      }

      if (result.length === 0 || smallestEdgeGap >= minGap) {
        selected = candidate;
        break;
      }

      if (smallestEdgeGap > bestGap) {
        bestGap = smallestEdgeGap;
        bestCandidate = candidate;
      }
    }

    if (!selected) {
      // Wenn der Platz eng wird, den Mindestabstand schrittweise lockern.
      minGap = Math.max(6, minGap * 0.85);
      selected =
        bestCandidate ?? {
          x: randomBetween(minX, maxX),
          y: randomBetween(minY, maxY),
          radius: randomBetween(MIN_CIRCLE_RADIUS, MAX_CIRCLE_RADIUS),
          mass: 0,
        };

      if (selected.mass === 0) {
        selected.mass = calculateAsteroidMass(selected.radius);
      }
    }

    result.push(selected);
  }

  return result;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function updateZoom(deltaSeconds: number): void {
  const allProjectiles = [...projectiles, ...enemyProjectiles];

  if (allProjectiles.length === 0) {
    // Zoom wieder rein wenn keine Projektile mehr da sind
    zoomLevel = Math.min(1.0, zoomLevel + (ZOOM_IN_SPEED * deltaSeconds));
    return;
  }

  // Finde die maximalen Ausmasse aller Projektile
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const projectile of allProjectiles) {
    minX = Math.min(minX, projectile.x);
    maxX = Math.max(maxX, projectile.x);
    minY = Math.min(minY, projectile.y);
    maxY = Math.max(maxY, projectile.y);
  }

  // Berechne den benötigten Zoom-Level um alle Projektile mit Margin zu zeigen
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const contentCenterX = (minX + maxX) / 2;
  const contentCenterY = (minY + maxY) / 2;

  // Berechne wie weit der Inhalt vom Bildschirmzentrum entfernt ist
  const canvasCenterX = canvas.width / 2;
  const canvasCenterY = canvas.height / 2;
  
  const offsetX = Math.abs(contentCenterX - canvasCenterX);
  const offsetY = Math.abs(contentCenterY - canvasCenterY);

  // Berechne die benötigte "Bounding Box" inklusive Projektilradius und Margin
  const requiredWidth = contentWidth + (2 * PROJECTILE_RADIUS) + (2 * PROJECTILE_MARGIN_FROM_EDGE) + (2 * offsetX);
  const requiredHeight = contentHeight + (2 * PROJECTILE_RADIUS) + (2 * PROJECTILE_MARGIN_FROM_EDGE) + (2 * offsetY);

  // Berechne den Zoom-Level der benötigt wird
  const zoomForWidth = canvas.width / requiredWidth;
  const zoomForHeight = canvas.height / requiredHeight;
  const requiredZoom = Math.min(zoomForWidth, zoomForHeight);

  // Begrenze den Zoom-Level und setze ihn (sofortiges Anpassen für responsive Darstellung)
  zoomLevel = Math.max(MIN_ZOOM, Math.min(1.0, requiredZoom));
}

function calculateAsteroidMass(radius: number): number {
  // Vereinfachtes 3D-Modell: Masse skaliert mit Kugelvolumen.
  return ASTEROID_DENSITY * ((4 / 3) * Math.PI * radius * radius * radius);
}

function isProjectileCollidingWithAsteroid(projectileX: number, projectileY: number, circle: Circle): boolean {
  const dx = circle.x - projectileX;
  const dy = circle.y - projectileY;
  const collisionDistance = circle.radius + PROJECTILE_RADIUS + PROJECTILE_COLLISION_MARGIN;
  return dx * dx + dy * dy <= collisionDistance * collisionDistance;
}

function isProjectileCollidingWithTarget(
  projectileX: number,
  projectileY: number,
  targetX: number,
  targetY: number,
  targetCollisionRadius: number,
): boolean {
  const dx = targetX - projectileX;
  const dy = targetY - projectileY;
  const collisionDistance = targetCollisionRadius + PROJECTILE_RADIUS + PROJECTILE_COLLISION_MARGIN;
  return dx * dx + dy * dy <= collisionDistance * collisionDistance;
}

function isProjectileCollidingWithShip(projectileX: number, projectileY: number): boolean {
  const shipCollisionRadius = Math.max(ship.length, ship.width) / 2;
  return isProjectileCollidingWithTarget(projectileX, projectileY, ship.x, ship.y, shipCollisionRadius);
}

function calculateProjectileEnergy(projectile: Projectile, now: number): number {
  const age = now - projectile.createdAt;
  const energyPercent = Math.max(0, 1 - (age / PROJECTILE_MAX_LIFETIME_MS));
  return energyPercent * 100;
}

function spawnParticles(x: number, y: number, energy: number, colorRGB: string, now: number): void {
  const energyPercent = energy / 100;
  const range = PARTICLE_MIN_RANGE + energyPercent * (PARTICLE_MAX_RANGE - PARTICLE_MIN_RANGE);
  const baseSpeed = range / (PARTICLE_LIFETIME_MS / 1000);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = baseSpeed * (0.4 + Math.random() * 0.6);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      createdAt: now,
      colorRGB,
    });
  }
}

function initializeOrClampShip(width: number, height: number): void {
  if (ship.x === 0 && ship.y === 0) {
    ship.x = width - SHIP_MARGIN_RIGHT;
    ship.y = height / 2;
    ship.angle = Math.PI;
  }

  const halfLength = ship.length / 2;
  ship.x = clamp(ship.x, halfLength, width - halfLength);
  ship.y = clamp(ship.y, halfLength, height - halfLength);
}

function spawnProjectile(now: number): void {
  const directionX = Math.cos(ship.angle);
  const directionY = Math.sin(ship.angle);
  const noseOffset = ship.length / 2;

  projectiles.push({
    x: ship.x + directionX * noseOffset,
    y: ship.y + directionY * noseOffset,
    vx: directionX * PROJECTILE_SPEED,
    vy: directionY * PROJECTILE_SPEED,
    createdAt: now,
    canHitShipAfter: now + PROJECTILE_SHIP_COLLISION_GRACE_MS,
  });
}

function initializeEnemyShip(width: number, height: number): void {
  if (enemyShip.x === 0 && enemyShip.y === 0) {
    enemyShip.x = ENEMY_MARGIN_LEFT;
    enemyShip.y = height / 2;
  }
  const halfLength = enemyShip.length / 2;
  enemyShip.x = clamp(enemyShip.x, halfLength, width - halfLength);
  enemyShip.y = clamp(enemyShip.y, halfLength, height - halfLength);
  enemyShip.targetY = enemyShip.y;
}

function respawnEnemyShip(now: number): void {
  enemyShip.x = -enemyShip.length * 2;
  enemyShip.y = randomBetween(enemyShip.length / 2, canvas.height - enemyShip.length / 2);
  enemyShip.angle = 0;
  enemyShip.energy = ENEMY_MAX_ENERGY;
  enemyShip.active = true;
  enemyShip.entering = true;
  enemyShip.lastFiredAt = now;
  enemyShip.nextMoveAt = -1;
  enemyShip.targetY = enemyShip.y;
  enemyShip.respawnAt = -1;
}

function spawnEnemyProjectile(now: number): void {  const aimAngle = Math.atan2(ship.y - enemyShip.y, ship.x - enemyShip.x);
  const spread = (Math.random() - 0.5) * 2 * ENEMY_AIM_SPREAD_RAD;
  const finalAngle = aimAngle + spread;
  const directionX = Math.cos(finalAngle);
  const directionY = Math.sin(finalAngle);
  const noseOffset = enemyShip.length / 2;

  enemyProjectiles.push({
    x: enemyShip.x + directionX * noseOffset,
    y: enemyShip.y + directionY * noseOffset,
    vx: directionX * PROJECTILE_SPEED,
    vy: directionY * PROJECTILE_SPEED,
    createdAt: now,
    canHitShipAfter: now + PROJECTILE_SHIP_COLLISION_GRACE_MS,
  });
}

function updateShip(deltaSeconds: number): void {
  if (input.left) {
    ship.angle -= ship.turnSpeed * deltaSeconds;
  }

  if (input.right) {
    ship.angle += ship.turnSpeed * deltaSeconds;
  }

  if (input.up) {
    ship.y -= ship.speedY * deltaSeconds;
  }

  if (input.down) {
    ship.y += ship.speedY * deltaSeconds;
  }

  const halfLength = ship.length / 2;
  ship.y = clamp(ship.y, halfLength, canvas.height - halfLength);
}

function updateEnemyShip(deltaSeconds: number, now: number): void {
  if (!enemyShip.active) {
    if (enemyShip.respawnAt >= 0 && now >= enemyShip.respawnAt) {
      respawnEnemyShip(now);
    }
    return;
  }

  // Entry-Phase: Schiff fliegt von links ins Spielfeld
  if (enemyShip.entering) {
    enemyShip.x += ENEMY_ENTRY_SPEED * deltaSeconds;
    enemyShip.angle = 0;
    if (enemyShip.x >= ENEMY_MARGIN_LEFT) {
      enemyShip.x = ENEMY_MARGIN_LEFT;
      enemyShip.entering = false;
      enemyShip.nextMoveAt = now + randomBetween(ENEMY_STAY_MIN_MS, ENEMY_STAY_MAX_MS);
    }
    return;
  }

  // Beim ersten Aufruf: Wartezeit vor der ersten Bewegung festlegen
  if (enemyShip.nextMoveAt < 0) {
    enemyShip.nextMoveAt = now + randomBetween(ENEMY_STAY_MIN_MS, ENEMY_STAY_MAX_MS);
  }

  // Zeit für eine neue Zielposition?
  if (now >= enemyShip.nextMoveAt) {
    const direction = Math.random() < 0.5 ? -1 : 1;
    const movePx = randomBetween(ENEMY_MOVE_MIN_PX, ENEMY_MOVE_MAX_PX);
    const halfLength = enemyShip.length / 2;
    enemyShip.targetY = clamp(
      enemyShip.y + direction * movePx,
      halfLength,
      canvas.height - halfLength,
    );
    enemyShip.nextMoveAt = now + randomBetween(ENEMY_STAY_MIN_MS, ENEMY_STAY_MAX_MS);
  }

  // Vertikal auf Zielposition zubewegen
  const dy = enemyShip.targetY - enemyShip.y;
  if (Math.abs(dy) > 2) {
    enemyShip.y += Math.sign(dy) * enemyShip.speedY * deltaSeconds;
    const halfLength = enemyShip.length / 2;
    enemyShip.y = clamp(enemyShip.y, halfLength, canvas.height - halfLength);
  }

  // Winkel dynamisch auf Spielerschiff ausrichten
  enemyShip.angle = Math.atan2(ship.y - enemyShip.y, ship.x - enemyShip.x);

  // Schussintervall prüfen
  if (now - enemyShip.lastFiredAt >= ENEMY_FIRE_INTERVAL_MS) {
    spawnEnemyProjectile(now);
    enemyShip.lastFiredAt = now;
  }
}

function updateBlink(now: number): void {
  if (blinkingStarIndex === -1 && now >= nextBlinkAt) {
	blinkingStarIndex = Math.floor(Math.random() * stars.length);
	blinkUntil = now + randomBetween(1300, 3200);
  }

  if (blinkingStarIndex !== -1 && now >= blinkUntil) {
	blinkingStarIndex = -1;
	nextBlinkAt = now + randomBetween(600, 800);
  }
}

function updateProjectiles(deltaSeconds: number, now: number): void {
  const survivingProjectiles: Projectile[] = [];
  const enemyCollisionRadius = Math.max(enemyShip.length, enemyShip.width) / 2;

  for (const projectile of projectiles) {
    // Kollision mit Asteroiden prüfen
    if (circles.some((circle) => isProjectileCollidingWithAsteroid(projectile.x, projectile.y, circle))) {
      spawnParticles(projectile.x, projectile.y, calculateProjectileEnergy(projectile, now), "255, 255, 255", now);
      continue;
    }

    // Kollision mit Schiff prüfen (nur nach Grace Period)
    if (now >= projectile.canHitShipAfter && isProjectileCollidingWithShip(projectile.x, projectile.y)) {
      const projectileEnergy = calculateProjectileEnergy(projectile, now);
      ship.energy = Math.max(0, ship.energy - projectileEnergy);
      spawnParticles(projectile.x, projectile.y, projectileEnergy, "255, 255, 255", now);
      continue; // Projektil wird zerstört
    }

    // Kollision mit Gegner-Schiff prüfen
    if (enemyShip.active &&
        isProjectileCollidingWithTarget(projectile.x, projectile.y, enemyShip.x, enemyShip.y, enemyCollisionRadius)) {
      const projectileEnergy = calculateProjectileEnergy(projectile, now);
      enemyShip.energy = Math.max(0, enemyShip.energy - projectileEnergy);
      spawnParticles(projectile.x, projectile.y, projectileEnergy, "255, 255, 255", now);
      if (enemyShip.energy <= 0) {
        enemyShip.active = false;
        enemyShip.respawnAt = now + ENEMY_RESPAWN_DELAY_MS;
      }
      continue;
    }

    let accelerationX = 0;
    let accelerationY = 0;

    for (const circle of circles) {
      const dx = circle.x - projectile.x;
      const dy = circle.y - projectile.y;
      const distanceSquared = dx * dx + dy * dy;
      const minDistance = Math.max(PROJECTILE_GRAVITY_MIN_DISTANCE, circle.radius * 0.35);
      const clampedDistanceSquared = Math.max(distanceSquared, minDistance * minDistance);
      const distance = Math.sqrt(clampedDistanceSquared);
      const directionX = dx / distance;
      const directionY = dy / distance;
      const accelerationMagnitude = Math.min(
        (PROJECTILE_GRAVITY_CONSTANT * circle.mass) / clampedDistanceSquared,
        PROJECTILE_MAX_GRAVITY_ACCELERATION,
      );

      accelerationX += directionX * accelerationMagnitude;
      accelerationY += directionY * accelerationMagnitude;
    }

    projectile.vx += accelerationX * deltaSeconds;
    projectile.vy += accelerationY * deltaSeconds;
    projectile.x += projectile.vx * deltaSeconds;
    projectile.y += projectile.vy * deltaSeconds;

    // Nochmalige Kollisionsprüfung nach Bewegung
    if (circles.some((circle) => isProjectileCollidingWithAsteroid(projectile.x, projectile.y, circle))) {
      spawnParticles(projectile.x, projectile.y, calculateProjectileEnergy(projectile, now), "255, 255, 255", now);
      continue;
    }

    // Nochmalige Schiffskollisionsprüfung nach Bewegung (nur nach Grace Period)
    if (now >= projectile.canHitShipAfter && isProjectileCollidingWithShip(projectile.x, projectile.y)) {
      const projectileEnergy = calculateProjectileEnergy(projectile, now);
      ship.energy = Math.max(0, ship.energy - projectileEnergy);
      spawnParticles(projectile.x, projectile.y, projectileEnergy, "255, 255, 255", now);
      continue; // Projektil wird zerstört
    }

    // Nochmalige Kollision mit Gegner nach Bewegung
    if (enemyShip.active &&
        isProjectileCollidingWithTarget(projectile.x, projectile.y, enemyShip.x, enemyShip.y, enemyCollisionRadius)) {
      const projectileEnergy = calculateProjectileEnergy(projectile, now);
      enemyShip.energy = Math.max(0, enemyShip.energy - projectileEnergy);
      spawnParticles(projectile.x, projectile.y, projectileEnergy, "255, 255, 255", now);
      if (enemyShip.energy <= 0) {
        enemyShip.active = false;
        enemyShip.respawnAt = now + ENEMY_RESPAWN_DELAY_MS;
      }
      continue;
    }

    survivingProjectiles.push(projectile);
  }

  projectiles = survivingProjectiles.filter(
    (projectile) => now - projectile.createdAt <= PROJECTILE_MAX_LIFETIME_MS,
  );
}

function updateEnemyProjectiles(deltaSeconds: number, now: number): void {
  const surviving: Projectile[] = [];
  const shipCollisionRadius = Math.max(ship.length, ship.width) / 2;

  for (const projectile of enemyProjectiles) {
    if (circles.some((circle) => isProjectileCollidingWithAsteroid(projectile.x, projectile.y, circle))) {
      spawnParticles(projectile.x, projectile.y, calculateProjectileEnergy(projectile, now), "255, 68, 68", now);
      continue;
    }

    if (now >= projectile.canHitShipAfter &&
        isProjectileCollidingWithTarget(projectile.x, projectile.y, ship.x, ship.y, shipCollisionRadius)) {
      const projectileEnergy = calculateProjectileEnergy(projectile, now);
      ship.energy = Math.max(0, ship.energy - projectileEnergy);
      spawnParticles(projectile.x, projectile.y, projectileEnergy, "255, 68, 68", now);
      continue;
    }

    let accelerationX = 0;
    let accelerationY = 0;

    for (const circle of circles) {
      const dx = circle.x - projectile.x;
      const dy = circle.y - projectile.y;
      const distanceSquared = dx * dx + dy * dy;
      const minDistance = Math.max(PROJECTILE_GRAVITY_MIN_DISTANCE, circle.radius * 0.35);
      const clampedDistanceSquared = Math.max(distanceSquared, minDistance * minDistance);
      const distance = Math.sqrt(clampedDistanceSquared);
      const directionX = dx / distance;
      const directionY = dy / distance;
      const accelerationMagnitude = Math.min(
        (PROJECTILE_GRAVITY_CONSTANT * circle.mass) / clampedDistanceSquared,
        PROJECTILE_MAX_GRAVITY_ACCELERATION,
      );
      accelerationX += directionX * accelerationMagnitude;
      accelerationY += directionY * accelerationMagnitude;
    }

    // Homing: Lenkbeschleunigung Richtung Spielerschiff
    const homingDx = ship.x - projectile.x;
    const homingDy = ship.y - projectile.y;
    const homingDist = Math.hypot(homingDx, homingDy);
    if (homingDist > 0) {
      accelerationX += (homingDx / homingDist) * ENEMY_PROJECTILE_HOMING_ACCELERATION;
      accelerationY += (homingDy / homingDist) * ENEMY_PROJECTILE_HOMING_ACCELERATION;
    }

    projectile.vx += accelerationX * deltaSeconds;
    projectile.vy += accelerationY * deltaSeconds;
    projectile.x += projectile.vx * deltaSeconds;
    projectile.y += projectile.vy * deltaSeconds;

    if (circles.some((circle) => isProjectileCollidingWithAsteroid(projectile.x, projectile.y, circle))) {
      spawnParticles(projectile.x, projectile.y, calculateProjectileEnergy(projectile, now), "255, 68, 68", now);
      continue;
    }

    if (now >= projectile.canHitShipAfter &&
        isProjectileCollidingWithTarget(projectile.x, projectile.y, ship.x, ship.y, shipCollisionRadius)) {
      const projectileEnergy = calculateProjectileEnergy(projectile, now);
      ship.energy = Math.max(0, ship.energy - projectileEnergy);
      spawnParticles(projectile.x, projectile.y, projectileEnergy, "255, 68, 68", now);
      continue;
    }

    surviving.push(projectile);
  }

  enemyProjectiles = surviving.filter((p) => now - p.createdAt <= PROJECTILE_MAX_LIFETIME_MS);
}

function updateParticles(deltaSeconds: number, now: number): void {
  for (const p of particles) {
    p.x += p.vx * deltaSeconds;
    p.y += p.vy * deltaSeconds;
  }
  particles = particles.filter((p) => now - p.createdAt <= PARTICLE_LIFETIME_MS);
}

function drawParticles(now: number): void {
  for (const p of particles) {
    const age = now - p.createdAt;
    const alpha = Math.max(0, 1 - age / PARTICLE_LIFETIME_MS);
    const zoomedX = p.x * zoomLevel + (canvas.width * (1 - zoomLevel)) / 2;
    const zoomedY = p.y * zoomLevel + (canvas.height * (1 - zoomLevel)) / 2;

    context.fillStyle = `rgba(${p.colorRGB}, ${alpha})`;
    context.fillRect(zoomedX - 0.5, zoomedY - 0.5, 1.5, 1.5);
  }
}

function drawStars(now: number): void {
  for (let index = 0; index < stars.length; index += 1) {
	const star = stars[index];
	let alpha = star.alpha;

	if (index === blinkingStarIndex) {
	  // Pulsiert leicht waehrend der kurzen Blinkphase.
      alpha = 0.1 + Math.abs(Math.sin(now * 0.045)) * 0.9;
	}

	context.fillStyle = `rgba(${STAR_COLOR}, ${alpha})`;
  context.fillRect(star.x, star.y, star.size, star.size);
  }
}

function drawCenterCircles(): void {
  context.fillStyle = "#ffffff";

  for (const circle of circles) {
    context.beginPath();
    context.arc(
      circle.x * zoomLevel + (canvas.width * (1 - zoomLevel)) / 2,
      circle.y * zoomLevel + (canvas.height * (1 - zoomLevel)) / 2,
      circle.radius * zoomLevel,
      0,
      Math.PI * 2
    );
    context.fill();
  }
}

function drawEnergyBar(shipX: number, shipY: number, energy: number, maxEnergy: number): void {
  const barX = shipX - (ENERGY_BAR_WIDTH * zoomLevel) / 2;
  const barY = shipY - (ENERGY_BAR_OFFSET_Y * zoomLevel);
  const barWidth = ENERGY_BAR_WIDTH * zoomLevel;
  const barHeight = ENERGY_BAR_HEIGHT * zoomLevel;

  context.fillStyle = "#333333";
  context.fillRect(barX, barY, barWidth, barHeight);

  const energyPercent = energy / maxEnergy;
  const energyWidth = barWidth * energyPercent;

  context.fillStyle = energyPercent < 0.25 ? "#ff0000" : "#00ff00";
  context.fillRect(barX, barY, energyWidth, barHeight);
}

function drawShip(): void {
  context.save();
  
  const zoomedX = ship.x * zoomLevel + (canvas.width * (1 - zoomLevel)) / 2;
  const zoomedY = ship.y * zoomLevel + (canvas.height * (1 - zoomLevel)) / 2;
  const zoomedLength = ship.length * zoomLevel;
  const zoomedWidth = ship.width * zoomLevel;
  
  context.translate(zoomedX, zoomedY);
  context.rotate(ship.angle);

  context.fillStyle = SHIP_COLOR;
  context.beginPath();
  context.moveTo(zoomedLength / 2, 0);
  context.lineTo(-zoomedLength / 2, -zoomedWidth / 2);
  context.lineTo(-zoomedLength / 2, zoomedWidth / 2);
  context.closePath();
  context.fill();

  context.restore();

  // Energiebalken über dem Schiff zeichnen
  drawEnergyBar(zoomedX, zoomedY, ship.energy, SHIP_MAX_ENERGY);
}

function drawEnemyShip(): void {
  if (!enemyShip.active) return;

  context.save();

  const zoomedX = enemyShip.x * zoomLevel + (canvas.width * (1 - zoomLevel)) / 2;
  const zoomedY = enemyShip.y * zoomLevel + (canvas.height * (1 - zoomLevel)) / 2;
  const zoomedLength = enemyShip.length * zoomLevel;
  const zoomedWidth = enemyShip.width * zoomLevel;

  context.translate(zoomedX, zoomedY);
  context.rotate(enemyShip.angle);

  context.fillStyle = "#ff4444";
  context.beginPath();
  context.moveTo(zoomedLength / 2, 0);
  context.lineTo(-zoomedLength / 2, -zoomedWidth / 2);
  context.lineTo(-zoomedLength / 2, zoomedWidth / 2);
  context.closePath();
  context.fill();

  context.restore();

  drawEnergyBar(zoomedX, zoomedY, enemyShip.energy, ENEMY_MAX_ENERGY);
}

function drawProjectiles(now: number): void {
  for (const projectile of projectiles) {
    const alpha = Math.max(0, 1 - (now - projectile.createdAt) / PROJECTILE_MAX_LIFETIME_MS);
    const zoomedX = projectile.x * zoomLevel + (canvas.width * (1 - zoomLevel)) / 2;
    const zoomedY = projectile.y * zoomLevel + (canvas.height * (1 - zoomLevel)) / 2;
    const zoomedRadius = PROJECTILE_RADIUS * zoomLevel;

    context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    context.beginPath();
    context.arc(zoomedX, zoomedY, zoomedRadius, 0, Math.PI * 2);
    context.fill();
  }
}

function drawEnemyProjectiles(now: number): void {
  for (const projectile of enemyProjectiles) {
    const alpha = Math.max(0, 1 - (now - projectile.createdAt) / PROJECTILE_MAX_LIFETIME_MS);
    const zoomedX = projectile.x * zoomLevel + (canvas.width * (1 - zoomLevel)) / 2;
    const zoomedY = projectile.y * zoomLevel + (canvas.height * (1 - zoomLevel)) / 2;
    const zoomedRadius = PROJECTILE_RADIUS * zoomLevel;

    context.fillStyle = `rgba(255, 68, 68, ${alpha})`;
    context.beginPath();
    context.arc(zoomedX, zoomedY, zoomedRadius, 0, Math.PI * 2);
    context.fill();
  }
}

function render(now: number): void {
  const deltaSeconds = lastFrameTime === 0 ? 0 : (now - lastFrameTime) / 1000;
  lastFrameTime = now;

  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, canvas.width, canvas.height);

  updateBlink(now);
  updateShip(deltaSeconds);
  updateEnemyShip(deltaSeconds, now);
  updateProjectiles(deltaSeconds, now);
  updateEnemyProjectiles(deltaSeconds, now);
  updateParticles(deltaSeconds, now);
  updateZoom(deltaSeconds);
  
  drawStars(now);
  drawCenterCircles();
  drawParticles(now);
  drawProjectiles(now);
  drawEnemyProjectiles(now);
  drawEnemyShip();
  drawShip();

  requestAnimationFrame(render);
}

function resizeCanvas(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  stars = createStars(canvas.width, canvas.height);
  circles = createCircles(canvas.width, canvas.height);
  initializeOrClampShip(canvas.width, canvas.height);
  initializeEnemyShip(canvas.width, canvas.height);
}

function setInputByKey(key: string, isPressed: boolean): void {
  switch (key) {
    case "ArrowLeft":
      input.left = isPressed;
      break;
    case "ArrowRight":
      input.right = isPressed;
      break;
    case "ArrowUp":
      input.up = isPressed;
      break;
    case "ArrowDown":
      input.down = isPressed;
      break;
    default:
      break;
  }
}

resizeCanvas();
nextBlinkAt = performance.now() + randomBetween(600, 1800);
window.addEventListener("resize", resizeCanvas);
window.addEventListener("keydown", (event) => {
  if (event.key.startsWith("Arrow") || event.code === "Space") {
    event.preventDefault();
  }

  if (event.code === "Space" && !event.repeat) {
    spawnProjectile(performance.now());
  }

  setInputByKey(event.key, true);
});
window.addEventListener("keyup", (event) => {
  if (event.key.startsWith("Arrow") || event.code === "Space") {
    event.preventDefault();
  }
  setInputByKey(event.key, false);
});
requestAnimationFrame(render);
