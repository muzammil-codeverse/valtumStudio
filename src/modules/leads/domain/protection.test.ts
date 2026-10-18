import { describe, expect, it } from "vitest";

import {
  createDuplicateFingerprint,
  hashLeadIdentifier,
  isRateLimitBlocked,
  startOfUtcWindow
} from "./protection";

const fifteenMinutes = 15 * 60 * 1000;
const oneHour = 60 * 60 * 1000;
const testKey = "test-key-that-is-long-enough-to-model-a-secret-in-unit-tests";

describe("deterministic lead protection windows", () => {
  it("maps every timestamp in the same UTC rate-limit window to one bucket", () => {
    const first = startOfUtcWindow(new Date("2026-07-14T10:04:00.001Z"), oneHour);
    const later = startOfUtcWindow(new Date("2026-07-14T10:59:59.999Z"), oneHour);
    expect(first).toEqual(new Date("2026-07-14T10:00:00.000Z"));
    expect(later).toEqual(first);
  });

  it("separates timestamps across a rate-limit boundary", () => {
    const before = startOfUtcWindow(new Date("2026-07-14T10:59:59.999Z"), oneHour);
    const after = startOfUtcWindow(new Date("2026-07-14T11:00:00.000Z"), oneHour);
    expect(after).not.toEqual(before);
  });

  it("uses scope-specific keys while preserving a single bucket per scope", () => {
    const requester = hashLeadIdentifier(
      testKey,
      "lead-rate-limit:v1:requester",
      "safe-id"
    );
    const email = hashLeadIdentifier(testKey, "lead-rate-limit:v1:email", "safe-id");
    expect(requester).not.toBe(email);
    expect(
      startOfUtcWindow(new Date("2026-07-14T10:00:00.001Z"), fifteenMinutes)
    ).toEqual(startOfUtcWindow(new Date("2026-07-14T10:14:59.999Z"), fifteenMinutes));
  });

  it("enforces blocked-until inclusively only before expiry and permits a new window", () => {
    const blockedUntil = new Date("2026-07-14T10:15:00.000Z");
    expect(isRateLimitBlocked(blockedUntil, new Date("2026-07-14T10:14:59.999Z"))).toBe(
      true
    );
    expect(isRateLimitBlocked(blockedUntil, blockedUntil)).toBe(false);
    expect(
      startOfUtcWindow(new Date("2026-07-14T10:15:00.000Z"), fifteenMinutes)
    ).not.toEqual(
      startOfUtcWindow(new Date("2026-07-14T10:14:59.999Z"), fifteenMinutes)
    );
  });
});

describe("deterministic duplicate suppression", () => {
  it("keeps an identical submission in the same duplicate window", () => {
    const input = {
      email: "ada@example.test",
      projectType: "WEB_APPLICATION",
      projectSummary: "A carefully scoped project summary."
    };
    const fingerprint = createDuplicateFingerprint(testKey, input);
    expect(createDuplicateFingerprint(testKey, input)).toBe(fingerprint);
    expect(
      startOfUtcWindow(new Date("2026-07-14T10:00:00.001Z"), fifteenMinutes)
    ).toEqual(startOfUtcWindow(new Date("2026-07-14T10:14:59.999Z"), fifteenMinutes));
  });

  it("allows a later window and distinguishes a different enquiry for the same email", () => {
    const first = {
      email: "ada@example.test",
      projectType: "WEB_APPLICATION",
      projectSummary: "A carefully scoped project summary."
    };
    const second = { ...first, projectSummary: "A different later enquiry." };
    expect(createDuplicateFingerprint(testKey, first)).not.toBe(
      createDuplicateFingerprint(testKey, second)
    );
    expect(
      startOfUtcWindow(new Date("2026-07-14T10:15:00.000Z"), fifteenMinutes)
    ).not.toEqual(
      startOfUtcWindow(new Date("2026-07-14T10:14:59.999Z"), fifteenMinutes)
    );
  });
});
