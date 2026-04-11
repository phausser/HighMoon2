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
- Relevante Konstanten-Gruppen: `STAR_*`, `MIN_CIRCLE_*`, `MAX_CIRCLE_*`, `SHIP_*`.
- Halte Render-Reihenfolge stabil, ausser es ist explizit angefragt.
- Beachte, dass die Szene browserbasiert bleibt (kein Framework/Bundler einfuehren).

## Input und Interaktion
- Vorhandene Steuerung mit Pfeiltasten nicht stillschweigend aendern.
- Neue Eingaben nur ergaenzen, wenn gefordert.
- Bei Eingabeaenderungen auf konsistentes `keydown`/`keyup` Verhalten achten.

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

