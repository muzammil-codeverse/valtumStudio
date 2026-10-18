import { describe, expect, it } from "vitest";

import { canTransition } from "./publication";
describe("publication transitions", () => {
  it("only allows the canonical workflow", () => {
    expect(canTransition("DRAFT", "PUBLISHED")).toBe(true);
    expect(canTransition("PUBLISHED", "DRAFT")).toBe(false);
    expect(canTransition("ARCHIVED", "DRAFT")).toBe(true);
  });
});
