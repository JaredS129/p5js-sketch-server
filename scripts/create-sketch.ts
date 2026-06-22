import fs from "node:fs";
import { slugify, isValidSlug } from "./lib/slug";
import { getGitUserName } from "./lib/git";
import { today } from "./lib/date";
import {
  type SketchType,
  SKETCH_TEMPLATES,
  EXTRA_TEMPLATES,
  sketchDir,
  sketchCodePath,
} from "./lib/paths";
import { readMeta, writeMeta } from "./lib/meta-io";
import type { SketchMeta } from "./lib/meta";

const SKETCH_TYPES: SketchType[] = ["p5", "q5", "p5play", "q5play"];
const RUNNER: Record<SketchType, "p5" | "q5"> = {
  p5: "p5",
  q5: "q5",
  p5play: "p5",
  q5play: "q5",
};

const USAGE = `Usage: npm run create-sketch -- "<name>" [--type p5|q5|p5play|q5play]`;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv: string[]): { name: string; type: SketchType } {
  const args = [...argv];
  let type: SketchType = "p5";
  const nameWords: string[] = [];

  while (args.length) {
    const arg = args.shift()!;
    if (arg === "--type") {
      const val = args.shift();
      if (!val || !(SKETCH_TYPES as string[]).includes(val)) {
        fail(`--type must be one of: ${SKETCH_TYPES.join(", ")}`);
      }
      type = val as SketchType;
    } else {
      nameWords.push(arg);
    }
  }

  return { name: nameWords.join(" ").trim(), type };
}

function main(): void {
  const { name, type } = parseArgs(process.argv.slice(2));

  // 1. Require a name argument (FR-018).
  if (!name) fail(USAGE);

  // 2. Derive + validate the slug id.
  const id = slugify(name);
  if (!id || !isValidSlug(id)) fail(`Invalid sketch name: "${name}"`);

  // 3. Refuse to overwrite an existing sketch.
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

  // 4. Resolve creator from local git config.
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
    runner: RUNNER[type],
  };

  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(SKETCH_TEMPLATES[type], sketchCodePath(id));
  for (const { tmpl, dest } of EXTRA_TEMPLATES[type] ?? []) {
    fs.copyFileSync(tmpl, `${dir}/${dest}`);
  }
  writeMeta(id, meta);

  // 6. Report success.
  console.log(`Created sketch "${id}" at sketches/${id}/`);
  console.log(`  name: ${name}`);
  console.log(`  type: ${type}`);
  console.log(`  createdBy: ${createdBy}`);
}

main();
