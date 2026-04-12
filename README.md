# HighMoon2

A minimal TypeScript browser game rendered with Canvas 2D – two ships fight each other in a gravity-filled asteroid field.

## Features
- Spaceship navigation in 2D space
- Projectile shooting with gravitational physics (asteroids bend trajectories)
- **Enemy ship** (red) that aims at the player, fires homing projectiles and automatically respawns from the left after being destroyed
- Energy bars for both ships; projectile damage decreases with projectile age
- Automatic zoom system: camera zooms out to keep all active projectiles visible with a 20 px margin
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
The camera automatically zooms out when projectiles would leave the screen, ensuring all projectiles remain visible with a 20-pixel margin from the screen edge. When no projectiles are active, the camera smoothly zooms back to normal (1.0×) scale. The star background remains unaffected by zoom changes.

## Enemy Behaviour
- Starts on the left side of the screen (`ENEMY_MARGIN_LEFT`).
- Moves vertically at random intervals and always aims at the player.
- Fires a homing projectile every `ENEMY_FIRE_INTERVAL_MS` ms.
- When destroyed, a new enemy flies in from off-screen left after `ENEMY_RESPAWN_DELAY_MS` ms.

## License
MIT (see `LICENSE`).
