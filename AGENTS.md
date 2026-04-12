# AGENTS.md

## Zweck
Dieses Dokument gibt Agenten einen schnellen, verlässlichen Überblick über das Projekt `HighMoon2` und die erwartete Arbeitsweise bei Änderungen.

## Projektstatus (Ist-Zustand)
- Sprache: TypeScript
- Laufzeit: Browser (Canvas 2D)
- Build: `tsc` (kein Bundler, kein Framework)
- Einstiegscode: `src/index.ts`
- Kompilat: `dist/index.js`
- HTML-Einstieg: `index.html` lädt `dist/index.js`
- Spielerschiff startet rechts, schaut nach links.
- Gegnerschiff startet links, schaut auf den Spieler.

## Relevante Dateien
- `package.json`: Build-Skript und Abhängigkeiten
- `tsconfig.json`: TypeScript-Compiler-Konfiguration (`outDir: dist`, `module: es2015`)
- `index.html`: Vollbild-Seite mit Canvas-Hintergrund und Script-Tag auf `dist/index.js`
- `src/index.ts`: Komplette Szenenlogik (Sterne, Kreise, Raumschiff, Gegner, Input, Render-Loop)

## Build und Ausführung
### Build
```bash
npm run build
```

### Im Browser starten
Nach dem Build `index.html` im Browser öffnen.

## Laufzeit-Architektur (`src/index.ts`)
- Erstellt ein Fullscreen-Canvas und zeichnet pro Frame:
  1. Hintergrund
  2. Sterne (inkl. Blinklogik) – unverändert vom Zoom
  3. Weiße Kreise / Asteroiden (skaliert durch Zoom)
  4. Spieler-Projektile (kleine Kugeln, skaliert durch Zoom)
  5. Gegner-Projektile (rot, lenkend, skaliert durch Zoom)
  6. Gegnerschiff (rotes Dreieck, skaliert durch Zoom)
  7. Spielerschiff (blaues Dreieck, skaliert durch Zoom)
- Kernfunktionen:
  - `createStars(...)`, `drawStars(...)`, `updateBlink(...)`
  - `createCircles(...)`, `drawCenterCircles(...)`
  - `updateShip(...)`, `drawShip(...)`
  - `updateEnemyShip(...)`, `drawEnemyShip(...)`
  - `spawnProjectile(...)`, `updateProjectiles(...)`, `drawProjectiles(...)`
  - `spawnEnemyProjectile(...)`, `updateEnemyProjectiles(...)`, `drawEnemyProjectiles(...)`
  - `respawnEnemyShip(now)` – setzt Gegner außerhalb links und startet Entry-Phase
  - `updateZoom(...)` – Zoom-Logik
  - `render(...)`
- Input:
  - `ArrowLeft` / `ArrowRight` drehen das Spielerschiff
  - `ArrowUp` / `ArrowDown` bewegen das Spielerschiff vertikal
  - `Space` schießt eine kleine Kugel in Blickrichtung

## Spieler-Projektile
- Fliegen geradlinig in Blickrichtung, werden von Asteroiden gravitativ abgelenkt.
- Maximal 5 Sekunden Lebensdauer; Schaden nimmt mit Alter ab.
- Zoom-System: Kamera zoomt sanft und gleichmässig heraus, um Spieler-Projektile mit 20 px Margin sichtbar zu halten.
- Maximale Verkleinerung: 50 % (`MIN_ZOOM = 0.5`). Jenseits dieser Grenze dürfen Projektile den Bildschirm verlassen.
- Feind-Projektile beeinflussen den Zoom **nicht**.

## Gegner-System
- `EnemyShipState` enthält: `active`, `entering`, `respawnAt`, `targetY`, `nextMoveAt`, `lastFiredAt` u. a.
- Konstanten-Gruppe: `ENEMY_*` (z. B. `ENEMY_MARGIN_LEFT`, `ENEMY_FIRE_INTERVAL_MS`, `ENEMY_RESPAWN_DELAY_MS`, `ENEMY_ENTRY_SPEED`).
- Gegner zielt immer auf den Spieler und feuert homing-Projektile (rote Kugeln).
- **Respawn-Ablauf**:
  1. `active = false`, `respawnAt = now + ENEMY_RESPAWN_DELAY_MS` bei Tod.
  2. `updateEnemyShip` prüft `respawnAt` und ruft `respawnEnemyShip(now)` auf.
  3. `respawnEnemyShip` positioniert den Gegner links außerhalb des Bildschirms (`x = -length * 2`), setzt `entering = true` und `active = true`.
  4. Entry-Phase: Gegner bewegt sich mit `ENEMY_ENTRY_SPEED` nach rechts bis `ENEMY_MARGIN_LEFT`; kein Schuss in dieser Phase.
  5. Nach Ankunft: `entering = false`, normaler Kampfmodus.

## Arbeitsregeln für Agenten
- Kleine, gezielte Änderungen bevorzugen; bestehendes Verhalten nur ändern, wenn angefordert.
- Bei visuellen Parametern zuerst Konstanten anpassen (z. B. `STAR_*`, `SHIP_*`, `ZOOM_*`, `PROJECTILE_*`, `ENEMY_*`) statt Logik groß umzubauen.
- Nach Codeänderungen TypeScript-Build ausführen und auf Fehler prüfen.
- Keine unnötigen neuen Abhängigkeiten einführen.
- Ausgabe bleibt browserbasiert über `index.html` + `dist/index.js`.

## Bekannte Besonderheiten
- `dist/` ist Build-Artefakt aus `tsc`.
- Es gibt aktuell keine automatisierten Tests; Absicherung erfolgt primär über Build und manuelle Sichtprüfung im Browser.
