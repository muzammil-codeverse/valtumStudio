import { describe, expect, it } from "vitest";

import {
  CONSENT_MAX_AGE_MS,
  createConsentRecord,
  readStoredConsent
} from "./cookie-storage";

describe("Public cookie preferences", () => {
  const time = Date.UTC(2026, 10, 2);
  it("starts without optional consent", () => {
    expect(readStoredConsent(null, time)).toBeNull();
    expect(readStoredConsent("invalid", time)).toBeNull();
  });
  it("keeps explicit acceptance and refusal only within the retention window", () => {
    expect(
      readStoredConsent(JSON.stringify(createConsentRecord(true, time)), time)
    ).toMatchObject({ analytics: true, version: 1 });
    expect(
      readStoredConsent(JSON.stringify(createConsentRecord(false, time)), time)
    ).toMatchObject({ analytics: false, version: 1 });
    expect(
      readStoredConsent(
        JSON.stringify(createConsentRecord(true, time)),
        time + CONSENT_MAX_AGE_MS + 1
      )
    ).toBeNull();
  });
  it("rejects invalid, outdated, future and malformed consent records", () => {
    expect(
      readStoredConsent(
        JSON.stringify({ version: 0, analytics: true, savedAt: time }),
        time
      )
    ).toBeNull();
    expect(
      readStoredConsent(
        JSON.stringify({ version: 1, analytics: "yes", savedAt: time }),
        time
      )
    ).toBeNull();
    expect(
      readStoredConsent(JSON.stringify(createConsentRecord(true, time + 1)), time)
    ).toBeNull();
  });
});
