# Sketch-Book

A local, hot-reloadable web app for building and browsing creative coding sketches.
Supports **p5**, **q5**, **p5play**, and **q5play** — each sketch runs on its own routed
page. Create, edit, duplicate, and delete sketches directly in the browser. No database:
each sketch's metadata lives in a per-sketch `meta.json`.

## Quick start

```bash
npm install
npm run dev   # start the gallery (Vite)
```

Open the printed URL. Use the **New Sketch** button in the gallery to create your first
sketch, pick a renderer, and start editing. The browser hot-reloads in place while you
work — staying on the same sketch page.

## Folder convention

```text
sketches/
└── <id>/                # id = kebab-case slug of the name; also the route id
    ├── meta.json        # name, type, tags, dates, authors
    ├── sketch.ts        # default export: factory function (see below)
    └── assets/          # optional
```

`meta.json` fields:

| Field | Description |
|-------|-------------|
| `id` | URL-safe slug — matches the folder name and route |
| `name` | Human-friendly display name |
| `type` | `"p5"` · `"q5"` · `"p5play"` · `"q5play"` (default `"p5"`) |
| `tags` | Array of lowercase single-word strings (optional) |
| `dateCreated` / `createdBy` | Set at creation time, immutable |
| `dateUpdated` / `lastUpdatedBy` | Updated on every save via the UI |

## Writing sketches

**p5 / p5play** — instance-mode factory:

```ts
import type p5 from "p5";
export default function sketch(p: p5) {
  p.setup = () => p.createCanvas(600, 400);
  p.draw = () => p.background(18);
}
```

**q5 / q5play** — same shape, different instance type:

```ts
import "q5";
export default function sketch(q: Q5) {
  q.setup = async () => { await q.Canvas(600, 400); };
  q.draw = () => q.background(18);
}
```

## Gallery features

- **Name search** — live substring filter, case-insensitive
- **Type filter** — multi-select (p5 / q5 / p5play / q5play)
- **Tag filter** — autocomplete, AND logic across selected tags
- **Author filter** — multi-select
- **Actions** — duplicate, edit, or delete any sketch from the row; clear all filters with one button

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the hot-reloadable dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Serve the production build |
| `npm test` | Run the Vitest suite |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type-check only |

## Stack

Vite 6 · React 19 + TypeScript · React Router 7 · Tailwind CSS v4 (dark-by-default) ·
Radix UI primitives · TanStack Table · p5 (instance mode) · q5 + q5play · zod · `tsx`
