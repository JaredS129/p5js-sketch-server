# Implementation Plan: p5.js Sketch Gallery & Local Dev Server

**Branch**: `001-p5js-sketch-gallery` | **Date**: 2026-06-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-p5js-sketch-gallery/spec.md`

## Summary

A local, hot-reloadable web app that auto-discovers p5.js sketches from an on-disk
folder convention and a per-sketch `meta.json`, lists them in a sortable table, and
runs any sketch on its own routed page. The UI is **view-only**; all create/update/delete
happens through three Node CLI scripts (`create-sketch`, `delete-sketch`,
`update-sketch-meta`). No database — metadata lives in per-sketch JSON files that are
auto-discovered at dev/build time.

**Technical approach**: Vite + React + TypeScript single-page app. Sketches live in
`sketches/<id>/` and are discovered with Vite's `import.meta.glob` (eager for metadata,
lazy for sketch code). Vite HMR replaces an edited sketch module in place while React
Router keeps the URL on the same sketch id — satisfying "hot-reload stays on the same
page." UI is dark-themed and modern via Tailwind CSS v4 with a small set of headless
(Radix-based) components. CLI scripts run on Node via `tsx`; `update-sketch-meta` reads
git history to attribute `lastUpdatedBy`/`dateUpdated` and writes per-sketch JSON back
into the repo for CI.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22+ (dev machine runs Node 26, npm 11)

**Primary Dependencies**: Vite 6 (dev server + HMR + build), React 19 + React DOM,
React Router 7 (client routing), p5 (sketch runtime, instance mode), Tailwind CSS v4
(styling/dark theme), `@tanstack/react-table` (sortable table), `clsx` + small Radix UI
primitives for modern accessible components, `tsx` (run TS CLI scripts), `zod` (validate
`meta.json` shape)

**Storage**: File system only — per-sketch `sketches/<id>/meta.json` (no database)

**Testing**: Vitest (unit tests for CLI helpers: slugify, git attribution, meta I/O) +
React Testing Library (component smoke tests for table/empty/not-found states)

**Target Platform**: Local developer machine, modern evergreen browser (Chrome/Firefox/Safari)

**Project Type**: Web application (frontend SPA) + Node CLI tooling, single npm package

**Performance Goals**: Sketch begins running within 3s of row click; HMR reflects a sketch
code edit within 3s while preserving the route; create/delete scripts complete < 5s

**Constraints**: View-only UI (no mutation from browser); no database; metadata must be
git/CI-friendly (no central file that causes merge conflicts across PRs); HMR must not
navigate away from the active sketch page

**Scale/Scope**: Tens to low hundreds of sketches; home table + sketch page + not-found +
empty state; 3 CLI scripts; single-user local usage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution (`.specify/memory/constitution.md`) is an **unpopulated template**
(all placeholder tokens, no ratified principles). There are therefore no enforceable
governance gates to evaluate.

- **Initial gate (pre-Phase 0)**: PASS — no principles defined; no violations possible.
- **Post-design gate (post-Phase 1)**: PASS — design introduces no complexity that any
  defined principle would forbid; stack is intentionally minimal (single package, no DB,
  no backend service). Complexity Tracking table is empty (nothing to justify).

If the constitution is later populated, re-run this gate against the new principles.

## Project Structure

### Documentation (this feature)

```text
specs/001-p5js-sketch-gallery/
├── plan.md              # This file (/speckit-plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (/speckit-plan)
├── data-model.md        # Phase 1 output (/speckit-plan)
├── quickstart.md        # Phase 1 output (/speckit-plan)
├── contracts/           # Phase 1 output (/speckit-plan)
│   ├── cli-scripts.md           # create/delete/update-sketch-meta CLI contracts
│   ├── sketch-meta.schema.json  # JSON Schema for per-sketch meta.json
│   └── sketch-module.md         # Sketch module export + folder-structure contract
├── checklists/
│   └── requirements.md  # Spec quality checklist (/speckit-specify)
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created here)
```

### Source Code (repository root)

```text
sketches/                       # Sketch content (the "database"); auto-discovered
└── <sketch-id>/                # one folder per sketch, id = slug of name
    ├── meta.json               # name, dateCreated, dateUpdated, createdBy, lastUpdatedBy, id
    ├── sketch.ts               # default export: (p: p5) => void  (instance mode)
    └── assets/                 # optional sketch assets

src/                            # The view-only web app
├── main.tsx                    # App entry + router mount
├── router.tsx                  # Routes: "/" (home), "/sketch/:id", "*" (not found)
├── sketches.ts                 # import.meta.glob discovery -> typed sketch registry
├── theme.css                   # Tailwind v4 entry + dark theme tokens
├── components/
│   ├── SketchTable.tsx         # Home table (TanStack Table), row -> /sketch/:id
│   ├── SketchCanvas.tsx        # Mounts p5 instance for a sketch, HMR-safe lifecycle
│   ├── MetaPanel.tsx           # Renders the 5 metadata fields (table cells + panel)
│   ├── EmptyState.tsx          # Home empty state
│   └── ui/                     # Small Radix-based primitives (Button, etc.)
└── pages/
    ├── HomePage.tsx
    ├── SketchPage.tsx
    └── NotFoundPage.tsx

scripts/                        # Node CLI tooling (run via tsx)
├── create-sketch.ts            # npm run create-sketch <name>
├── delete-sketch.ts            # npm run delete-sketch <name>
├── update-sketch-meta.ts       # npm run update-sketch-meta  (CI)
└── lib/
    ├── paths.ts                # resolve sketches dir / sketch paths
    ├── slug.ts                 # name -> id slug + validation
    ├── meta.ts                 # read/write/validate meta.json (zod)
    └── git.ts                  # git user name, commit range, per-path attribution

tests/
├── unit/                       # Vitest: slug, meta, git attribution
└── components/                 # RTL: table/empty/not-found smoke tests

templates/
└── sketch.ts.tmpl             # starter sketch used by create-sketch

index.html                      # Vite entry HTML
vite.config.ts
tsconfig.json
package.json                    # scripts: dev, build, preview, create-sketch, delete-sketch, update-sketch-meta, test
.github/workflows/update-sketch-meta.yml   # CI job that runs update-sketch-meta on PRs
```

**Structure Decision**: Single npm package combining a Vite/React SPA (`src/`), the
on-disk sketch store (`sketches/`), and Node CLI tooling (`scripts/`). This matches the
spec's hard constraints (file-based metadata, view-only UI, three named npm scripts) and
keeps everything in one repo so `import.meta.glob` can discover sketches and CI can edit
the same files. No backend service is needed — Vite serves the app and the sketch files
directly.

## Complexity Tracking

> No constitution principles are defined, so there are no violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | —          | —                                   |
