import fs from "node:fs";
import { SKETCHES_DIR, metaPath } from "./lib/paths";
import { resolveCommitRange, latestSketchCodeCommit } from "./lib/git";
import { readMeta, writeMeta } from "./lib/meta-io";

/** List sketch ids on disk (folders under sketches/ that have a meta.json). */
function listSketchIds(): string[] {
  if (!fs.existsSync(SKETCHES_DIR)) return [];
  return fs
    .readdirSync(SKETCHES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(metaPath(e.name)))
    .map((e) => e.name)
    .sort();
}

function main(): void {
  const range = resolveCommitRange();
  const ids = listSketchIds();
  const updated: string[] = [];

  for (const id of ids) {
    // A sketch is "affected" only when a commit changed code (not meta.json). (FR-023)
    const commit = latestSketchCodeCommit(id, range);
    if (!commit) continue; // unchanged sketch left untouched (FR-026)

    const meta = readMeta(id);
    // Update mutable fields only; createdBy/dateCreated stay immutable. (FR-024)
    if (meta.dateUpdated === commit.date && meta.lastUpdatedBy === commit.authorName) {
      continue; // already current
    }

    writeMeta(id, {
      ...meta,
      dateUpdated: commit.date,
      lastUpdatedBy: commit.authorName,
    });
    updated.push(id);
    console.log(`Updated ${id}: dateUpdated=${commit.date}, lastUpdatedBy=${commit.authorName}`);
  }

  if (updated.length === 0) {
    console.log("No sketch code changes; nothing to update");
    return;
  }
  console.log(`Updated ${updated.length} sketch(es).`);
}

main();
