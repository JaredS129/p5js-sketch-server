import type p5 from "p5";
import { safeParseMeta, type SketchMeta } from "../scripts/lib/meta";

export interface P5SketchModule {
  default: (p: p5) => void;
}
export interface Q5SketchModule {
  default: (q: Q5) => void;
}
export type SketchModule = P5SketchModule | Q5SketchModule;

/** A discovered, valid sketch: its metadata + lazy code and raw-source loaders. */
export interface SketchEntry {
  meta: SketchMeta;
  load: () => Promise<SketchModule>;
  /** Lazily load the sketch's raw `sketch.ts` text (for native-mode conversion). */
  loadSource: () => Promise<string>;
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
// Raw source text of each sketch, loaded lazily and hot-updated by Vite so the
// native-code panel re-derives in lock-step with edits (research D2).
const rawCodeModules = import.meta.glob<string>("/sketches/*/sketch.ts", {
  query: "?raw",
  import: "default",
});

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
  const loadSource = rawCodeModules[codePath];

  const parsed = safeParseMeta((mod as { default: unknown }).default);
  if (!parsed.success) {
    invalid.push({ id, error: parsed.error.issues[0]?.message ?? "invalid meta.json" });
    continue;
  }
  if (parsed.data.id !== id) {
    invalid.push({ id, error: `meta.json id "${parsed.data.id}" != folder "${id}"` });
    continue;
  }
  if (!load || !loadSource) {
    invalid.push({ id, error: "missing sketch.ts" });
    continue;
  }
  valid.push({ meta: parsed.data, load, loadSource });
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
