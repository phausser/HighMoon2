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
- Schiff schaut initial nach links.

## Relevante Dateien
- `package.json`: Build-Skript und Abhängigkeiten
- `tsconfig.json`: TypeScript-Compiler-Konfiguration (`outDir: dist`, `module: es2015`)
- `index.html`: Vollbild-Seite mit Canvas-Hintergrund und Script-Tag auf `dist/index.js`
- `src/index.ts`: Komplette Szenenlogik (Sterne, Kreise, Raumschiff, Input, Render-Loop)

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
  2. Sterne (inkl. Blinklogik) - unverändert vom Zoom
  3. Weiße Kreise in der Mitte (skaliert durch Zoom)
  4. Projektile (kleine Kugeln, skaliert durch Zoom)
  5. Raumschiff (Dreieck, skaliert durch Zoom)
- Kernfunktionen:
  - `createStars(...)`, `drawStars(...)`, `updateBlink(...)`
  - `createCircles(...)`, `drawCenterCircles(...)`
  - `updateShip(...)`, `drawShip(...)`
  - `spawnProjectile(...)`, `updateProjectiles(...)`, `drawProjectiles(...)`
  - `updateZoom(...)` - **Neue Zoom-Logik**
  - `render(...)`
- Input:
  - `ArrowLeft` / `ArrowRight` drehen das Schiff
  - `ArrowUp` / `ArrowDown` bewegen das Schiff vertikal
  - `Space` schiesst eine kleine Kugel in Blickrichtung
- Projektil-Verhalten:
  - Fliegt geradlinig in aktueller Blickrichtung des Schiffs
  - Besteht maximal 5 Sekunden
  - **Zoom-System**: Kamera zoomt automatisch heraus um alle Projektile mit 20px Margin sichtbar zu halten

## Arbeitsregeln für Agenten
- Kleine, gezielte Änderungen bevorzugen; bestehendes Verhalten nur ändern, wenn angefordert.
- Bei visuellen Parametern zuerst Konstanten anpassen (z. B. `STAR_*`, `MIN_CIRCLE_*`, `SHIP_*`, `ZOOM_*`, `PROJECTILE_*`) statt Logik groß umzubauen.
- Nach Codeänderungen TypeScript-Build ausführen und auf Fehler prüfen.
- Keine unnötigen neuen Abhängigkeiten einführen.
- Ausgabe bleibt browserbasiert über `index.html` + `dist/index.js`.

## Bekannte Besonderheiten
- `dist/` ist Build-Artefakt aus `tsc`.
- Es gibt aktuell keine automatisierten Tests; Absicherung erfolgt primär über Build und manuelle Sichtprüfung im Browser.

