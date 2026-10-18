import { describe, expect, it } from "vitest";

import { assertCan, can } from "@/modules/auth/policies/authorization";

import { leadStatuses } from "./submission";

describe("lead authorization policy", () => {
  it("permits owners and administrators to read and update leads", () => {
    for (const role of ["owner", "admin"] as const) {
      expect(can(role, { resource: "leads", action: "read" })).toBe(true);
      expect(can(role, { resource: "leads", action: "update" })).toBe(true);
    }
  });

  it("denies editors lead access and fails closed without disclosing a resource", () => {
    expect(can("editor", { resource: "leads", action: "read" })).toBe(false);
    expect(can("editor", { resource: "leads", action: "update" })).toBe(false);
    expect(() => assertCan("editor", { resource: "leads", action: "read" })).toThrow(
      "not permitted"
    );
    expect(() => assertCan("editor", { resource: "leads", action: "update" })).toThrow(
      "not permitted"
    );
  });
});

describe("legacy lead status policy", () => {
  it("does not offer the legacy CLOSED status as a normal workflow update", () => {
    expect(leadStatuses).not.toContain("CLOSED");
    expect(leadStatuses).toContain("WON");
    expect(leadStatuses).toContain("LOST");
  });
});
