import { describe, expect, it } from "vitest";

import { parseRole, roles } from "../domain/roles";
import { actions, assertCan, can, permissionMatrix, resources } from "./authorization";

describe("authorization matrix", () => {
  it("has a complete, explicit entry for every role and resource", () => {
    for (const role of roles) {
      for (const resource of resources) {
        expect(permissionMatrix[role][resource]).toBeDefined();
        for (const action of actions) {
          expect(can(role, { action, resource })).toBe(
            permissionMatrix[role][resource].includes(action)
          );
        }
      }
    }
  });

  it("enforces role boundaries and fails closed for unrecognized stored roles", () => {
    expect(can("owner", { action: "manage", resource: "users" })).toBe(true);
    expect(can("owner", { action: "delete", resource: "audit" })).toBe(false);
    expect(can("admin", { action: "manage", resource: "users" })).toBe(false);
    expect(can("editor", { action: "publish", resource: "projects" })).toBe(false);
    expect(() =>
      assertCan("editor", { action: "read", resource: "securityEvents" })
    ).toThrow();
    expect(() => parseRole("super-admin")).toThrow("not recognized");
  });
});
