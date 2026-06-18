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

/** Absolute path to the starter sketch template. */
export const SKETCH_TEMPLATE = path.join(REPO_ROOT, "templates", "sketch.ts.tmpl");

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
