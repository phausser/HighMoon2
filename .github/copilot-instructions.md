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
- Relevante Konstanten-Gruppen: `STAR_*`, `MIN_CIRCLE_*`, `MAX_CIRCLE_*`, `SHIP_*`, `PROJECTILE_*`, `ZOOM_*`, `ENEMY_*`.
- Halte Render-Reihenfolge stabil, ausser es ist explizit angefragt.
- Beachte, dass die Szene browserbasiert bleibt (kein Framework/Bundler einfuehren).
- Standardverhalten beibehalten, sofern nicht anders gefordert: Schiff startet mittig und schaut nach links.
- Projektilverhalten beibehalten, sofern nicht anders gefordert: Space schiesst eine kleine Kugel in Blickrichtung, geradlinig, max. 5 Sekunden Lebensdauer.
- **Zoom-System**: Die Kamera zoomt automatisch heraus, wenn Projektile den Bildschirm verlassen wuerden, um diese mit 20px Margin sichtbar zu halten. Sterne bleiben unveraendert, nur Vordergrund-Objekte (Schiff, Projektile, Asteroiden) werden skaliert.

## Zoom-Verhalten
- Automatisches Herauszoomen wenn Projektile ausserhalb des sichtbaren Bereichs sind.
- Praezise Berechnung des minimalen Zoom-Levels fuer alle Projektile mit `PROJECTILE_MARGIN_FROM_EDGE`.
- Automatisches Reinzoomen auf 1.0 wenn keine Projektile mehr vorhanden sind.
- Sternenhintergrund bleibt von Zoom unbeeinflusst.
- Zoom-Level zwischen `MIN_ZOOM` und 1.0 begrenzt.

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

## Dateigrenzen
- Hauptlogik bleibt in `src/index.ts`, solange keine Aufteilung angefordert ist.
- `dist/` ist Build-Artefakt und wird aus TypeScript erzeugt.
