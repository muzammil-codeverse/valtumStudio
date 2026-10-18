import { describe, expect, it } from "vitest";

import { navigationSchema } from "./schemas";
describe("navigation validation", () => {
  it("rejects an invalid internal URL", () => {
    expect(
      navigationSchema.safeParse({
        location: "PRIMARY",
        type: "INTERNAL",
        label: "Home",
        href: "https://example.com",
        sortOrder: 0
      }).success
    ).toBe(false);
  });
  it("allows a group without a URL", () => {
    expect(
      navigationSchema.safeParse({
        location: "PRIMARY",
        type: "GROUP",
        label: "Work",
        sortOrder: 0
      }).success
    ).toBe(true);
  });
});
