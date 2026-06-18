# p5.js Sketch Gallery & Local Dev Server

A local, hot-reloadable web app that auto-discovers your p5.js sketches from disk,
lists them in a dark, modern table, and runs any sketch on its own routed page.
The UI is **view-only** — all create/update/delete happens through CLI scripts.
No database: each sketch's metadata lives in a per-sketch `meta.json`.

## Quick start

```bash
npm install
npm run create-sketch "Flow Field"   # scaffold a sketch
npm run dev                          # start the gallery (Vite)
```

Open the printed URL, click a row, and the sketch runs automatically. Edit the
sketch's `sketch.ts` and the browser hot-reloads in place — staying on the same
sketch page.

## Folder convention

```text
sketches/
└── <id>/                # id = kebab-case slug of the name; also the route id
    ├── meta.json        # name, dateCreated, dateUpdated, createdBy, lastUpdatedBy, id
    ├── sketch.ts        # default export: (p: p5) => void  (p5 instance mode)
    └── assets/          # optional
```

Each `sketch.ts` must default-export a p5 **instance-mode** factory (never global mode):

```ts
import type p5 from "p5";
export default function sketch(p: p5) {
  p.setup = () => p.createCanvas(600, 400);
  p.draw = () => p.background(18);
}
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the hot-reloadable dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Serve the production build |
| `npm run create-sketch -- "<name>"` | Scaffold a new sketch (captures `createdBy` from `git config user.name`) |
| `npm run delete-sketch -- "<name>"` | Hard-delete a sketch folder |
| `npm run update-sketch-meta` | (CI) refresh `dateUpdated`/`lastUpdatedBy` from git history |
| `npm test` | Run the Vitest suite |
| `npm run lint` / `npm run typecheck` | Lint / type-check |

> Note the `--` before the name so npm passes the argument through to the script.

## Metadata & git attribution

- `createdBy` / `dateCreated` are captured **once** at create time and are immutable.
- `lastUpdatedBy` / `dateUpdated` are maintained by `update-sketch-meta`, which runs in
  CI on pull requests (`.github/workflows/update-sketch-meta.yml`). It finds the latest
  commit that changed a sketch's code (everything under the folder **except** `meta.json`,
  to avoid a feedback loop) and commits the refreshed `meta.json` back to the PR branch.

## Stack

Vite 6 · React 19 + TypeScript · React Router 7 · Tailwind CSS v4 (dark-by-default) +
Radix primitives · TanStack Table · p5 (instance mode) · zod · CLI via `tsx`.

See [`specs/001-p5js-sketch-gallery/`](./specs/001-p5js-sketch-gallery/) for the full
spec, plan, and contracts.
