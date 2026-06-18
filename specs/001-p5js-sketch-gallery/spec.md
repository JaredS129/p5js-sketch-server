# Feature Specification: p5.js Sketch Gallery & Local Dev Server

**Feature Branch**: `001-p5js-sketch-gallery`

**Created**: 2026-06-18

**Status**: Draft

**Input**: User description: "I want to create a local dev server that is hot-reloadable where I can store all of my p5js sketches. The UI needs to have a home screen that lists all of the sketches in a table, and once a row is clicked, the sketch is open and automatically run. If the UI is displaying a sketch, hot-reloading needs to stay on the same page and not revert back to the home screen. The UI should be a web app with routing so sketches can be accessed by id. Each sketch needs to have information about it captured and displayed both in it's table row and it's sketch screen. the information per sketch will be: [name, dateCreated, dateUpdated, createdBy, lastUpdatedBy]. The 'createdBy' and 'lastUpdatedBy' should be the git users name related to the first commit relating to the sketch and the latest commit relating to the sketch respectively. I do not want to achieve this with any kind of database, so creation and updating of sketches should only be done outside of the UI, the UI should be for viewing only. Implement this by creating custom npm scripts for creating a new sketch 'npm run create-sketch {sketchName}' for creating a new sketch and 'npm run update-sketch-meta' that updates the dateUpdated and lastUpdatedBy values of all sketches (this script would only run in ci). also add a delete script 'npm run delete-sketch {sketchName}'. The UI will build the table and data by relying on a specific folder structure and json file holding the metadata. for example, when a user runs create-sketch, the script will create all the necessary files and folders and update the json, it will also retrieve the users git user name for the meta data. the delete-sketch script should hard delete it's files and folders. I'm not sure if a single master json file holding the metadata or a single json file for each sketch would be better. Since the update-sketch-meta will run in ci in PRs, it can simply look at the new commits for that PR, see which ones relate to sketch code, and update the meta data accordingly, this script will need to be able to change the actual repo code to make this work."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and run sketches (Priority: P1)

A developer opens the local dev server in a browser and sees a home screen listing every sketch in a table, each row showing the sketch's name and its metadata. Clicking a row navigates to that sketch's own page (addressable by a stable id in the URL) where the sketch is loaded and runs automatically, with the same metadata displayed alongside it.

**Why this priority**: This is the core purpose of the product — viewing and running stored sketches. Without it there is no usable application.

**Independent Test**: With at least one sketch present in the folder structure, start the dev server, confirm the home table lists the sketch with all metadata fields, click the row, and confirm the sketch page opens at a URL containing the sketch id and the sketch runs automatically.

**Acceptance Scenarios**:

1. **Given** one or more sketches exist, **When** the developer opens the home screen, **Then** a table lists every sketch with its name, dateCreated, dateUpdated, createdBy, and lastUpdatedBy.
2. **Given** the home screen is displayed, **When** the developer clicks a sketch row, **Then** the app navigates to a URL containing that sketch's id and the sketch begins running automatically without further action.
3. **Given** a sketch page is open, **When** the developer views it, **Then** the same five metadata fields for that sketch are displayed alongside the running sketch.
4. **Given** a sketch page URL, **When** the developer navigates directly to that URL (e.g. reload or shared link), **Then** the correct sketch loads and runs.
5. **Given** no sketches exist, **When** the developer opens the home screen, **Then** an empty-state message is shown instead of an empty or broken table.

---

### User Story 2 - Create a new sketch from the command line (Priority: P1)

A developer runs `npm run create-sketch {sketchName}` to scaffold a new sketch. The script creates all required files and folders following the expected structure, records the sketch metadata (capturing the local git user name as `createdBy` and the current date as `dateCreated`), and makes the sketch immediately discoverable by the UI.

**Why this priority**: The UI is view-only; creation is the only supported way to add content. Without it the gallery cannot be populated and the rest of the product has nothing to display.

**Independent Test**: Run `npm run create-sketch my-sketch`, confirm the expected folder/file structure is created, confirm the metadata records the correct name, dateCreated, and createdBy (matching the local git user), and confirm the sketch appears in the UI's table.

