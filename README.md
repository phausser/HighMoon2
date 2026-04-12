# HighMoon2

A minimal TypeScript browser scene rendered with Canvas 2D featuring an automatic zoom system for projectiles.

## Features
- Spaceship navigation in 2D space
- Projectile shooting with gravitational physics
- Automatic zoom system: camera zooms out to keep all projectiles visible with 20px margin
- Dynamic background stars (unaffected by zoom)
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
The camera automatically zooms out when projectiles would leave the screen, ensuring all projectiles remain visible with a 20-pixel margin from the screen edge. When no projectiles are active, the camera smoothly zooms back to normal (1.0x) scale. The star background remains unaffected by zoom changes.

## License
MIT (see `LICENSE`).

