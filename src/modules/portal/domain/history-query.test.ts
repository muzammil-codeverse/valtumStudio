import { describe, expect, it } from "vitest";

import { historyUrl, parseHistoryQuery } from "./history-query";

describe("workroom history queries", () => {
  it("normalizes view, cursor, search and allowed approval statuses", () => {
    expect(
      parseHistoryQuery({ view: "nope", cursor: "abc", q: "   design  " })
    ).toEqual({ view: "activity", cursor: null, search: "design", status: null });
    expect(
      parseHistoryQuery({
        view: "decisions",
        cursor: "abcDEF_12345",
        status: "APPROVED"
      })
    ).toEqual({
      view: "decisions",
      cursor: "abcDEF_12345",
      search: "",
      status: "APPROVED"
    });
    expect(
      parseHistoryQuery({ view: "messages", status: "APPROVED" }).status
    ).toBeNull();
  });

  it("preserves the selected admin project and URL-encodes search", () => {
    const result = historyUrl(
      "/admin/clients/space/history",
      "project-100",
      {
        view: "messages",
        cursor: "abcDEF_12345",
        search: "design & launch"
      },
      true
    );
    const url = new URL(result, "https://valtumstudio.com.au");
    expect(url.searchParams.get("project")).toBe("project-100");
    expect(url.searchParams.get("q")).toBe("design & launch");
    expect(url.searchParams.get("cursor")).toBe("abcDEF_12345");
  });
});
