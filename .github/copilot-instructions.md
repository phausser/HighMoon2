# Copilot Instructions

## Ziel
Dieses Dokument definiert, wie Copilot in `HighMoon2` arbeiten soll.

## Projektkontext
- Sprache: TypeScript
- Laufzeit: Browser mit Canvas 2D
- Einstieg: `src/index.ts`
- Build-Ausgabe: `dist/index.js`
- HTML-Start: `index.html` laedt `dist/index.js`

## Arbeitsstil
- Bevorzuge kleine, gezielte Aenderungen.
- Vermeide grosse Refactorings ohne explizite Anforderung.
- Erhalte bestehendes Verhalten, wenn nichts anderes verlangt ist.
- Nutze bestehende Muster in `src/index.ts`.

## Aenderungen an der Szene
- Passe zuerst Konstanten an, bevor Logik umgebaut wird.
- Relevante Konstanten-Gruppen: `STAR_*`, `MIN_CIRCLE_*`, `MAX_CIRCLE_*`, `SHIP_*`, `PROJECTILE_*`, `ZOOM_*`, `ENEMY_*`, `PARTICLE_*`.
- Halte Render-Reihenfolge stabil, ausser es ist explizit angefragt.
- Beachte, dass die Szene browserbasiert bleibt (kein Framework/Bundler einfuehren).
- Standardverhalten beibehalten, sofern nicht anders gefordert: Schiff startet mittig und schaut nach links.
- Projektilverhalten beibehalten, sofern nicht anders gefordert: Space schiesst eine kleine Kugel in Blickrichtung, geradlinig, max. 5 Sekunden Lebensdauer.
- **Zoom-System**: Die Kamera zoomt sanft heraus, wenn **Spieler-Projektile** den Bildschirmrand naehern (20 px Margin). Feind-Projektile beeinflussen den Zoom nicht. Sterne bleiben unveraendert, nur Vordergrund-Objekte (Schiff, Projektile, Asteroiden) werden skaliert.

## Zoom-Verhalten
- Zoom gilt ausschliesslich fuer Spieler-Projektile; Gegner-Projektile werden vollstaendig ignoriert.
- Praezise Berechnung des minimalen Zoom-Levels fuer alle Spieler-Projektile mit `PROJECTILE_MARGIN_FROM_EDGE`.
- Maximale Verkleinerung: `MIN_ZOOM = 0.5` (50 %). Jenseits dieser Grenze duerfen Projektile den sichtbaren Bereich verlassen.
- Automatisches Reinzoomen auf 1.0 wenn keine Spieler-Projektile mehr vorhanden sind.
- Zoom-Uebergaenge sind immer gleichmaessig und nie ruckhaft – in beide Richtungen.
- Sternenhintergrund bleibt von Zoom unbeeinflusst.
- Zoom-Level zwischen `MIN_ZOOM` (0.5) und 1.0 begrenzt.

## Gegner-Verhalten
- Gegner-Schiff (rot) startet links auf Hoehe `ENEMY_MARGIN_LEFT`.
- Bewegt sich vertikal in Zufallsintervallen; Winkel zeigt immer auf Spielerschiff.
- Feuert alle `ENEMY_FIRE_INTERVAL_MS` ms ein lenkendes Projektil (Homing).
- **Respawn**: Nach dem Tod fliegt nach `ENEMY_RESPAWN_DELAY_MS` ms ein neuer Gegner von links ausserhalb des Bildschirms ins Spielfeld (`entering`-Phase). Waehrend der Entry-Phase kein Schuss.
- Relevante Felder in `EnemyShipState`: `active`, `entering`, `respawnAt`.
- Respawn-Logik: `respawnEnemyShip(now)` setzt Position, Energie und Flags; `updateEnemyShip` steuert Entry-Bewegung und prueft `respawnAt`.

## Input und Interaktion
- Vorhandene Steuerung mit Pfeiltasten nicht stillschweigend aendern.
- Neue Eingaben nur ergaenzen, wenn gefordert.
- Bei Eingabeaenderungen auf konsistentes `keydown`/`keyup` Verhalten achten.
- `Space` feuert ein Projektil pro Tastendruck; kein stillschweigendes Dauerfeuer oder geaendertes Repeat-Verhalten einfuehren.

## Build und Validierung
- Nach jeder Codeaenderung `npm run build` ausfuehren.
- TypeScript-Fehler vor Abschluss beheben.
- Bei visuellen Aenderungen kurze manuelle Browser-Pruefung empfehlen.

## Abhaengigkeiten
- Keine unnoetigen neuen Pakete installieren.
- Vorhandenes Setup mit `tsc` beibehalten.
- Web Audio API ist bereits genutzt (kein externes Audio-Paket einfuehren).

## Sound-System
- Audio wird per Web Audio API synthetisiert; keine externen Audio-Dateien.
- `getAudioContext()` initialisiert den `AudioContext` lazy (erst bei erster Nutzerinteraktion).
- `playShootSound(pitchHz)` erzeugt einen kurzen Sinuston mit Frequenzabfall (Spieler: 880 Hz, Gegner: 420 Hz).
- `playExplosionSound(energy)` erzeugt einen White-Noise-Burst mit Tiefpassfilter; Lautstaerke und Grenzfrequenz skalieren mit `energy` (0–100).
- Neue Soundeffekte immer in try/catch kapseln – Audio-Fehler stillschweigend ignorieren.
- Kein Autoplay-Problem: `AudioContext` wird nur nach Nutzerinteraktion erstellt/resumed.

## Dateigrenzen
- Hauptlogik bleibt in `src/index.ts`, solange keine Aufteilung angefordert ist.
- `dist/` ist Build-Artefakt und wird aus TypeScript erzeugt.
