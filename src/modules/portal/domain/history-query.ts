export const HISTORY_PAGE_SIZE = 24;

export const historyViews = ["decisions", "messages", "files", "activity"] as const;
export type HistoryView = (typeof historyViews)[number];

export function parseHistoryQuery(input: {
  view?: string;
  cursor?: string;
  q?: string;
  status?: string;
}): {
  view: HistoryView;
  cursor: string | null;
  search: string;
  status: string | null;
} {
  const view = historyViews.find((kind) => kind === input.view) ?? "activity";
  const cursor =
    typeof input.cursor === "string" && /^[a-zA-Z0-9_-]{8,128}$/.test(input.cursor)
      ? input.cursor
      : null;
  const search = (input.q ?? "").trim().slice(0, 80);
  const status =
    view === "decisions" &&
    ["REQUESTED", "APPROVED", "CHANGES_REQUESTED", "CANCELLED"].includes(
      input.status ?? ""
    )
      ? (input.status ?? null)
      : null;
  return { view, cursor, search, status };
}

export function historyUrl(
  base: string,
  projectId: string,
  options: {
    view: HistoryView;
    cursor?: string | null;
    search?: string;
    status?: string | null;
  },
  admin = false
): string {
  const query = new URLSearchParams();
  if (admin) query.set("project", projectId);
  query.set("view", options.view);
  if (options.cursor) query.set("cursor", options.cursor);
  if (options.search) query.set("q", options.search);
  if (options.status && options.view === "decisions")
    query.set("status", options.status);
  return base + "?" + query.toString();
}
