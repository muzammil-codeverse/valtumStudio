import { describe, expect, it } from "vitest";

import { summarizeClientInvoices } from "./invoice-insights";

describe("customer invoice analytics", () => {
  const date = new Date("2026-11-02T00:00:00.000Z");

  it("separates currencies and does not count drafts", () => {
    const summaries = summarizeClientInvoices(
      [
        { amountCents: 12500, currency: "AUD", status: "ISSUED", issuedAt: new Date("2026-11-01") },
        { amountCents: 7500, currency: "AUD", status: "PAID", issuedAt: new Date("2026-10-12") },
        { amountCents: 20000, currency: "USD", status: "ISSUED", issuedAt: new Date("2026-11-01") },
        { amountCents: 99999, currency: "AUD", status: "DRAFT", issuedAt: null }
      ],
      date
    );
    expect(summaries.map((summary) => summary.currency)).toEqual(["AUD", "USD"]);
    expect(summaries[0]?.totalCents).toBe(20000);
    expect(summaries[0]?.outstandingCents).toBe(12500);
    expect(summaries[0]?.monthly.at(-1)?.cents).toBe(12500);
    expect(summaries[0]?.monthly.at(-2)?.cents).toBe(7500);
  });

  it("uses zero-height bars for empty months and ignores invalid amounts", () => {
    const [summary] = summarizeClientInvoices(
      [
        { amountCents: -100, currency: "AUD", status: "ISSUED", issuedAt: date },
        { amountCents: 0, currency: "AUD", status: "PAID", issuedAt: null }
      ],
      date
    );
    expect(summary?.monthlyMaxCents).toBe(0);
    expect(summary?.outstandingCents).toBe(0);
  });
});
