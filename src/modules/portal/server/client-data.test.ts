import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/database", () => ({ prisma: {} }));

import { clientReadableStatus, formatClientMoney } from "./client-data";

describe("customer-facing data presentation", () => {
  it("formats currency from integer cents, not floating point guesses", () => {
    expect(formatClientMoney(123456, "AUD")).toContain("1,234.56");
  });
  it("turns stored enum values into human-readable status labels", () => {
    expect(clientReadableStatus("AWAITING_REVIEW")).toBe("awaiting review");
  });
});
