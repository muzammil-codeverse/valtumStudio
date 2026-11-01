import { describe, expect, it, vi } from "vitest";

const { findFirst } = vi.hoisted(() => ({
  findFirst: vi.fn().mockResolvedValue(null)
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/database", () => ({
  prisma: { clientEngagement: { findFirst } }
}));

import { getClientEngagement } from "./client-data";

describe("client-tenant authorization", () => {
  it("enforces the signed-in user's membership within the project query", async () => {
    await getClientEngagement("user-one", "project-other");
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "project-other",
          workspace: { memberships: { some: { userId: "user-one" } } }
        }
      })
    );
  });
});
