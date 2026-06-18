/** Pattern a valid sketch id (slug) MUST match. Mirrors the JSON Schema. */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Derive a URL-safe kebab-case slug from a human display name.
 *
 * Rules (contracts/cli-scripts.md shared conventions):
 *   - lowercase
 *   - spaces and underscores become `-`
 *   - characters outside [a-z0-9-] are stripped
 *   - runs of `-` collapse to one
 *   - leading/trailing `-` trimmed
 *
 * Returns an empty string when the name yields no valid slug characters.
 */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** True when `id` is a valid sketch slug. */
export function isValidSlug(id: string): boolean {
  return SLUG_PATTERN.test(id);
}
