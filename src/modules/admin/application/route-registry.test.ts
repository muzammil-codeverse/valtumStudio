import { describe, expect, it } from "vitest";

import { ADMIN_ROUTES } from "@/modules/admin/application/route-registry";
import type { Role } from "@/modules/auth/domain/roles";
import { can } from "@/modules/auth/policies/authorization";

function getAccessibleRouteKeys(role: Role): string[] {
  return Object.entries(ADMIN_ROUTES)
    .filter(([, route]) =>
      can(role, { resource: route.requiredResource, action: route.requiredAction })
    )
    .map(([key]) => key);
}

describe("Admin navigation filtering by role", () => {
  it("owner can access all routes", () => {
    const keys = getAccessibleRouteKeys("owner");
    expect(keys).toContain("dashboard");
    expect(keys).toContain("services");
    expect(keys).toContain("projects");
    expect(keys).toContain("insights");
    expect(keys).toContain("faqs");
    expect(keys).toContain("navigation");
    expect(keys).toContain("media");
    expect(keys).toContain("team");
    expect(keys).toContain("leads");
    expect(keys).toContain("settings");
    expect(keys).toContain("users");
    expect(keys).toContain("security");
    expect(keys).toContain("sessions");
  });

  it("admin cannot access owner-only routes (users, security events)", () => {
    const keys = getAccessibleRouteKeys("admin");
    expect(keys).toContain("dashboard");
    expect(keys).toContain("services");
    expect(keys).toContain("leads");
    expect(keys).toContain("settings");
    expect(keys).toContain("sessions");
    // Owner-only routes must be absent
    expect(keys).not.toContain("users");
    expect(keys).not.toContain("security");
  });

  it("editor cannot access leads, settings, users, or security routes", () => {
    const keys = getAccessibleRouteKeys("editor");
    expect(keys).toContain("dashboard");
    expect(keys).toContain("services");
    expect(keys).toContain("projects");
    expect(keys).toContain("media");
    expect(keys).toContain("sessions");
    // Must be absent for editor
    expect(keys).not.toContain("leads");
    expect(keys).not.toContain("settings");
    expect(keys).not.toContain("users");
    expect(keys).not.toContain("security");
  });

  it("route registry uses resource/action pairs consistent with permission matrix", () => {
    // Every route in the registry must have a valid resource and action
    // that can be evaluated by the can() function without throwing
    for (const role of ["owner", "admin", "editor"] as Role[]) {
      for (const route of Object.values(ADMIN_ROUTES)) {
        expect(() =>
          can(role, { resource: route.requiredResource, action: route.requiredAction })
        ).not.toThrow();
      }
    }
  });
});
