import { describe, expect, it } from "vitest";

import {
  CONSENT_AGE_SECONDS,
  CONSENT_REVISION,
  parseCookieChoices
} from "./cookie-policy";

describe("Public cookie preferences", () => {
  const time = Date.UTC(2026, 10, 2);
  const record = (analytics: boolean, updatedAt = time) =>
    JSON.stringify({
      revision: CONSENT_REVISION,
      analytics,
      functional: false,
      updatedAt
    });

  it("starts without optional consent", () => {
    expect(parseCookieChoices(undefined, time)).toBeNull();
    expect(parseCookieChoices("invalid", time)).toBeNull();
  });

  it("keeps explicit acceptance and refusal within retention", () => {
    expect(parseCookieChoices(record(true), time)).toMatchObject({
      revision: 1,
      analytics: true,
      functional: false
    });
    expect(parseCookieChoices(record(false), time)).toMatchObject({
      revision: 1,
      analytics: false,
      functional: false
    });
    expect(
      parseCookieChoices(record(true), time + CONSENT_AGE_SECONDS * 1000 + 1)
    ).toBeNull();
  });

  it("rejects invalid, outdated, future and malformed consent records", () => {
    expect(
      parseCookieChoices(
        JSON.stringify({
          revision: 0,
          analytics: true,
          functional: false,
          updatedAt: time
        }),
        time
      )
    ).toBeNull();
    expect(
      parseCookieChoices(
        JSON.stringify({
          revision: 1,
          analytics: "yes",
          functional: false,
          updatedAt: time
        }),
        time
      )
    ).toBeNull();
    expect(parseCookieChoices(record(true, time + 1), time)).toBeNull();
  });
});
