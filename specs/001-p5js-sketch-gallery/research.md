# Phase 0 Research: p5.js Sketch Gallery & Local Dev Server

**Date**: 2026-06-18 | **Feature**: 001-p5js-sketch-gallery

This document resolves the open technical questions and records the rationale for each
stack/architecture decision. There were no `NEEDS CLARIFICATION` markers in the spec; the
user's only directive for planning was: *"Use a UI framework that is easily maintainable
and make the UI dark mode themed. it needs to look modern."*

---

## D1. Dev server & hot-reload mechanism

- **Decision**: **Vite 6** as dev server, bundler, and HMR provider.
- **Rationale**: Vite's HMR replaces edited modules in place without a full page reload, so
  an open sketch page stays mounted and the route is untouched (directly satisfies FR-008 /
  US3). Even on a forced full reload, the SPA router restores the route from the URL. Vite
  has first-class `import.meta.glob` for file-convention auto-discovery (FR-012) and is the
  current mainstream, low-maintenance choice with minimal config.
- **Alternatives considered**:
  - *webpack + dev-server*: heavier config, slower HMR, more maintenance — rejected.
  - *Custom Node/Express + chokidar + websockets*: re-implements what Vite gives free;
    more code to own — rejected.
  - *Parcel*: zero-config but smaller ecosystem and weaker glob/import story — rejected.

## D2. UI framework ("easily maintainable")

- **Decision**: **React 19 + TypeScript**.
- **Rationale**: Largest ecosystem and talent pool → "easily maintainable" in the practical
  sense (docs, components, longevity). TypeScript catches contract drift between the CLI
  scripts' `meta.json` output and the UI's consumption. Pairs natively with Vite.
- **Alternatives considered**:
  - *Svelte/SvelteKit*: less boilerplate, but smaller ecosystem and a full meta-framework
    is overkill for a local view-only SPA — rejected.
  - *Vue 3*: viable and maintainable; React chosen for ecosystem breadth and component
    libraries for the "modern" look — close second.
  - *Vanilla TS*: lowest deps but we'd hand-roll routing/table/state — higher long-term
    maintenance — rejected.

## D3. Styling & "modern, dark-mode" look

- **Decision**: **Tailwind CSS v4** with a dark theme applied by default (root sets the
  dark palette), plus a few **Radix UI** primitives for accessible interactive components.
- **Rationale**: Tailwind is low-maintenance (utility classes, no bespoke CSS system to
  own) and makes a consistent modern dark aesthetic easy via design tokens. Dark mode is
  the default (not a toggle) per the request — set dark tokens at `:root`/`html`. Radix
  supplies unstyled, accessible primitives we style with Tailwind for a clean modern feel
  without adopting a heavy component framework.
- **Alternatives considered**:
  - *Mantine / Chakra / MUI*: batteries-included with built-in dark mode, but heavier and
    more opinionated; harder to make look distinctively "modern" without fighting defaults
    — rejected in favor of Tailwind + Radix flexibility.
  - *Plain CSS / CSS Modules*: more code to maintain for theming consistency — rejected.
- **Note**: Dark mode is implemented as the single default theme; a light theme is out of
  scope (not requested).

## D4. Routing (addressable sketch ids, HMR-safe)

