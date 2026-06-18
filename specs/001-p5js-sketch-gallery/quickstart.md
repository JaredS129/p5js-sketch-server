# Quickstart & Validation: p5.js Sketch Gallery

**Date**: 2026-06-18 | **Feature**: 001-p5js-sketch-gallery

End-to-end validation guide proving the feature works. Run these after implementation.
References: [plan.md](./plan.md), [contracts/](./contracts/), [data-model.md](./data-model.md).

## Prerequisites

- Node.js 22+ and npm (dev machine has Node 26 / npm 11).
- Git installed with a user name configured: `git config user.name` returns a non-empty name.
- Dependencies installed: `npm install`.

## Available scripts (`package.json`)

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the hot-reloadable dev server (Vite) |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build |
| `npm run create-sketch <name>` | Scaffold a new sketch |
| `npm run delete-sketch <name>` | Hard-delete a sketch |
| `npm run update-sketch-meta` | (CI) refresh dateUpdated/lastUpdatedBy from git |
| `npm test` | Run Vitest unit + component tests |

---

## Scenario 1 — Create a sketch (US2 / FR-015–FR-018)

```bash
npm run create-sketch "Flow Field"
```

**Expect**:
- `sketches/flow-field/` exists containing `sketch.ts` and `meta.json`.
- `sketches/flow-field/meta.json` validates against
  [`contracts/sketch-meta.schema.json`](./contracts/sketch-meta.schema.json) with
  `name: "Flow Field"`, `id: "flow-field"`, `createdBy` == your `git config user.name`,
  and `dateUpdated == dateCreated`, `lastUpdatedBy == createdBy`.

**Negative checks**:
- `npm run create-sketch` (no arg) → non-zero exit + usage message, nothing created.
- `npm run create-sketch "Flow Field"` again → non-zero exit "already exists", unchanged.

---

## Scenario 2 — Browse & run from the UI (US1 / FR-001–FR-007)

```bash
npm run dev
# open the printed local URL
```

**Expect**:
- Home screen (`/`) shows a dark-themed, modern table with a **Flow Field** row displaying
  all five fields: name, dateCreated, dateUpdated, createdBy, lastUpdatedBy. (FR-002, FR-003)
- Clicking the row navigates to `/sketch/flow-field`; the sketch starts running
  automatically within ~3s. (FR-004–FR-006, SC-003)
- The sketch page shows the same five metadata fields alongside the running canvas. (FR-007)
- Reloading `/sketch/flow-field` directly re-loads and runs the sketch. (US1 #4)

---

## Scenario 3 — Hot reload stays on the sketch page (US3 / FR-008, SC-004)

With `/sketch/flow-field` open in the browser:

1. Edit `sketches/flow-field/sketch.ts` (e.g. change `p.background(18)` to a different
   value) and save.

**Expect**:
- The running sketch updates within ~3s.
- The browser **stays on `/sketch/flow-field`** — it does NOT navigate back to the home
  screen, and the URL is unchanged. (FR-008)

---

## Scenario 4 — Empty & not-found states (FR-010, FR-011)

- With no sketch folders present, open `/` → a clear empty-state message (not a broken/empty
  table). (FR-010)
- Open `/sketch/does-not-exist` → a clear "sketch not found" state. (FR-011)

---

## Scenario 5 — Delete a sketch (US4 / FR-019–FR-021, SC-006)

```bash
npm run delete-sketch "Flow Field"
```

**Expect**:
- `sketches/flow-field/` no longer exists.
- The UI no longer lists the sketch (refresh `/`).

**Negative checks**:
- `npm run delete-sketch "Nope"` → non-zero exit "not found", nothing deleted.
- `npm run delete-sketch` (no arg) → non-zero exit + usage message.

---

## Scenario 6 — CI metadata refresh (US5 / FR-022–FR-026, SC-007)

Simulate a PR locally:

```bash
# starting from a committed sketch on a feature branch
# 1) make and commit a change to sketch CODE (not meta.json)
#    e.g. edit sketches/flow-field/sketch.ts, then:
git add sketches/flow-field/sketch.ts && git commit -m "tweak flow field"

# 2) run the CI metadata updater against the base branch
npm run update-sketch-meta     # uses base ref env / origin/main fallback
```

**Expect**:
- `sketches/flow-field/meta.json`: `lastUpdatedBy` == the latest sketch-code commit's git
  user name, `dateUpdated` == that commit's date. (FR-024, US5 #3)
- `createdBy` and `dateCreated` are unchanged. (FR-024, US5 #4)
- A sketch whose code was NOT changed in the range is untouched. (FR-026)
- A run where only `meta.json` changed (no real code change) makes no updates. (feedback-loop guard)

**CI**: `.github/workflows/update-sketch-meta.yml` runs this on `pull_request` (full git
history) and commits changed `sketches/**/meta.json` back to the PR branch. (FR-025)

---

## Acceptance roll-up

| Spec item | Validated by |
|-----------|--------------|
| US1 / FR-001–FR-007 | Scenario 2 |
| US2 / FR-015–FR-018 | Scenario 1 |
| US3 / FR-008 | Scenario 3 |
| US4 / FR-019–FR-021 | Scenario 5 |
| US5 / FR-022–FR-026 | Scenario 6 |
| FR-009 (view-only) | No mutation UI exists; Scenarios 2–3 use only navigation |
| FR-010 / FR-011 | Scenario 4 |
| FR-012–FR-014 (file-based meta, fields) | Scenarios 1 & 6 + schema validation |
| SC-003 / SC-004 / SC-006 / SC-007 | Scenarios 2, 3, 5, 6 |

`npm test` covers the unit/component layer (slug, meta I/O + schema, git attribution, table
/ empty / not-found rendering).
