import { beforeEach, describe, expect, it, vi } from "vitest";

const sweepExpiredDeliveryFiles = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("@/modules/portal/server/delivery-file-maintenance", () => ({
  sweepExpiredDeliveryFiles
}));

import { GET } from "./route";

const endpoint = "https://valtumstudio.com.au/api/internal/delivery/maintenance";
const secret = "test-production-cron-secret-please-replace-123456789";

describe("protected delivery cleanup endpoint", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("CRON_SECRET", secret);
    vi.stubEnv("DELIVERY_MAINTENANCE_ENABLED", "true");
    sweepExpiredDeliveryFiles.mockResolvedValue({
      examined: 0,
      cleaned: 0,
      orphanUploadsRemoved: 0,
      failed: 0,
      moreLikely: false
    });
  });

  it("rejects missing and mismatched tokens", async () => {
    for (const token of [null, "Bearer wrong"]) {
      const request = new Request(endpoint, {
        headers: token ? { authorization: token } : {}
      });
      expect((await GET(request)).status).toBe(401);
    }
    expect(sweepExpiredDeliveryFiles).not.toHaveBeenCalled();
  });

  it("does nothing when the maintenance feature is disabled", async () => {
    vi.stubEnv("DELIVERY_MAINTENANCE_ENABLED", "false");
    expect(
      (
        await GET(
          new Request(endpoint, {
            headers: { authorization: "Bearer " + secret }
          })
        )
      ).status
    ).toBe(503);
    expect(sweepExpiredDeliveryFiles).not.toHaveBeenCalled();
  });

  it("returns only counters to an authorized scheduled call", async () => {
    const response = await GET(
      new Request(endpoint, {
        headers: { authorization: "Bearer " + secret }
      })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      examined: 0,
      cleaned: 0,
      orphanUploadsRemoved: 0,
      failed: 0,
      moreLikely: false
    });
  });
});