**Acceptance Scenarios**:

1. **Given** a unique sketch name, **When** the developer runs `npm run create-sketch {sketchName}`, **Then** the script creates the sketch's folder and starter files and records its metadata.
2. **Given** the script runs, **When** metadata is recorded, **Then** `createdBy` is set to the local git user name, `dateCreated` is set to the current date, and `dateUpdated`/`lastUpdatedBy` are initialized consistently.
3. **Given** a sketch with the same name already exists, **When** the developer runs `create-sketch` with that name, **Then** the script fails with a clear message and does not overwrite or corrupt the existing sketch.
4. **Given** no sketch name argument is provided, **When** the developer runs `create-sketch`, **Then** the script fails with a usage message.

---

### User Story 3 - Hot reload preserves the current view (Priority: P2)

While viewing and running a specific sketch, the developer edits that sketch's code on disk. The browser hot-reloads to reflect the change but stays on the same sketch page rather than reverting to the home screen.

**Why this priority**: This is the primary day-to-day editing workflow. A reload that bounces to the home screen would make iterative development frustrating, but the gallery is still usable for viewing without it.

**Independent Test**: Open a sketch page, edit the sketch's source file, save, and confirm the running sketch updates while the URL/page remains on the same sketch.

**Acceptance Scenarios**:

1. **Given** a sketch page is open and running, **When** the developer saves an edit to that sketch's code, **Then** the change is reflected in the browser without a full navigation back to the home screen.
2. **Given** a sketch page is open, **When** a hot reload occurs, **Then** the URL still points to the same sketch id.

---

### User Story 4 - Delete a sketch from the command line (Priority: P2)

A developer runs `npm run delete-sketch {sketchName}` to permanently remove a sketch. The script hard-deletes the sketch's files and folders and removes its metadata so it no longer appears in the UI.

**Why this priority**: Cleanup of unwanted sketches keeps the gallery maintainable, but it is not required to demonstrate core value.

**Independent Test**: With a known sketch present, run `npm run delete-sketch {sketchName}`, confirm the sketch's files/folders are gone, its metadata is removed, and it no longer appears in the UI.

**Acceptance Scenarios**:

1. **Given** an existing sketch, **When** the developer runs `npm run delete-sketch {sketchName}`, **Then** all of that sketch's files and folders are permanently removed and its metadata entry is removed.
2. **Given** a sketch name that does not exist, **When** the developer runs `delete-sketch` with that name, **Then** the script fails with a clear message and changes nothing.
3. **Given** no sketch name argument is provided, **When** the developer runs `delete-sketch`, **Then** the script fails with a usage message.

---

### User Story 5 - Refresh sketch metadata in CI (Priority: P3)

In a pull request, an automated CI step runs `npm run update-sketch-meta`. The script inspects the PR's new commits, determines which commits changed sketch code, and updates the affected sketches' `dateUpdated` and `lastUpdatedBy` values to reflect the latest relevant commit, writing those changes back into the repository.

**Why this priority**: Keeps "last updated" attribution accurate over time, but the gallery functions and displays initial metadata without it.

**Independent Test**: Simulate a PR containing a commit that modifies one sketch's code, run `npm run update-sketch-meta`, and confirm only that sketch's `dateUpdated` and `lastUpdatedBy` are updated to match the latest relevant commit, while unrelated sketches are untouched.

**Acceptance Scenarios**:

1. **Given** a PR with commits that modify one or more sketches' code, **When** `update-sketch-meta` runs, **Then** each affected sketch's `dateUpdated` and `lastUpdatedBy` are updated from the latest commit that touched that sketch, and the changes are written back into the repo.
2. **Given** a PR whose commits do not touch any sketch code, **When** `update-sketch-meta` runs, **Then** no metadata is changed.
3. **Given** a sketch was modified by a commit, **When** `lastUpdatedBy` is computed, **Then** it equals the git user name of the latest commit that changed that sketch's code.
4. **Given** metadata updates were applied, **When** the script finishes, **Then** `createdBy` and `dateCreated` for existing sketches remain unchanged.

