<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/001-p5js-sketch-gallery/plan.md`

Active feature: **p5.js Sketch Gallery & Local Dev Server** (`001-p5js-sketch-gallery`)
Stack: Vite 6 + React 19 + TypeScript, React Router 7, Tailwind v4 (dark-by-default) +
Radix primitives, p5 (instance mode), TanStack Table, zod. CLI tooling via `tsx`.
Data: per-sketch `sketches/<id>/meta.json` (no database), auto-discovered with
`import.meta.glob`. UI is view-only; mutations only via `create-sketch` / `delete-sketch`
/ `update-sketch-meta` npm scripts. See plan.md, data-model.md, and contracts/.
<!-- SPECKIT END -->
