import { describe, expect, it } from "vitest";

import { emailSchema, validatePasswordForEmail } from "./credentials";

describe("credential policy", () => {
  it("normalizes email and requires a long contextual password", () => {
    expect(emailSchema.parse("  OWNER@EXAMPLE.TEST ")).toBe("owner@example.test");
    expect(
      validatePasswordForEmail("correct-horse-battery-staple", "owner@example.test")
    ).toBe("correct-horse-battery-staple");
  });

  it("rejects short, email-derived, and prohibited passwords", () => {
    expect(() => validatePasswordForEmail("short", "owner@example.test")).toThrow();
    expect(() =>
      validatePasswordForEmail("owner-password-1234", "owner@example.test")
    ).toThrow();
    expect(() =>
      validatePasswordForEmail("SiglumStudio-long-passphrase", "owner@example.test")
    ).toThrow();
  });
});
