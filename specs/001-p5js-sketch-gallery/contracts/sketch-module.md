# Contract: Sketch Module & Folder Structure

**Date**: 2026-06-18 | **Feature**: 001-p5js-sketch-gallery

Defines the contract between authored sketch files and the view-only UI that discovers and
runs them. Honoring this contract is what lets a sketch be listed, routed to, auto-run, and
hot-reloaded in place.

---

## Folder structure (discovery contract)

```text
sketches/
└── <id>/
    ├── meta.json     # required — see sketch-meta.schema.json
    ├── sketch.ts     # required — the sketch module (this contract)
    └── assets/       # optional — static files the sketch loads
```

- `<id>` is a kebab-case slug and is the routing id (`/sketch/<id>`).
- The UI discovers sketches with Vite globs (no central registry):
  - metadata: `import.meta.glob('/sketches/*/meta.json', { eager: true })`
  - code (lazy): `import.meta.glob('/sketches/*/sketch.ts')`
- A folder missing `meta.json` or `sketch.ts`, or with an invalid `meta.json`, is treated
  as an invalid sketch and surfaced gracefully (not crashing the app). (FR-011, Edge Cases)

---

## Sketch module contract (`sketch.ts`)

Each `sketch.ts` MUST default-export a p5 **instance-mode** factory:

```ts
import type p5 from "p5";

// The default export receives a p5 instance. Attach setup/draw (and optional
// preload, windowResized, etc.) to `p`. Do NOT use p5 global mode.
export default function sketch(p: p5): void {
  p.setup = () => {
    p.createCanvas(600, 400);
  };
  p.draw = () => {
    p.background(18);            // dark canvas to match the dark UI
    p.circle(p.mouseX, p.mouseY, 40);
  };
}
```

**Requirements**

- MUST be the **default export** and a function `(p: p5) => void`.
- MUST use **instance mode** (attach to `p`), never global p5 functions — multiple sketches
  share one app; global mode collides. (research D6)
- MAY define any p5 lifecycle hooks on `p` (`preload`, `setup`, `draw`, `windowResized`, …).
- SHOULD create its canvas in `setup`; the host mounts it into the sketch page container.
- Assets SHOULD be referenced relative to the sketch folder (loaded via p5 in `preload`).

**Host responsibilities (UI side, `SketchCanvas.tsx`)** — informative, not authored per
sketch:

- On mount / id change: lazily import `sketches/<id>/sketch.ts`, then
  `new p5(module.default, containerEl)`.
- On unmount / before re-creating (HMR or route change): call `instance.remove()` to tear
  down the canvas and stop the draw loop (no leaks/duplicates).
- Wrap the canvas in a React error boundary so a sketch that throws fails in isolation and
  does not break the home table or other sketches. (Edge Cases)
- Auto-run is implicit: mounting creates the instance, which starts the loop. (FR-006)

---

## Routing contract (UI)

| Route | View | Notes |
|-------|------|-------|
| `/` | Home table of all sketches | empty state when none (FR-010) |
| `/sketch/:id` | Runs the sketch + shows its 5 metadata fields | unknown id → not-found (FR-011) |
| `*` | Not found | |

- The id in the URL is the source of truth for which sketch is shown; HMR keeps the URL, so
  the same sketch stays mounted across hot reloads. (FR-008, US3)
- Direct navigation/reload to `/sketch/:id` loads and runs that sketch. (US1 #4)
