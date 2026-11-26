export type SortDirection = "asc" | "desc";

export function resolveSort(
  sortBy: string | undefined,
  sortOrder: string | undefined,
  fields: readonly string[],
  fallback: string,
): { field: string; direction: SortDirection } {
  const field = sortBy && fields.includes(sortBy) ? sortBy : undefined;
  if (!field) return { field: fallback, direction: "desc" };
  return { field, direction: sortOrder === "asc" ? "asc" : "desc" };
}
