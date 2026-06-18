import fs from "node:fs";
import { slugify } from "./lib/slug";
import { sketchDir } from "./lib/paths";

const USAGE = 'Usage: npm run delete-sketch -- "<name>"';

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function main(): void {
  // 1. Require a name argument (FR-021).
  const name = process.argv.slice(2).join(" ").trim();
  if (!name) fail(USAGE);

  // 2. Resolve the folder (accepts display name or id; both slugify the same).
  const id = slugify(name);
  const dir = sketchDir(id);
  if (!id || !fs.existsSync(dir)) fail(`Sketch "${id || name}" not found`);

  // 3. Hard-delete the folder + all contents (FR-019, FR-020).
  fs.rmSync(dir, { recursive: true, force: true });

  console.log(`Deleted sketch "${id}" (sketches/${id}/)`);
}

main();