- **Decision**: **React Router 7** with routes `/` (home), `/sketch/:id`, `*` (not found).
- **Rationale**: Standard client-side routing → sketches addressable by id (FR-005),
  direct navigation/reload to a sketch URL works (US1 #4), and HMR preserves the route. A
  `*` route gives the "sketch not found" state (FR-011).
- **Alternatives considered**: TanStack Router (great types, smaller adoption — close
  second); hand-rolled History API routing (more to maintain) — rejected.

## D5. Sketch discovery & metadata storage (resolves the spec's open question)

- **Decision**: **Per-sketch `meta.json`** (one JSON file inside each sketch folder),
  auto-discovered with `import.meta.glob('/sketches/*/meta.json', { eager: true })`. **No
  master/central JSON file.**
- **Rationale**: The spec explicitly left "single master JSON vs per-sketch JSON"
  undecided. Per-sketch wins decisively for this design:
  1. **CI-safe (FR-022–FR-025)**: `update-sketch-meta` and concurrent PRs each touch only
     their own sketch's file → no merge conflicts on a shared file.
  2. **Atomic create/delete (FR-015–FR-021)**: `create-sketch` writes one folder;
     `delete-sketch` hard-removes one folder — no central index to keep in sync.
  3. **Zero drift**: `import.meta.glob` is the source of truth; there's no master file to
     fall out of sync with the folders on disk (FR-012, FR-017, FR-020).
- **Alternatives considered**:
  - *Single master `sketches.json`*: one read for the UI, but every create/delete/CI run
    rewrites it → constant merge conflicts in PRs and a sync-vs-folders failure mode —
    rejected.
  - *Derive everything from git at request time*: no JSON at all, but slow, couples UI to a
    git binary, and breaks the "uncommitted new sketch" case — rejected.

## D6. Running p5.js sketches (instance mode + HMR lifecycle)

- **Decision**: Each `sketches/<id>/sketch.ts` **default-exports** a function
  `(p: p5) => void` using p5 **instance mode**. `SketchCanvas.tsx` lazily imports the
  module by id (`import.meta.glob('/sketches/*/sketch.ts')`), creates `new p5(factory, el)`
  on mount, and calls `instance.remove()` on unmount / before re-creating on HMR.
- **Rationale**: Instance mode avoids p5 global-namespace collisions (multiple sketches in
  one app) and gives a clean teardown hook so HMR can swap the sketch without leaking
  canvases or duplicating loops. Lazy glob import means only the viewed sketch's code loads.
- **Alternatives considered**:
  - *p5 global mode*: pollutes window, can't host >1 sketch cleanly — rejected.
  - *iframe per sketch (separate static server)*: stronger isolation but weaker HMR
    integration, more moving parts, harder metadata wiring — rejected (revisit only if
    sketch crashes prove to need hard isolation; FR error-isolation handled via React error
    boundary instead).

## D7. CLI scripts runtime

- **Decision**: Write the three scripts in **TypeScript, run with `tsx`**, wired as
  `package.json` scripts: `create-sketch`, `delete-sketch`, `update-sketch-meta`.
- **Rationale**: One language across UI and tooling; shared types for `meta.json` (zod
  schema) prevent UI/script drift; `tsx` runs TS directly with no build step. Matches the
  exact command names required by the spec (FR-015, FR-019, FR-022).
- **Alternatives considered**: plain Node `.js` (loses shared types); shell scripts (poor
  JSON/cross-platform handling) — rejected.

## D8. Git attribution (createdBy / lastUpdatedBy / dateUpdated)

- **Decision**:
  - `createdBy` + `dateCreated`: set **once** by `create-sketch` from `git config user.name`
    and the current date (no commit exists yet at creation).
  - `lastUpdatedBy` + `dateUpdated`: maintained by `update-sketch-meta` from the **latest
    commit in the PR range that changed files in the sketch folder, excluding `meta.json`**.
- **Rationale**: A new sketch has no commit, so first-commit author can't be read at create
  time — capturing the local git user is the faithful default (Edge Cases, Assumptions).
  Excluding `meta.json` from "sketch code change" prevents a feedback loop where the meta
  writer re-triggers itself. Commit range comes from CI env (e.g. `git merge-base
  origin/<base> HEAD`..HEAD).
- **Alternatives considered**:
  - *Recompute `createdBy` from first commit in CI too*: would overwrite the legitimate
    creator on history rewrites/squashes and contradicts the create-time capture — rejected
    (createdBy is immutable after creation, per spec assumptions).
  - *Use commit author email/login*: spec asks for git user **name** — use name; email out
    of scope.

## D9. Testing approach

- **Decision**: **Vitest** for unit tests of `scripts/lib/*` (slugify, meta read/write +
  zod validation, git attribution parsing) and **React Testing Library** for component
  smoke tests (table renders rows, empty state, not-found). Not full TDD (no constitution
  mandate); focus tests on the contract-bearing logic (CLI + meta schema).
- **Rationale**: The risk-bearing logic is the CLI/metadata/git layer (it mutates the repo
  and feeds the UI). Smoke tests guard the key UI states from the spec.
- **Alternatives considered**: Jest (slower with Vite/ESM); Playwright e2e (valuable but
  heavier — defer to a later iteration; quickstart.md covers manual e2e validation).

## D10. CI integration for `update-sketch-meta`

- **Decision**: A GitHub Actions workflow on `pull_request` that runs
  `npm run update-sketch-meta` and commits any changed `meta.json` files back to the PR
  branch.
- **Rationale**: Fulfills FR-022/FR-025 ("runs in CI", "write back into the repo"). Per-
  sketch files keep these auto-commits conflict-free.
- **Open implementation detail for tasks**: exact commit-back mechanism (bot token vs
  `GITHUB_TOKEN` with `contents: write`) — decided during implementation; does not affect
  the script's contract.

---

## Resolved unknowns summary

| Topic | Resolution |
|-------|------------|
| UI framework | React 19 + TypeScript |
| Dev/HMR | Vite 6 (HMR keeps route; `import.meta.glob` discovery) |
| Styling/theme | Tailwind v4, dark-by-default, Radix primitives |
| Routing | React Router 7 (`/`, `/sketch/:id`, `*`) |
| Metadata storage (spec's open Q) | **Per-sketch `meta.json`**, no master file |
| Sketch runtime | p5 instance mode, default-export `(p)=>void`, lazy glob import |
| CLI runtime | TypeScript via `tsx` |
| Git attribution | createdBy@create; lastUpdatedBy/dateUpdated@CI from folder commits (excl. meta.json) |
| Testing | Vitest + React Testing Library |
| CI | GitHub Actions on `pull_request`, commit meta back |

All planning unknowns are resolved. Proceed to Phase 1 design artifacts.
