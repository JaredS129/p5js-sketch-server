import fs from "node:fs";
import { metaPath } from "./paths";
import { parseMeta, serializeMeta, type SketchMeta } from "./meta";

/** Read + validate a sketch's meta.json from disk. Throws if missing or invalid. */
export function readMeta(id: string): SketchMeta {
  const raw = fs.readFileSync(metaPath(id), "utf8");
  return parseMeta(JSON.parse(raw));
}

/** Validate + write a sketch's meta.json to disk in canonical form. */
export function writeMeta(id: string, meta: SketchMeta): void {
  const validated = parseMeta(meta);
  fs.writeFileSync(metaPath(id), serializeMeta(validated), "utf8");
}
