import { describe, expect, it } from "vitest";

import { validateCanonicalUrl, validateNavigationHref } from "./urls";
describe("CMS URL validation", () => {
  it("rejects unsafe URL schemes", () =>
    expect(validateCanonicalUrl("javascript:alert(1)")).toBeUndefined());
  it("enforces internal and external navigation URLs", () => {
    expect(validateNavigationHref("INTERNAL", "/work")).toBe(true);
    expect(validateNavigationHref("INTERNAL", "https://example.com")).toBe(false);
    expect(validateNavigationHref("EXTERNAL", "https://example.com")).toBe(true);
  });
});
