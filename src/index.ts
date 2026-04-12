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
};

type ShipState = {
  x: number;
  y: number;
  angle: number;
  length: number;
  width: number;
  speedY: number;
  turnSpeed: number;
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
};

let stars: Star[] = [];
let circles: Circle[] = [];
let projectiles: Projectile[] = [];
let ship: ShipState = {
  x: 0,
  y: 0,
  angle: Math.PI,
  length: 33,
  width: 20,
  speedY: 220,
  turnSpeed: 2.8,
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
      };

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
        };
    }

    result.push(selected);
  }

  return result;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
  });
}

function resizeCanvas(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  stars = createStars(canvas.width, canvas.height);
  circles = createCircles(canvas.width, canvas.height);
  initializeOrClampShip(canvas.width, canvas.height);
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
  for (const projectile of projectiles) {
    projectile.x += projectile.vx * deltaSeconds;
    projectile.y += projectile.vy * deltaSeconds;
  }

  projectiles = projectiles.filter(
    (projectile) => now - projectile.createdAt <= PROJECTILE_MAX_LIFETIME_MS,
  );
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
	context.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
	context.fill();
  }
}

function drawShip(): void {
  context.save();
  context.translate(ship.x, ship.y);
  context.rotate(ship.angle);

  context.fillStyle = "#ffffff";
  context.beginPath();
  context.moveTo(ship.length / 2, 0);
  context.lineTo(-ship.length / 2, -ship.width / 2);
  context.lineTo(-ship.length / 2, ship.width / 2);
  context.closePath();
  context.fill();

  context.restore();
}

function drawProjectiles(): void {
  context.fillStyle = "#ffffff";

  for (const projectile of projectiles) {
    context.beginPath();
    context.arc(projectile.x, projectile.y, PROJECTILE_RADIUS, 0, Math.PI * 2);
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
  updateProjectiles(deltaSeconds, now);
  drawStars(now);
  drawCenterCircles();
  drawProjectiles();
  drawShip();

  requestAnimationFrame(render);
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
