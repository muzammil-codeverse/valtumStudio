import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  updateMany: vi.fn(),
  deleteObject: vi.fn()
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/database", () => ({
  prisma: { clientFile: { findMany: mocks.findMany, updateMany: mocks.updateMany } }
}));
vi.mock("@/modules/cms/media/server/storage", () => ({
  getMediaStorage: () => ({ deleteObject: mocks.deleteObject })
}));

import { sweepExpiredDeliveryFiles } from "./delivery-file-maintenance";

describe("private delivery upload cleanup", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.findMany.mockResolvedValue([]);
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.deleteObject.mockResolvedValue(undefined);
  });

  it("only selects stale, unverified, not-yet-deleted objects", async () => {
    const result = await sweepExpiredDeliveryFiles({
      now: new Date("2026-11-03T12:00:00Z")
    });
    expect(result).toEqual({
      examined: 0,
      cleaned: 0,
      orphanUploadsRemoved: 0,
      failed: 0,
      moreLikely: false
    });
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: { in: ["UPLOADING", "VERIFYING", "FAILED"] },
          storageDeletedAt: null,
          expiresAt: { lt: new Date("2026-11-03T11:00:00Z") }
        },
        take: 25
      })
    );
  });

  it("records storage deletion without deleting audit metadata", async () => {
    mocks.findMany.mockResolvedValueOnce([
      {
        id: "upload-expired-001",
        engagementId: "engagement",
        storageKey: "private/delivery/engagement/upload-expired-001"
      }
    ]);
    const result = await sweepExpiredDeliveryFiles({
      now: new Date("2026-11-03T12:00:00Z")
    });
    expect(result.cleaned).toBe(1);
    expect(mocks.deleteObject).toHaveBeenCalledTimes(2);
    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: "FAILED",
          storageDeletedAt: new Date("2026-11-03T12:00:00Z")
        }
      })
    );
  });

  it("preserves retries when private storage fails", async () => {
    mocks.findMany.mockResolvedValueOnce([
      { id: "expired-001", storageKey: "private/delivery/a" }
    ]);
    mocks.deleteObject.mockRejectedValueOnce(new Error("unavailable"));
    const result = await sweepExpiredDeliveryFiles();
    expect(result.failed).toBe(1);
    expect(result.cleaned).toBe(0);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});
