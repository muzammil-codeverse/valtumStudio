import { describe, expect, it } from "vitest";

import { clientDirectoryUrl, parseClientDirectoryQuery } from "./directory-query";

describe("admin client directory query", () => {
  it("bounds a long untrusted search and invalid page values", () => {
    const bounded = parseClientDirectoryQuery({ q: " a ".repeat(100), page: "-1" });
    expect(bounded.search.length).toBe(80);
    expect(bounded.search.startsWith("a  a")).toBe(true);
    expect(bounded.page).toBe(1);
    expect(bounded.skip).toBe(0);
    expect(parseClientDirectoryQuery({ page: "99999" }).page).toBe(100);
  });

  it("calculates exact server pagination and encoded search URLs", () => {
    expect(parseClientDirectoryQuery({ q: "  Smith & Co ", page: "3" })).toEqual({
      search: "Smith & Co",
      page: 3,
      skip: 50
    });
    expect(clientDirectoryUrl("Smith & Co", 2)).toBe(
      "/admin/clients?q=Smith+%26+Co&page=2"
    );
  });
});
