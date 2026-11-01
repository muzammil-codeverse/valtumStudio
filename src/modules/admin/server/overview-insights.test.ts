import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/database", () => ({ prisma: {} }));

import { countLeadsByMonth, parseDashboardMonth } from "./overview-insights";

describe("dashboard calendar aggregation", () => {
  it("rejects invalid month selectors and future unsafe formats", () => {
    expect(parseDashboardMonth("../2026-11", new Date("2026-11-02T12:00:00Z"))).toBe(
      "2026-11"
    );
    expect(parseDashboardMonth("2026-00", new Date("2026-11-02T12:00:00Z"))).toBe(
      "2026-11"
    );
    expect(parseDashboardMonth("2026-10", new Date("2026-11-02T12:00:00Z"))).toBe(
      "2026-10"
    );
  });

  it("counts actual submissions per month and day without introducing demo data", () => {
    const value = countLeadsByMonth(
      [
        { createdAt: new Date("2026-10-31T23:00:00Z"), count: 2 },
        { createdAt: new Date("2026-11-01T01:00:00Z"), count: 1 },
        { createdAt: new Date("2026-11-01T13:00:00Z"), count: 2 }
      ],
      "2026-11"
    );
    expect(value.trend.at(-2)?.count).toBe(2);
    expect(value.trend.at(-1)?.count).toBe(3);
    expect(value.dailyCounts["2026-11-01"]).toBe(3);
    expect(value.dailyCounts["2026-10-31"]).toBeUndefined();
  });

  it("keeps chart values truly zero when there are no submissions", () => {
    const value = countLeadsByMonth([], "2026-11");
    expect(value.trend).toHaveLength(6);
    expect(value.trend.every((point) => point.count === 0)).toBe(true);
  });
});
