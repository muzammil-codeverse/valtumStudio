import { beforeEach, describe, expect, it, vi } from "vitest";

const { getOptionalSession, isClientPortalEnabled, findMany } = vi.hoisted(() => ({
  getOptionalSession: vi.fn(),
  isClientPortalEnabled: vi.fn(),
  findMany: vi.fn()
}));

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/database", () => ({ prisma: { clientInvoice: { findMany } } }));
vi.mock("@/modules/auth/server/authorization", () => ({
  getOptionalSession,
  getAuthenticationAssurance: vi.fn((principal: { fullyAuthenticated: boolean }) =>
    principal.fullyAuthenticated ? "FULLY_AUTHENTICATED" : "PASSWORD_CHANGE_REQUIRED"
  )
}));
vi.mock("@/modules/portal/server/client-data", () => ({
  isClientPortalEnabled
}));

import { GET } from "./route";

describe("customer billing CSV endpoint", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    isClientPortalEnabled.mockReturnValue(true);
  });

  it("returns 404 when the customer portal is not enabled", async () => {
    isClientPortalEnabled.mockReturnValue(false);
    expect((await GET()).status).toBe(404);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("denies unauthenticated, incomplete and non-client sessions", async () => {
    getOptionalSession.mockResolvedValueOnce(null);
    expect((await GET()).status).toBe(401);

    getOptionalSession.mockResolvedValueOnce({
      userId: "owner-1",
      role: "owner",
      fullyAuthenticated: true
    });
    expect((await GET()).status).toBe(403);

    getOptionalSession.mockResolvedValueOnce({
      userId: "client-1",
      role: "client",
      fullyAuthenticated: false
    });
    expect((await GET()).status).toBe(403);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("exports only membership-scoped issued invoices, never drafts", async () => {
    getOptionalSession.mockResolvedValue({
      userId: "client-123",
      role: "client",
      fullyAuthenticated: true
    });
    findMany.mockResolvedValue([
      {
        reference: "=DANGEROUS(1)",
        status: "ISSUED",
        currency: "AUD",
        amountCents: 120000,
        issuedAt: new Date("2026-11-02T00:00:00.000Z"),
        dueDate: null,
        paidAt: null,
        engagement: {
          title: "Studio portal",
          workspace: { name: "Example Client" }
        }
      }
    ]);

    const response = await GET();
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(response.headers.get("Content-Disposition")).toContain("attachment");
    expect(text).toContain("'=DANGEROUS(1)");
    expect(text).toContain("Example Client");
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: { in: ["ISSUED", "PAID"] },
          engagement: {
            workspace: {
              memberships: { some: { userId: "client-123" } }
            }
          }
        }
      })
    );
  });

  it("fails closed rather than silently omitting records over the cap", async () => {
    getOptionalSession.mockResolvedValue({
      userId: "client-123",
      role: "client",
      fullyAuthenticated: true
    });
    findMany.mockResolvedValue(Array.from({ length: 2001 }, () => ({})));
    expect((await GET()).status).toBe(422);
  });
});
