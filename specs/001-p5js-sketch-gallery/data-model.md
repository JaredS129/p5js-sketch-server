# Phase 1 Data Model: p5.js Sketch Gallery

**Date**: 2026-06-18 | **Feature**: 001-p5js-sketch-gallery

No database. The "data layer" is the file system: each sketch is a folder under
`sketches/`, and its metadata is a per-sketch `meta.json`. The UI builds its in-memory
model by discovering these files at dev/build time.

---

## Entity: Sketch (on-disk folder)

A single p5.js sketch. Identified by its folder name, which is the `id`.

| Field / Part | Type | Description | Source of truth |
|--------------|------|-------------|-----------------|
| `id` | string (slug) | Folder name; URL-safe; stable routing id | folder name == `meta.json.id` |
| `meta.json` | file | The Sketch Metadata record (below) | written by CLI scripts |
| `sketch.ts` | file | p5 sketch module, `export default (p: p5) => void` | authored by developer |
| `assets/` | dir (optional) | Static assets the sketch loads | authored by developer |

**Folder layout**

```text
sketches/
└── <id>/
    ├── meta.json        # required
    ├── sketch.ts        # required ("sketch code")
    └── assets/          # optional
```

**Definition of "sketch code"** (used by `update-sketch-meta`): every file in
`sketches/<id>/` **except** `meta.json`. Changes to `meta.json` do NOT count as a sketch
code change (prevents the metadata-writer feedback loop).

---

## Entity: Sketch Metadata (`meta.json`)

The descriptive record displayed in both the table row (FR-003) and the sketch page
(FR-007). Authoritative JSON Schema: [`contracts/sketch-meta.schema.json`](./contracts/sketch-meta.schema.json).

| Field | Type | Required | Written/owned by | Mutable after create? | Description |
|-------|------|----------|------------------|-----------------------|-------------|
| `id` | string | yes | create-sketch | no | Slug; equals folder name; routing key |
| `name` | string | yes | create-sketch | no | Human-friendly display name (original input) |
| `dateCreated` | string (ISO 8601 date) | yes | create-sketch | no | Date the sketch was created |
| `dateUpdated` | string (ISO 8601 date) | yes | create-sketch, then update-sketch-meta | yes | Date of latest relevant commit |
| `createdBy` | string | yes | create-sketch (`git config user.name`) | no | Creator's git user name |
| `lastUpdatedBy` | string | yes | create-sketch, then update-sketch-meta | yes | Git user name of latest relevant commit |

**Example**

```json
{
  "id": "flow-field",
  "name": "Flow Field",
  "dateCreated": "2026-06-18",
  "dateUpdated": "2026-06-18",
  "createdBy": "Jared Stevenson",
  "lastUpdatedBy": "Jared Stevenson"
}
```

### Validation rules

- `id` MUST match `^[a-z0-9]+(-[a-z0-9]+)*$` (lowercase kebab slug) and MUST equal the
  containing folder name. (FR-005, FR-018)
- `name` MUST be non-empty after trimming. (FR-016)
- `dateCreated`, `dateUpdated` MUST be ISO 8601 dates (`YYYY-MM-DD`).
- `createdBy`, `lastUpdatedBy` MUST be non-empty strings.
- On create: `dateUpdated == dateCreated` and `lastUpdatedBy == createdBy`. (FR-016, Edge Cases)
- A folder under `sketches/` whose `meta.json` is missing or fails validation is surfaced
  by the UI as an inconsistent/invalid sketch rather than crashing the app. (Edge Cases)

### Lifecycle / state transitions

```text
(absent)
   │  create-sketch <name>
   ▼
CREATED            id, name, dateCreated, createdBy set;
                   dateUpdated=dateCreated, lastUpdatedBy=createdBy
   │  developer edits sketch code + commits in a PR; CI runs update-sketch-meta
   ▼
UPDATED            dateUpdated + lastUpdatedBy refreshed from latest folder commit;
                   id, name, dateCreated, createdBy UNCHANGED        (repeatable)
   │  delete-sketch <name|id>
   ▼
(absent)           folder + meta.json hard-deleted
```

Invariants across all transitions:
- `createdBy` and `dateCreated` never change after CREATED. (FR-024, US5 #4)
- `id` never changes (rename = delete + create).
- UI list always reflects exactly the folders present on disk (no central index to drift). (FR-012, SC-005)

---

## Entity: Sketch Registry (in-memory, UI only)

Built at runtime by the UI from `import.meta.glob` over `sketches/*/meta.json`. Not
persisted.

| Part | Type | Description |
|------|------|-------------|
| `sketches` | `SketchMeta[]` | All validated metadata records, for the home table |
| lookup | `Record<id, SketchMeta>` | id → metadata, for the sketch page + not-found check |
| code loader | `Record<id, () => Promise<module>>` | lazy import of each `sketch.ts` |

Derived/sorting concerns (table sort, default order) operate on this in-memory list; they
do not change on-disk data (view-only, FR-009).

---

## Relationships

- One **Sketch** folder ↔ exactly one **Sketch Metadata** (`meta.json`) ↔ exactly one
  routable id.
- The **Sketch Registry** aggregates 0..N Sketch Metadata records (0 → empty state, FR-010).
- CLI scripts are the only writers of Sketch / Sketch Metadata; the UI is a read-only
  consumer (FR-009).
