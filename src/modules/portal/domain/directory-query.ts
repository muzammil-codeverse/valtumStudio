export const CLIENT_DIRECTORY_PAGE_SIZE = 25;

/** Ignore untrusted URL input beyond a bounded filter and pagination window. */
export function parseClientDirectoryQuery(values: { q?: string; page?: string }): {
  search: string;
  page: number;
  skip: number;
} {
  const search = typeof values.q === "string" ? values.q.trim().slice(0, 80) : "";
  const raw = typeof values.page === "string" ? values.page : "";
  const page = /^\d{1,5}$/.test(raw) ? Math.min(100, Math.max(1, Number(raw))) : 1;
  return { search, page, skip: (page - 1) * CLIENT_DIRECTORY_PAGE_SIZE };
}

export function clientDirectoryUrl(search: string, page: number): string {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (page > 1) params.set("page", String(page));
  const suffix = params.toString();
  return "/admin/clients" + (suffix ? "?" + suffix : "");
}
