import { z } from "zod";

/**
 * Per-sketch metadata schema. Single source of truth shared by the CLI scripts
 * (writers) and the view-only UI (reader). Mirrors
 * contracts/sketch-meta.schema.json. This module is intentionally free of any
 * Node-only imports so it can be bundled into the browser app.
 */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const SketchMetaSchema = z
  .object({
    id: z.string().regex(SLUG, "id must be a kebab-case slug"),
    name: z.string().trim().min(1, "name must be non-empty"),
    dateCreated: z.string().regex(ISO_DATE, "dateCreated must be YYYY-MM-DD"),
    dateUpdated: z.string().regex(ISO_DATE, "dateUpdated must be YYYY-MM-DD"),
    createdBy: z.string().min(1, "createdBy must be non-empty"),
    lastUpdatedBy: z.string().min(1, "lastUpdatedBy must be non-empty"),
    runner: z.enum(["p5", "q5"]).default("p5"),
  })
  .strict();

export type SketchMeta = z.infer<typeof SketchMetaSchema>;

/** Parse + validate an unknown value as SketchMeta. Throws on invalid input. */
export function parseMeta(value: unknown): SketchMeta {
  return SketchMetaSchema.parse(value);
}

/** Safe variant: returns a discriminated result instead of throwing. */
export function safeParseMeta(value: unknown) {
  return SketchMetaSchema.safeParse(value);
}

/** Serialize metadata to the canonical on-disk JSON form (2-space indent + newline). */
export function serializeMeta(meta: SketchMeta): string {
  const ordered: Record<string, unknown> = {
    id: meta.id,
    name: meta.name,
    dateCreated: meta.dateCreated,
    dateUpdated: meta.dateUpdated,
    createdBy: meta.createdBy,
    lastUpdatedBy: meta.lastUpdatedBy,
  };
  if (meta.runner !== "p5") ordered["runner"] = meta.runner;
  return JSON.stringify(ordered, null, 2) + "\n";
}
