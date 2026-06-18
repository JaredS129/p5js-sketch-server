# CLI Contract: Sketch Management Scripts

**Date**: 2026-06-18 | **Feature**: 001-p5js-sketch-gallery

Three npm scripts are the **only** way to mutate sketches (the UI is view-only, FR-009).
All are TypeScript run via `tsx`. Conventions below are the contract that `tasks.md` and the
implementation must honor.

**Shared conventions**

- Exit code `0` = success, non-zero = failure (no partial mutation on failure).
- Human-readable progress to stdout; errors to stderr.
- A "sketch name" argument is the human display name; the **id** is its slug (see
  `slug.ts`): lowercased, spaces/underscores → `-`, non `[a-z0-9-]` stripped, collapsed
  dashes, trimmed of leading/trailing dashes. The id MUST match
  `^[a-z0-9]+(-[a-z0-9]+)*$` and is the folder name + routing id.
- `meta.json` always conforms to [`sketch-meta.schema.json`](./sketch-meta.schema.json).
- "current date" is the local date formatted `YYYY-MM-DD`.

---

## 1. `npm run create-sketch <name>`  (FR-015–FR-018, US2)

Scaffold a new sketch folder, files, and metadata.

**Arguments**

| Arg | Required | Description |
|-----|----------|-------------|
| `<name>` | yes | Display name; may contain spaces. Slugified to the id. |

**Behavior**

1. If `<name>` is missing/empty → exit non-zero with usage message; change nothing. (FR-018)
2. Compute `id = slug(name)`. If the slug is empty/invalid → exit non-zero; change nothing. (Edge: invalid name)
3. If `sketches/<id>/` already exists → exit non-zero ("sketch already exists"); change nothing. (FR-018)
4. Resolve `createdBy` from `git config user.name`. If unset/empty → exit non-zero with a clear message; change nothing. (Edge: no git user)
5. Create `sketches/<id>/`, write:
   - `sketch.ts` from `templates/sketch.ts.tmpl` (a minimal runnable instance-mode sketch).
   - `meta.json` with:
     ```json
     { "id": "<id>", "name": "<trimmed name>",
       "dateCreated": "<today>", "dateUpdated": "<today>",
       "createdBy": "<git user.name>", "lastUpdatedBy": "<git user.name>" }
     ```
6. Print the created path and id. Exit `0`. (FR-016, FR-017 — UI auto-discovers it)

**Postconditions**: New folder discoverable by the UI; `dateUpdated==dateCreated`,
`lastUpdatedBy==createdBy`.

**Example**

```bash
npm run create-sketch "Flow Field"
# creates sketches/flow-field/{sketch.ts,meta.json}; id=flow-field
```

---

## 2. `npm run delete-sketch <name>`  (FR-019–FR-021, US4)

Permanently remove a sketch.

**Arguments**

| Arg | Required | Description |
|-----|----------|-------------|
| `<name>` | yes | Display name or id; slugified to locate the folder. |

**Behavior**

1. If `<name>` missing/empty → exit non-zero with usage message; change nothing. (FR-021)
2. Compute `id = slug(name)`. If `sketches/<id>/` does not exist → exit non-zero ("not found"); change nothing. (FR-021)
3. Hard-delete `sketches/<id>/` recursively (folder + all files incl. `meta.json` and `assets/`). (FR-019, FR-020)
4. Print the removed id. Exit `0`.

**Postconditions**: Folder gone from disk; sketch no longer appears in the UI (no central
index to update). (FR-020, SC-006)

**Example**

```bash
npm run delete-sketch "Flow Field"   # removes sketches/flow-field/
```

---

## 3. `npm run update-sketch-meta`  (FR-022–FR-026, US5)

CI-only. Refresh `dateUpdated` + `lastUpdatedBy` for sketches whose **code** changed in the
PR, and write the updated `meta.json` files back into the repo.

**Arguments**: none. Reads the commit range from the environment.

**Inputs (environment)**

- Base ref / commit range for the PR (e.g. derive `BASE = git merge-base origin/<baseRef>
  HEAD`, range `BASE..HEAD`). The base ref comes from CI env (e.g. `GITHUB_BASE_REF`), with
  a sensible local fallback (e.g. `origin/main`).

**Behavior**

1. Enumerate sketch folders under `sketches/`.
2. For each commit in the range, collect changed file paths. A sketch is **affected** if a
   commit changed any file under `sketches/<id>/` **other than `meta.json`**. (FR-023; meta
   excluded to avoid feedback loop)
3. For each affected sketch, find the **latest** affecting commit and set:
   - `lastUpdatedBy = <that commit's author name>` (git user name). (FR-024, US5 #3)
   - `dateUpdated  = <that commit's author date, YYYY-MM-DD>`. (FR-024)
   - Leave `id`, `name`, `createdBy`, `dateCreated` unchanged. (FR-024, US5 #4)
4. Write changed `meta.json` files back to disk (validating against the schema). (FR-025)
5. If no sketch code changed in the range → make no changes, exit `0`. (FR-026, US5 #2)
6. Print a summary of which sketches were updated. Exit `0`.

**Postconditions**: Affected sketches' `dateUpdated`/`lastUpdatedBy` reflect the latest
folder-touching commit; unaffected sketches and immutable fields untouched. The CI workflow
commits the resulting `meta.json` changes back to the PR branch. (FR-025, SC-007)

**CI wiring** (`.github/workflows/update-sketch-meta.yml`): on `pull_request`, checkout with
full history (`fetch-depth: 0`), `npm ci`, `npm run update-sketch-meta`, then commit & push
any changed `sketches/**/meta.json` back to the PR branch (`contents: write`). Exact
token/commit mechanism is an implementation detail decided in tasks.

---

## Error message expectations (testable)

| Condition | Script | Exit | Message gist |
|-----------|--------|------|--------------|
| No name arg | create/delete | ≠0 | `Usage: npm run <script> <name>` |
| Invalid/empty slug | create | ≠0 | `Invalid sketch name` |
| Already exists | create | ≠0 | `Sketch "<id>" already exists` |
| No git user | create | ≠0 | `git user.name is not configured` |
| Not found | delete | ≠0 | `Sketch "<id>" not found` |
| Nothing changed | update-meta | 0 | `No sketch code changes; nothing to update` |
