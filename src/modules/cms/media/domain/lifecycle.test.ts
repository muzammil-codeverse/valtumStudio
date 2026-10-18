import { describe, expect, it } from "vitest";

import { canMediaTransition, isDeliverableMediaStatus } from "./lifecycle";

describe("media lifecycle", () => {
  it("allows only verified upload progression", () => {
    expect(canMediaTransition("PENDING_UPLOAD", "VERIFYING")).toBe(true);
    expect(canMediaTransition("PENDING_UPLOAD", "READY")).toBe(false);
    expect(canMediaTransition("FAILED", "READY")).toBe(false);
    expect(canMediaTransition("DELETED", "READY")).toBe(false);
  });

  it("limits delivery to ready and archived assets", () => {
    expect(isDeliverableMediaStatus("READY")).toBe(true);
    expect(isDeliverableMediaStatus("ARCHIVED")).toBe(true);
    expect(isDeliverableMediaStatus("VERIFYING")).toBe(false);
  });
});
