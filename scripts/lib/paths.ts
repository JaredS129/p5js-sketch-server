import { fileURLToPath } from "node:url";
import path from "node:path";

/** Absolute path to the repository root (one level up from scripts/lib). */
export const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

/** Absolute path to the on-disk sketch store (`sketches/`). */
export const SKETCHES_DIR = path.join(REPO_ROOT, "sketches");

export type SketchType = "p5" | "q5" | "p5play" | "q5play";

const TMPL = (name: string) => path.join(REPO_ROOT, "templates", name);

/** Per-type sketch boilerplate paths. */
export const SKETCH_TEMPLATES: Record<SketchType, string> = {
  p5: TMPL("sketch.ts.tmpl"),
  q5: TMPL("sketch-q5.ts.tmpl"),
  p5play: TMPL("sketch-p5play.ts.tmpl"),
  q5play: TMPL("sketch-q5play.ts.tmpl"),
};

/** Extra files to copy alongside sketch.ts, keyed by type. */
export const EXTRA_TEMPLATES: Partial<Record<SketchType, Array<{ tmpl: string; dest: string }>>> = {
  p5play: [{ tmpl: TMPL("globals-p5play.ts.tmpl"), dest: "globals.ts" }],
};

/** Absolute path to a sketch's folder: `sketches/<id>/`. */
export function sketchDir(id: string): string {
  return path.join(SKETCHES_DIR, id);
}

/** Absolute path to a sketch's `meta.json`. */
export function metaPath(id: string): string {
  return path.join(sketchDir(id), "meta.json");
}

/** Absolute path to a sketch's `sketch.ts`. */
export function sketchCodePath(id: string): string {
  return path.join(sketchDir(id), "sketch.ts");
}

/**
 * Repo-relative POSIX path to a file inside a sketch folder. Used for matching
 * git-reported paths (which are always POSIX, repo-relative).
 */
export function sketchRepoPath(id: string, file: string): string {
  return `sketches/${id}/${file}`;
}
