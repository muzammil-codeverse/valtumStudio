import { describe, expect, it } from "vitest";

import { destinationForSession } from "./entry-destination";

describe("post-sign-in destination", () => {
  it("routes customers exclusively to the customer portal", () => {
    expect(destinationForSession("FULLY_AUTHENTICATED", "client")).toBe("/portal");
  });
  it("routes the sole privileged operator to administration", () => {
    expect(destinationForSession("FULLY_AUTHENTICATED", "owner")).toBe("/admin");
  });
  it("enforces password replacement and TOTP setup", () => {
    expect(destinationForSession("PASSWORD_CHANGE_REQUIRED", "client")).toBe(
      "/auth/change-password"
    );
    expect(destinationForSession("TWO_FACTOR_SETUP_REQUIRED", "owner")).toBe(
      "/auth/setup-two-factor"
    );
  });
  it("never redirects an anonymous visitor to a private workspace", () => {
    expect(destinationForSession("ANONYMOUS")).toBe("/auth/sign-in");
  });
});
