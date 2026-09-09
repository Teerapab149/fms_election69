/**
 * Normalize image URL fields that may come from Prisma JSON, a legacy JSON
 * string, or an old single-value field. Empty and duplicate entries must never
 * become visible gallery cards.
 */
export function normalizeImageUrls(value) {
  let items = value;

  if (typeof items === "string") {
    const trimmed = items.trim();
    if (!trimmed) return [];

    try {
      items = JSON.parse(trimmed);
    } catch {
      items = [trimmed];
    }
  }

  if (!Array.isArray(items)) items = items ? [items] : [];

  return [...new Set(
    items
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
  )];
}