---

### Edge Cases

- **Newly created, not-yet-committed sketch**: At creation time there is no commit, so `createdBy` is taken from the local git user configuration and `dateUpdated`/`lastUpdatedBy` mirror the creation values until a later commit is reconciled by `update-sketch-meta`.
- **Direct navigation to an unknown sketch id**: The app shows a clear "sketch not found" state rather than a blank screen or error.
- **Sketch runtime error**: A sketch whose code throws at runtime fails in isolation (shown on that sketch's page) without breaking the home screen or other sketches.
- **Invalid or unsafe sketch name** (e.g. characters not valid for folder names or URL ids): `create-sketch` rejects it with a clear message.
- **Manual edits / inconsistent metadata**: If a sketch folder exists without valid metadata (or vice versa), the UI surfaces the inconsistency gracefully rather than crashing.
- **No git user configured**: `create-sketch` reports a clear message when it cannot determine the local git user name.
- **Sketch with no qualifying commits in CI**: `update-sketch-meta` leaves that sketch's metadata unchanged.

## Requirements *(mandatory)*

### Functional Requirements

#### Viewing UI

- **FR-001**: The system MUST provide a local, hot-reloadable web application served from a local dev server.
- **FR-002**: The home screen MUST display all sketches in a table, with one row per sketch.
- **FR-003**: Each table row MUST display the sketch's `name`, `dateCreated`, `dateUpdated`, `createdBy`, and `lastUpdatedBy`.
- **FR-004**: Clicking a sketch row MUST navigate to a dedicated page for that sketch.
- **FR-005**: Sketches MUST be addressable by a stable id via client-side routing, such that a given sketch's page has a consistent URL.
- **FR-006**: When a sketch page opens, the sketch MUST load and run automatically without additional user action.
- **FR-007**: A sketch page MUST display the same five metadata fields (`name`, `dateCreated`, `dateUpdated`, `createdBy`, `lastUpdatedBy`) for that sketch alongside the running sketch.
- **FR-008**: While a sketch page is displayed, a hot reload MUST keep the user on that same sketch page (same sketch id) and MUST NOT revert to the home screen.
- **FR-009**: The UI MUST be view-only; it MUST NOT provide any means to create, edit, or delete sketches or their metadata.
- **FR-010**: The home screen MUST show a clear empty state when no sketches exist.
- **FR-011**: Navigating directly to a sketch id that does not exist MUST show a clear "not found" state.

#### Data & metadata source

- **FR-012**: The UI MUST derive the sketch list and all displayed metadata from a defined on-disk folder structure and JSON metadata file(s); no database may be used.
- **FR-013**: Each sketch MUST have the metadata fields: `name`, `dateCreated`, `dateUpdated`, `createdBy`, and `lastUpdatedBy`.
- **FR-014**: `createdBy` MUST represent the git user associated with the sketch's first relevant commit; `lastUpdatedBy` MUST represent the git user associated with the sketch's latest relevant commit (with creation-time defaults as described in Edge Cases until reconciled).

#### Create sketch script

- **FR-015**: The system MUST provide a command `npm run create-sketch {sketchName}` that scaffolds a new sketch's required files and folders following the defined structure.
- **FR-016**: `create-sketch` MUST record the new sketch's metadata, setting `name` from the provided name, `dateCreated` to the current date, and `createdBy` to the local git user name.
- **FR-017**: `create-sketch` MUST make the new sketch immediately discoverable by the UI (appears in the table and is routable).
- **FR-018**: `create-sketch` MUST fail without modifying anything if the sketch name is missing, invalid, or already in use.

#### Delete sketch script

- **FR-019**: The system MUST provide a command `npm run delete-sketch {sketchName}` that hard-deletes the named sketch's files and folders.
- **FR-020**: `delete-sketch` MUST remove the sketch's metadata so it no longer appears in the UI.
- **FR-021**: `delete-sketch` MUST fail without changes if the sketch name is missing or does not exist.

#### Update metadata script (CI)

- **FR-022**: The system MUST provide a command `npm run update-sketch-meta` intended to run in CI on pull requests.
- **FR-023**: `update-sketch-meta` MUST identify which of a PR's new commits changed sketch code and determine the affected sketches.
- **FR-024**: For each affected sketch, `update-sketch-meta` MUST update `dateUpdated` and `lastUpdatedBy` to reflect the latest commit that changed that sketch's code, and MUST leave `createdBy` and `dateCreated` unchanged.
- **FR-025**: `update-sketch-meta` MUST write the updated metadata back into the repository so the changes are committed as part of the PR.
- **FR-026**: `update-sketch-meta` MUST make no metadata changes when no sketch code was changed by the PR's commits.

### Key Entities *(include if feature involves data)*

- **Sketch**: A single p5.js sketch. Has a stable id (used for routing and folder identity), a `name`, and runnable sketch source/asset files stored under the sketch's folder.
- **Sketch Metadata**: The descriptive record for a sketch, comprising `name`, `dateCreated`, `dateUpdated`, `createdBy`, and `lastUpdatedBy`. Sourced from JSON on disk (no database) and displayed in both the table row and the sketch page.
- **Sketch Folder Structure**: The defined on-disk layout that the UI relies on to enumerate sketches and locate each sketch's runnable files and metadata.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can go from running `create-sketch` to seeing the new sketch listed in the UI table with all five metadata fields populated, with no manual file editing.
- **SC-002**: 100% of listed sketches display all five metadata fields in both the table row and the sketch page.
- **SC-003**: Clicking a sketch row results in the sketch running automatically within 3 seconds on a typical local machine.
- **SC-004**: Editing a displayed sketch's code and saving reflects the change in the browser within 3 seconds while remaining on the same sketch page 100% of the time.
- **SC-005**: `create-sketch` and `delete-sketch` each complete successfully in under 5 seconds and leave the gallery in a consistent state (UI list matches on-disk sketches).
- **SC-006**: After `delete-sketch`, the removed sketch's files/folders no longer exist and it no longer appears in the UI.
- **SC-007**: For any PR that changes a sketch's code, `update-sketch-meta` sets that sketch's `lastUpdatedBy` to the latest relevant commit's git user with 100% accuracy, and changes no unrelated sketch's metadata.
- **SC-008**: No sketch creation, update, or deletion is possible through the UI (view-only confirmed).

## Assumptions

- **Audience**: The user is a single developer/artist (or small team) running the server locally; multi-user concurrency, authentication, and deployment/hosting are out of scope.
- **Metadata storage shape**: Whether metadata lives in a single master JSON file or one JSON file per sketch is an implementation decision deferred to planning; the spec requires only that it be file-based JSON (no database) and expose the five fields per sketch. (User explicitly flagged this as undecided.)
- **Sketch id derivation**: A sketch's routing id is a stable, URL-safe identifier derived from its name/folder (e.g. a slug); the exact derivation is an implementation detail.
- **`createdBy` capture timing**: Because a sketch has no commit at creation time, `createdBy` is captured from the local git user configuration when `create-sketch` runs and is treated as immutable thereafter; `update-sketch-meta` maintains only `dateUpdated` and `lastUpdatedBy`.
- **"Relates to sketch code"**: A commit "relates to" a sketch when it changes files within that sketch's folder; `update-sketch-meta` uses commit file paths to attribute changes.
- **Git availability**: Git is installed and a user name is configured in environments where `create-sketch` and `update-sketch-meta` run.
- **CI environment**: The CI runner provides access to the PR's commit range and has permission to commit metadata changes back to the PR branch.
- **Tech stack**: Specific frameworks, bundler, and hot-reload mechanism are deferred to the planning phase; the only fixed interface constraints are the three named npm scripts, file-based JSON metadata, a defined folder structure, and a routed view-only web UI.
- **Sketch count**: The gallery is expected to hold on the order of tens to low hundreds of sketches; large-scale pagination/virtualization is not required for v1.
