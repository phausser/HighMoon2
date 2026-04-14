# HighMoon2

Ein minimales TypeScript-Browserspiel gerendert mit Canvas 2D – zwei Schiffe kämpfen gegeneinander in einem gravitations-beeinflussten Asteroidenfeld.

## Features
- Raumschiff-Navigation im 2D-Raum
- Projektile mit Gravitations-Physik (Asteroiden lenken Flugbahnen ab)
- **Gegner-Schiff** (rot): zielt auf den Spieler, feuert lenkende Projektile, spawnt automatisch von links neu nach dem Tod
- **Intelligentes Zielen**: Steht der Spieler still, simuliert der Gegner Projektilbahnen und sucht den besten Abschusswinkel
- Energieleisten für beide Schiffe; Projektilschaden nimmt mit dem Alter ab
- **Score-System**: Punkte pro Abschuss – mehr Punkte je weniger Schüsse der Spieler brauchte
- **Spielstart / Game-Over**-Schleife: „PRESS SPACE TO START" → Kampf → „GAME OVER – PRESS SPACE"
- Automatisches Zoom-System: Kamera zoomt sanft heraus (max. 50 %), um Spieler-Projektile sichtbar zu halten; jenseits des Limits dürfen Projektile den Bildschirm verlassen
- Dynamische Hintergrundsterne mit Blinkeffekt (vom Zoom unberührt)
- Asteroiden mit Kollisionserkennung
- **Hintergrundmusik** (`cosmic-coin-chase.mp3`) startet beim ersten Spielstart
- **Soundeffekte** via Web Audio API: synthetisierter Schusssound (Spieler = hohe Frequenz, Gegner = niedrige Frequenz) und Explosionssound skaliert nach Aufprallenergie; keine externen Audio-Assets nötig

## Stack
- TypeScript 6
- Browser Canvas 2D + Web Audio API
- `tsc` + `cp assets/* dist/` (Build-Skript via `npm run build`)
- Modularer Quellcode in `src/` → Ausgabe nach `dist/`

## Projektstruktur
```
src/
  index.ts        – Einstiegspunkt (initialisiert Canvas, Input, Render-Loop)
  state.ts        – Canvas-Erstellung, globales State-Objekt
  types.ts        – TypeScript-Typen (Star, Circle, ShipState, …)
  constants.ts    – Alle Spielkonstanten (STAR_*, SHIP_*, ENEMY_*, ZOOM_*, …)
  utils.ts        – randomBetween(), clamp()
  stars.ts        – Sterne: erstellen, blinken, zeichnen
  asteroids.ts    – Asteroiden: erstellen, zeichnen, Masse berechnen
  physics.ts      – Kollision, Projektilenergie, Zoom-Update
  particles.ts    – Partikel & Bildschirmwackeln
  ship.ts         – Spielerschiff: Update, Zeichnen, Projektile
  enemy.ts        – Gegnerschiff: Update, Zeichnen, Projektile, Respawn, KI
  audio.ts        – Web Audio API: Schusssound, Explosionssound, Musik
  input.ts        – Tastatur-Input, Spielstart/-neustart
  render.ts       – Render-Loop, Szenenaufbau, Score-Overlay, Prompt
assets/
  styles.css      – Stylesheet (wird nach dist/ kopiert)
  cosmic-coin-chase.mp3 – Hintergrundmusik (wird nach dist/ kopiert)
```

## Build und Starten
```bash
npm run build
```
Danach `index.html` im Browser öffnen.

## Steuerung
- `ArrowLeft` / `ArrowRight`: Schiff drehen
- `ArrowUp` / `ArrowDown`: Schiff vertikal bewegen
- `Space`: Projektil in Blickrichtung abfeuern (erstes Drücken startet das Spiel)

## Score-System
- Pro Abschuss: `max(1, 101 − Anzahl_eigener_Schüsse_seit_letztem_Kill)`
- Weniger Schüsse = mehr Punkte; Score wird 5-stellig oben mittig angezeigt

## Zoom-System
Die Kamera verfolgt **ausschließlich Spieler-Projektile** – Gegner-Projektile beeinflussen den Zoom nie.

- Zoomt sanft heraus, wenn Spieler-Projektile den Bildschirmrand nähern (20 px Margin).
- Maximale Verkleinerung: **50 %** (`MIN_ZOOM = 0.5`). Jenseits dürfen Projektile den sichtbaren Bereich verlassen.
- Zoomt automatisch zurück auf 1,0×, wenn keine Spieler-Projektile mehr vorhanden sind.
- Übergänge sind immer gleichmäßig – kein Ruckeln in beide Richtungen.
- Sternenhintergrund bleibt unberührt; nur Vordergrundobjekte (Schiff, Projektile, Asteroiden) werden skaliert.

## Gegner-Verhalten
- Startet links auf Höhe `ENEMY_MARGIN_LEFT`.
- Bewegt sich vertikal in zufälligen Intervallen; Winkel zeigt immer auf den Spieler.
- Feuert alle `ENEMY_FIRE_INTERVAL_MS` ms ein lenkendes Projektil.
- **Intelligentes Zielen**: Steht der Spieler länger als `ENEMY_STILL_THRESHOLD_MS` still, simuliert der Gegner Projektilbahnen und wählt den treffsichersten Winkel.
- Nach dem Tod fliegt nach `ENEMY_RESPAWN_DELAY_MS` ms ein neuer Gegner von links außerhalb des Bildschirms ins Spielfeld (`entering`-Phase); kein Schuss während des Einfliegens.

## Soundeffekte
Sound wird zur Laufzeit per Web Audio API synthetisiert – keine Audio-Dateien werden gebündelt.

| Ereignis | Sound |
|---|---|
| Spieler schießt | Kurzer abfallender Sinuston (880 → 176 Hz, ~130 ms) |
| Gegner schießt | Gleiche Form, tiefere Frequenz (420 → 84 Hz) |
| Explosion | White-Noise-Burst durch einen abfallenden Tiefpassfilter; Lautstärke und Frequenzbereich skalieren mit Aufprallenergie |
| Spielstart | Hintergrundmusik startet (`cosmic-coin-chase.mp3`) |

Der `AudioContext` wird lazy erst nach der ersten Nutzerinteraktion erstellt – Browser-Autoplay-Richtlinien werden automatisch eingehalten.

## Lizenz
MIT (siehe `LICENSE`).
