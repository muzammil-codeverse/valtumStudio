import { describe, expect, it } from "vitest";

import { friendlyProjectType, summarizeLeadOutcomes } from "./lead-demand";

describe("CRM outcome analytics", () => {
  it("never invents an outcome rate when no outcomes exist", () => {
    expect(summarizeLeadOutcomes([])).toEqual({
      won: 0,
      lost: 0,
      decided: 0,
      percent: null
    });
  });
  it("uses only decided leads for the denominator", () => {
    expect(
      summarizeLeadOutcomes([
        { key: "WON", count: 3 },
        { key: "LOST", count: 1 },
        { key: "QUALIFIED", count: 50 }
      ])
    ).toEqual({ won: 3, lost: 1, decided: 4, percent: 75 });
  });
  it("formats demand categories without changing the underlying data", () => {
    expect(friendlyProjectType("AI_OR_AUTOMATION")).toBe("AI Or Automation");
    expect(friendlyProjectType("WEB_APPLICATION")).toBe("WEB Application");
  });
});
