import fs from "node:fs";
import { slugify, isValidSlug } from "./lib/slug";
import { getGitUserName } from "./lib/git";
import { today } from "./lib/date";
import { sketchDir } from "./lib/paths";
import { readMeta, writeMeta } from "./lib/meta-io";
import type { SketchMeta } from "./lib/meta";

const USAGE = 'Usage: npm run duplicate-sketch -- "<source name|id>" ["<new name>"]';

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function main(): void {
  // 1. Require a source argument; the new name is optional. Both are passed as
  //    discrete (quoted) positional args, e.g. `-- "Vector Field" "My Copy"`.
  const [sourceArg, newNameArg] = process.argv.slice(2);
  if (!sourceArg?.trim()) fail(USAGE);

  // 2. Resolve the source folder (accepts display name or id; both slugify the
  //    same) and load its meta so the default name can reuse the display name.
  const sourceId = slugify(sourceArg);
  const sourceDir = sketchDir(sourceId);
  if (!sourceId || !fs.existsSync(sourceDir)) {
    fail(`Sketch "${sourceId || sourceArg}" not found`);
  }

  let sourceMeta: SketchMeta;
  try {
    sourceMeta = readMeta(sourceId);
  } catch {
    fail(`Sketch "${sourceId}" has no readable meta.json; cannot duplicate`);
  }

  // 3. Determine the new name: the provided argument, or "<source name> - Copy".
  const name = newNameArg?.trim() || `${sourceMeta.name} - Copy`;

  // 4. Derive + validate the new slug id.
  const id = slugify(name);
  if (!id || !isValidSlug(id)) fail(`Invalid new sketch name: "${name}"`);

  // 5. Refuse to overwrite an existing sketch (also guards against duplicating a
  //    sketch onto itself, since that would slugify to the same id). (no mutation)
  const dir = sketchDir(id);
  if (fs.existsSync(dir)) {
    let existing = "";
    try {
      existing = ` (name: "${readMeta(id).name}")`;
    } catch {
      // folder exists but meta is unreadable; fall back to the bare id
    }
    fail(
      `Sketch "${id}" already exists${existing}. Choose a different new name.`,
    );
  }

  // 6. Resolve owner from local git config — a duplicate is a fresh sketch owned
  //    by whoever runs the script, dated today (mirrors create-sketch).
  let createdBy: string;
  try {
    createdBy = getGitUserName();
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }

  // 7. Copy the whole folder (sketch.ts + any assets), then overwrite meta.json
  //    with fresh identity/ownership for the new sketch.
  const date = today();
  const meta: SketchMeta = {
    id,
    name,
    dateCreated: date,
    dateUpdated: date,
    createdBy,
    lastUpdatedBy: createdBy,
    runner: "p5",
  };

  fs.cpSync(sourceDir, dir, { recursive: true });
  writeMeta(id, meta);

  // 8. Report success (the UI auto-discovers the new folder).
  console.log(`Duplicated "${sourceId}" → "${id}" at sketches/${id}/`);
  console.log(`  name: ${name}`);
  console.log(`  createdBy: ${createdBy}`);
}

main();
