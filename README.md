# HighMoon2

A minimal TypeScript browser game rendered with Canvas 2D – two ships fight each other in a gravity-filled asteroid field.

## Features
- Spaceship navigation in 2D space
- Projectile shooting with gravitational physics (asteroids bend trajectories)
- **Enemy ship** (red) that aims at the player, fires homing projectiles and automatically respawns from the left after being destroyed
- Energy bars for both ships; projectile damage decreases with projectile age
- Automatic zoom system: camera smoothly zooms out (up to 50 %) to keep player projectiles visible; beyond that limit projectiles may leave the screen
- Dynamic background stars with blink effect (unaffected by zoom)
- Asteroids with collision detection

## Stack
- TypeScript
- Browser Canvas 2D
- `tsc` build output to `dist/index.js`

## Run
```bash
npm run build
```
Then open `index.html` in your browser.

## Controls
- `ArrowLeft` / `ArrowRight`: rotate ship
- `ArrowUp` / `ArrowDown`: move ship vertically
- `Space`: shoot projectile in facing direction

## Zoom System
The camera tracks **player projectiles only** – enemy projectiles never influence the zoom level.

- The camera zooms out smoothly when player projectiles approach the screen edge (20 px margin).
- The maximum zoom-out is **50 %** (`MIN_ZOOM = 0.5`). Beyond that limit, projectiles may leave the visible area.
- When all player projectiles have expired or been destroyed, the camera smoothly zooms back to 1.0×.
- Zoom transitions are always gradual – no abrupt jumps in either direction.
- The star background is unaffected by zoom; only foreground objects (ship, projectiles, asteroids) are scaled.

## Enemy Behaviour
- Starts on the left side of the screen (`ENEMY_MARGIN_LEFT`).
- Moves vertically at random intervals and always aims at the player.
- Fires a homing projectile every `ENEMY_FIRE_INTERVAL_MS` ms.
- When destroyed, a new enemy flies in from off-screen left after `ENEMY_RESPAWN_DELAY_MS` ms.

## License
MIT (see `LICENSE`).
