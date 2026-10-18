import { describe, expect, it } from "vitest";

import { normalizeSlug, validateSlug } from "./slug";
describe("slug utilities", () => {
  it("normalizes unicode and separators", () =>
    expect(normalizeSlug("  Crème — Brûlée!  ")).toBe("creme-brulee"));
  it("rejects reserved slugs", () => expect(validateSlug("admin").ok).toBe(false));
});
