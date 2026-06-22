import type { SketchMeta } from "../../scripts/lib/meta";

/** The five metadata fields, in display order. Shared by the table + sketch page. */
export const META_FIELDS = [
  { key: "name", label: "Name" },
  { key: "id", label: "ID" },
  { key: "type", label: "Type" },
  { key: "dateCreated", label: "Created" },
  { key: "dateUpdated", label: "Updated" },
  { key: "createdBy", label: "Created by" },
  { key: "lastUpdatedBy", label: "Last updated by" },
] as const satisfies ReadonlyArray<{ key: keyof SketchMeta; label: string }>;

/** Renders the five metadata fields as a definition list (sketch page, FR-007). */
export function MetaPanel({ meta }: { meta: SketchMeta }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
      {META_FIELDS.map(({ key, label }) => (
        <div key={key} className="contents">
          <dt className="text-muted">{label}</dt>
          <dd className="font-medium text-fg">{meta[key]}</dd>
        </div>
      ))}
    </dl>
  );
}
