import type p5 from "p5";
import { safeParseMeta, type SketchMeta } from "../scripts/lib/meta";

/** A sketch module: default-exports a p5 instance-mode factory. */
export interface SketchModule {
  default: (p: p5) => void;
}

/** A discovered, valid sketch: its metadata + a lazy code loader. */
export interface SketchEntry {
  meta: SketchMeta;
  load: () => Promise<SketchModule>;
}

/** A folder present on disk whose metadata is missing/invalid. */
export interface InvalidSketch {
  id: string;
  error: string;
}

// Eager metadata (small JSON) + lazy code (only the viewed sketch loads).
const metaModules = import.meta.glob<{ default: unknown }>(
  "/sketches/*/meta.json",
  { eager: true },
);
const codeModules = import.meta.glob<SketchModule>("/sketches/*/sketch.ts");

/** Extract the sketch id (folder name) from a globbed file path. */
function idFromPath(path: string): string {
  const match = path.match(/\/sketches\/([^/]+)\//);
  return match?.[1] ?? "";
}

const valid: SketchEntry[] = [];
const invalid: InvalidSketch[] = [];

for (const [path, mod] of Object.entries(metaModules)) {
  const id = idFromPath(path);
  const codePath = `/sketches/${id}/sketch.ts`;
  const load = codeModules[codePath];

  const parsed = safeParseMeta((mod as { default: unknown }).default);
  if (!parsed.success) {
    invalid.push({ id, error: parsed.error.issues[0]?.message ?? "invalid meta.json" });
    continue;
  }
  if (parsed.data.id !== id) {
    invalid.push({ id, error: `meta.json id "${parsed.data.id}" != folder "${id}"` });
    continue;
  }
  if (!load) {
    invalid.push({ id, error: "missing sketch.ts" });
    continue;
  }
  valid.push({ meta: parsed.data, load });
}

/** All valid sketches, sorted by name (case-insensitive). For the home table. */
export const sketches: SketchEntry[] = valid.sort((a, b) =>
  a.meta.name.localeCompare(b.meta.name, undefined, { sensitivity: "base" }),
);

/** Folders on disk that could not be loaded as valid sketches. */
export const invalidSketches: InvalidSketch[] = invalid;

const byId = new Map(valid.map((s) => [s.meta.id, s]));

/** Look up a single sketch by id, or undefined if it does not exist / is invalid. */
export function getSketch(id: string): SketchEntry | undefined {
  return byId.get(id);
}
