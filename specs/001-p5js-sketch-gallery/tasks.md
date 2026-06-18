---
description: "Task list for p5.js Sketch Gallery & Local Dev Server"
---

# Tasks: p5.js Sketch Gallery & Local Dev Server

**Input**: Design documents from `/specs/001-p5js-sketch-gallery/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: Test tasks ARE included. The feature's research decision D9 and `quickstart.md` (`npm test`) define a Vitest + React Testing Library layer focused on the contract-bearing logic (CLI scripts, slug, meta I/O + schema, git attribution) plus UI smoke tests (table / empty / not-found). This is targeted testing, not full TDD.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths are included in each task

## Path Conventions

Single npm package at repo root (per plan.md "Structure Decision"):
`sketches/` (on-disk store), `src/` (view-only SPA), `scripts/` (CLI tooling), `tests/`, `templates/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and toolchain configuration

- [X] T001 Initialize npm package at repo root: create `package.json` with all required scripts (`dev`, `build`, `preview`, `create-sketch`, `delete-sketch`, `update-sketch-meta`, `test`) wired to Vite and `tsx` per [contracts/cli-scripts.md](./contracts/cli-scripts.md)
- [X] T002 Install dependencies: runtime (`vite`, `react`, `react-dom`, `react-router-dom`, `p5`, `@tanstack/react-table`, `tailwindcss` v4 + `@tailwindcss/vite`, Radix primitives, `clsx`, `zod`) and dev (`typescript`, `tsx`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@types/react`, `@types/react-dom`, `@types/p5`)
- [X] T003 [P] Configure TypeScript in `tsconfig.json` (strict, `moduleResolution: bundler`, `jsx: react-jsx`, include `src`, `scripts`, `tests`)
- [X] T004 [P] Configure Vite in `vite.config.ts` (React plugin, Tailwind v4 plugin, and Vitest config with `jsdom` environment + setup file)
- [X] T005 [P] Create `index.html` entry and `src/theme.css` (Tailwind v4 import + dark-by-default theme tokens at `:root`/`html`) per research D3
- [X] T006 [P] Configure linting/formatting (ESLint + Prettier config files at repo root)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared libraries, types, discovery, and app shell that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 [P] Implement path-resolution helpers in `scripts/lib/paths.ts` (resolve sketches dir, `sketches/<id>/`, `meta.json`, `sketch.ts` paths)
- [X] T008 [P] Implement slug derivation + validation in `scripts/lib/slug.ts` (lowercase, spaces/underscores → `-`, strip non `[a-z0-9-]`, collapse/trim dashes; validate against `^[a-z0-9]+(-[a-z0-9]+)*$`) per [contracts/cli-scripts.md](./contracts/cli-scripts.md) shared conventions
- [X] T009 Implement `SketchMeta` zod schema, inferred TS type, and read/write/validate helpers in `scripts/lib/meta.ts` conforming to [contracts/sketch-meta.schema.json](./contracts/sketch-meta.schema.json) (shared by CLI scripts and UI)
- [X] T010 [P] Implement `getGitUserName()` in `scripts/lib/git.ts` (reads `git config user.name`; throws clear error when unset) per research D8
- [X] T011 [P] Create starter sketch template in `templates/sketch.ts.tmpl` (instance-mode default export `(p: p5) => void`) per [contracts/sketch-module.md](./contracts/sketch-module.md)
- [X] T012 Implement sketch discovery registry in `src/sketches.ts` (`import.meta.glob('/sketches/*/meta.json', { eager: true })` + lazy `import.meta.glob('/sketches/*/sketch.ts')`; validate each meta with the zod schema from T009; surface invalid sketches gracefully) per [data-model.md](./data-model.md) Sketch Registry
- [X] T013 Create app entry `src/main.tsx` and `src/router.tsx` (routes `/`, `/sketch/:id`, `*`) mounting the dark-themed app shell per [contracts/sketch-module.md](./contracts/sketch-module.md) routing contract

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 - Browse and run sketches (Priority: P1) 🎯 MVP

**Goal**: Home table lists every sketch with all five metadata fields; clicking a row routes to `/sketch/:id` where the sketch auto-runs and shows the same metadata; empty and not-found states are handled.

**Independent Test**: With ≥1 sketch present, start `npm run dev`, confirm the table lists the sketch with all five fields, click the row, confirm the URL contains the id and the sketch runs automatically; verify empty-state (no sketches) and not-found (`/sketch/does-not-exist`). Maps to quickstart Scenarios 2 & 4.

### Tests for User Story 1

- [X] T014 [P] [US1] Component test: `SketchTable` renders one row per sketch with all five metadata fields, in `tests/components/SketchTable.test.tsx`
- [X] T015 [P] [US1] Component test: home empty state renders when registry is empty, in `tests/components/EmptyState.test.tsx`
- [X] T016 [P] [US1] Component test: not-found state renders for an unknown id, in `tests/components/NotFoundPage.test.tsx`

### Implementation for User Story 1

- [X] T017 [P] [US1] Implement `src/components/MetaPanel.tsx` rendering the five metadata fields (reused by table cells and the sketch page) (FR-003, FR-007)
- [X] T018 [P] [US1] Implement `src/components/EmptyState.tsx` (FR-010)
- [X] T019 [P] [US1] Implement Radix-based primitives in `src/components/ui/` (e.g. `Button.tsx`) styled with Tailwind per research D3
- [X] T020 [US1] Implement `src/components/SketchTable.tsx` using `@tanstack/react-table` (sortable columns; row click navigates to `/sketch/:id`) (FR-002, FR-003, FR-004, FR-005)
- [X] T021 [US1] Implement `src/components/SketchCanvas.tsx` (lazy-import `sketch.ts` by id from the registry, `new p5(module.default, containerEl)` on mount, `instance.remove()` on unmount; wrap in a React error boundary for runtime isolation) per [contracts/sketch-module.md](./contracts/sketch-module.md) (FR-006, Edge Cases)
- [X] T022 [US1] Implement `src/pages/HomePage.tsx` (renders `SketchTable` from the registry, or `EmptyState` when none) (FR-002, FR-010)
- [X] T023 [US1] Implement `src/pages/SketchPage.tsx` (resolve id from route; render `SketchCanvas` + `MetaPanel`; show not-found when the id is unknown) (FR-006, FR-007, FR-011)
- [X] T024 [P] [US1] Implement `src/pages/NotFoundPage.tsx` for the `*` route (FR-011)

**Checkpoint**: User Story 1 fully functional — the gallery browses, routes, and auto-runs sketches independently. This is the MVP (paired with US2 to populate it).

---

## Phase 4: User Story 2 - Create a new sketch from the command line (Priority: P1)

**Goal**: `npm run create-sketch <name>` scaffolds a sketch folder + `sketch.ts` + `meta.json`, captures `createdBy`/`dateCreated`, and fails cleanly (no mutation) on bad input.

**Independent Test**: Run `npm run create-sketch "Flow Field"`, confirm `sketches/flow-field/{sketch.ts,meta.json}` exist, `meta.json` validates against the schema with correct fields (`createdBy` == git user, `dateUpdated == dateCreated`), and negative cases (no arg, duplicate) fail without mutation. Maps to quickstart Scenario 1.

### Tests for User Story 2

- [X] T025 [P] [US2] Unit tests for `scripts/lib/slug.ts` (slugify rules, invalid/empty input) in `tests/unit/slug.test.ts`
- [X] T026 [P] [US2] Unit tests for `scripts/lib/meta.ts` (write/read round-trip + zod schema validation, rejects malformed) in `tests/unit/meta.test.ts`
- [X] T027 [P] [US2] Test `scripts/create-sketch.ts` behavior (creates folder/files with correct meta; fails no-mutation on missing arg, invalid slug, duplicate, missing git user) in `tests/unit/create-sketch.test.ts`

### Implementation for User Story 2

- [X] T028 [US2] Implement `scripts/create-sketch.ts` per [contracts/cli-scripts.md](./contracts/cli-scripts.md) §1 (slug → exists check → git user → write `sketch.ts` from `templates/sketch.ts.tmpl` + `meta.json` with `dateUpdated==dateCreated`, `lastUpdatedBy==createdBy`; exit codes + error messages per the error table) (FR-015, FR-016, FR-017, FR-018)

**Checkpoint**: US1 + US2 together = a usable MVP — create sketches and browse/run them.

---

## Phase 5: User Story 3 - Hot reload preserves the current view (Priority: P2)

**Goal**: Editing a displayed sketch's code updates it in place while the browser stays on `/sketch/:id` (no revert to home).

**Independent Test**: Open `/sketch/<id>`, edit `sketches/<id>/sketch.ts`, save; confirm the running sketch updates within ~3s and the URL stays on the same sketch. Maps to quickstart Scenario 3.

- [X] T030 [US3] Add HMR-safe lifecycle to `src/components/SketchCanvas.tsx` (handle `import.meta.hot` / re-instantiate p5 on module update via `instance.remove()` + recreate, without unmounting the page) (FR-008)
- [X] T031 [US3] Verify Vite HMR config in `vite.config.ts` so edits under `sketches/*/sketch.ts` hot-update in place and React Router preserves `/sketch/:id` (no full reload to home) (FR-008, SC-004)
- [X] T032 [US3] Validate per quickstart Scenario 3 (edit sketch code → reflected in browser, stays on the same sketch page)

**Checkpoint**: Day-to-day editing workflow works without losing the active sketch view.

---

## Phase 6: User Story 4 - Delete a sketch from the command line (Priority: P2)

**Goal**: `npm run delete-sketch <name>` hard-deletes the sketch folder; the UI no longer lists it; fails cleanly on bad input.

**Independent Test**: With a known sketch present, run `npm run delete-sketch "Flow Field"`, confirm `sketches/flow-field/` is gone and it disappears from the UI; negative cases (missing arg, not found) fail without change. Maps to quickstart Scenario 5.

### Tests for User Story 4

- [X] T033 [P] [US4] Test `scripts/delete-sketch.ts` behavior (removes folder recursively; fails no-mutation on missing arg and non-existent sketch) in `tests/unit/delete-sketch.test.ts`

### Implementation for User Story 4

- [X] T034 [US4] Implement `scripts/delete-sketch.ts` per [contracts/cli-scripts.md](./contracts/cli-scripts.md) §2 (slug → exists check → recursive hard-delete of `sketches/<id>/`; exit codes + messages per the error table) (FR-019, FR-020, FR-021)

**Checkpoint**: Sketches can be created, browsed/run, hot-edited, and deleted.

---

## Phase 7: User Story 5 - Refresh sketch metadata in CI (Priority: P3)

**Goal**: `npm run update-sketch-meta` finds sketches whose code (excluding `meta.json`) changed in the PR commit range, sets `dateUpdated`/`lastUpdatedBy` from the latest such commit (leaving `createdBy`/`dateCreated` intact), writes `meta.json` back, and a CI workflow commits the result to the PR.

**Independent Test**: Commit a change to one sketch's `sketch.ts` on a branch, run `npm run update-sketch-meta`; confirm only that sketch's `dateUpdated`/`lastUpdatedBy` change to the latest commit's author/date, immutable fields are unchanged, and a meta-only change is a no-op. Maps to quickstart Scenario 6.

### Tests for User Story 5

- [X] T035 [P] [US5] Unit tests for git commit-range + per-folder attribution helpers (latest commit author/date excluding `meta.json`) in `tests/unit/git-attribution.test.ts`
- [X] T036 [P] [US5] Test `scripts/update-sketch-meta.ts` behavior (affected sketch updated from latest commit; unaffected untouched; meta-only change → no-op exit 0) in `tests/unit/update-sketch-meta.test.ts`

### Implementation for User Story 5

- [X] T037 [US5] Extend `scripts/lib/git.ts` with commit-range resolution (base ref from CI env / `origin/main` fallback) and per-sketch-folder latest-commit author + date lookup, excluding `meta.json` per research D8 (FR-023, FR-024)
- [X] T038 [US5] Implement `scripts/update-sketch-meta.ts` per [contracts/cli-scripts.md](./contracts/cli-scripts.md) §3 (enumerate sketches → affected detection → update mutable fields → validate + write back; no-change no-op) (FR-022–FR-026)
- [X] T039 [US5] Add `.github/workflows/update-sketch-meta.yml` (on `pull_request`, `fetch-depth: 0`, `npm ci`, `npm run update-sketch-meta`, commit changed `sketches/**/meta.json` back to the PR branch with `contents: write`) per research D10 (FR-025)

**Checkpoint**: All five user stories independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and final quality pass across all stories

- [X] T040 [P] Write `README.md` (scripts, folder convention, dev workflow)
- [X] T041 [P] Seed one example sketch via `npm run create-sketch` for manual validation/demo
- [X] T042 Run full `quickstart.md` validation (Scenarios 1–6) and confirm the acceptance roll-up
- [X] T043 [P] Accessibility + visual pass on the dark theme (contrast, focus states, Radix a11y)
- [X] T044 Run the full test suite (`npm test`) and TypeScript typecheck; fix any failures

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3–7)**: All depend on Foundational completion
  - US1 (P1) and US2 (P1) are the MVP and can proceed in parallel after Foundational
  - US3 (P2) depends on US1's `SketchCanvas` (T021)
  - US4 (P2) and US5 (P3) depend only on Foundational (shared lib)
- **Polish (Phase 8)**: Depends on all targeted stories being complete

### User Story Dependencies

- **US1 (P1)**: Foundational only. No dependency on other stories.
- **US2 (P1)**: Foundational only (uses slug/meta/git libs + template). Independent of US1.
- **US3 (P2)**: Builds on US1 `SketchCanvas.tsx` (T021) — sequence after US1.
- **US4 (P2)**: Foundational only. Independent.
- **US5 (P3)**: Foundational only (extends `git.ts`). Independent.

### Within Each User Story

- Tests are authored alongside implementation (targeted, not strict TDD).
- Foundational libs (T007–T013) before any story task that imports them.
- Components before the pages that compose them (e.g. T020/T018 before T022; T021/T017 before T023).
- A story's CLI script depends on its shared libs (slug/meta/git) from Foundational.

### Parallel Opportunities

- Setup: T003, T004, T005, T006 in parallel.
- Foundational: T007, T008, T010, T011 in parallel; T009 then T012/T013.
- US1: tests T014–T016 in parallel; then T017, T018, T019, T024 in parallel; T020/T021 (then T022/T023).
- US2 tests T025–T027 in parallel before T028.
- US4 (T033→T034) and US5 (T035/T036 → T037→T038→T039) can run in parallel with each other and with US3 once Foundational is done.

---

## Parallel Example: User Story 1

```bash
# Tests for US1 together:
Task: "Component test SketchTable in tests/components/SketchTable.test.tsx"
Task: "Component test EmptyState in tests/components/EmptyState.test.tsx"
Task: "Component test NotFoundPage in tests/components/NotFoundPage.test.tsx"

# Independent components together:
Task: "Implement MetaPanel.tsx"
Task: "Implement EmptyState.tsx"
Task: "Implement ui/ primitives"
Task: "Implement NotFoundPage.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Phase 1: Setup
2. Phase 2: Foundational (CRITICAL — blocks all stories)
3. Phase 3 (US1) + Phase 4 (US2) — browse/run + create
4. **STOP and VALIDATE**: create a sketch, see it listed, click it, watch it run (quickstart Scenarios 1 & 2)

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 + US2 → MVP (create + browse/run)
3. US3 → hot-reload-in-place editing workflow
4. US4 → delete cleanup
5. US5 → CI metadata attribution
6. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks.
- [Story] label maps each task to its user story for traceability.
- The three CLI scripts are the only mutation path (UI is view-only, FR-009) — verify no mutation UI is ever added.
- Per-sketch `meta.json` (no master file) keeps create/delete atomic and CI conflict-free (research D5).
- Commit after each task or logical group; stop at any checkpoint to validate a story independently.
