import fs from "node:fs";
import { slugify, isValidSlug } from "./lib/slug";
import { getGitUserName } from "./lib/git";
import { today } from "./lib/date";
import { sketchDir, sketchCodePath, SKETCH_TEMPLATE } from "./lib/paths";
import { readMeta, writeMeta } from "./lib/meta-io";
import type { SketchMeta } from "./lib/meta";

const USAGE = 'Usage: npm run create-sketch -- "<name>"';

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function main(): void {
  // 1. Require a name argument (FR-018).
  const name = process.argv.slice(2).join(" ").trim();
  if (!name) fail(USAGE);

  // 2. Derive + validate the slug id.
  const id = slugify(name);
  if (!id || !isValidSlug(id)) fail(`Invalid sketch name: "${name}"`);

  // 3. Refuse to overwrite an existing sketch — the slug is the folder name, so
  //    two names that slugify to the same id cannot coexist. (FR-018, no mutation)
  const dir = sketchDir(id);
  if (fs.existsSync(dir)) {
    let existing = "";
    try {
      existing = ` (name: "${readMeta(id).name}")`;
    } catch {
      // folder exists but meta is unreadable; fall back to the bare id
    }
    fail(
      `Sketch "${id}" already exists${existing}. Names that slugify to the same id are not allowed.`,
    );
  }

  // 4. Resolve creator from local git config (throws clear message if unset).
  let createdBy: string;
  try {
    createdBy = getGitUserName();
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }

  // 5. Scaffold folder + files.
  const date = today();
  const meta: SketchMeta = {
    id,
    name,
    dateCreated: date,
    dateUpdated: date,
    createdBy,
    lastUpdatedBy: createdBy,
  };

  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(SKETCH_TEMPLATE, sketchCodePath(id));
  writeMeta(id, meta);

  // 6. Report success (FR-016, FR-017 — UI auto-discovers it).
  console.log(`Created sketch "${id}" at sketches/${id}/`);
  console.log(`  name: ${name}`);
  console.log(`  createdBy: ${createdBy}`);
}

main();
