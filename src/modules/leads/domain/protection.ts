import { createHmac } from "node:crypto";

export function startOfUtcWindow(timestamp: Date, windowMs: number): Date {
  if (!Number.isSafeInteger(windowMs) || windowMs <= 0) {
    throw new Error("Lead protection windows must be positive integer milliseconds.");
  }
  return new Date(Math.floor(timestamp.getTime() / windowMs) * windowMs);
}

export function hashLeadIdentifier(key: string, domain: string, value: string): string {
  return createHmac("sha256", key).update(`${domain}:${value}`).digest("base64url");
}

export function createDuplicateFingerprint(
  key: string,
  input: Readonly<{ email: string; projectSummary: string; projectType: string }>
): string {
  return hashLeadIdentifier(
    key,
    "lead-deduplication:v1",
    `${input.email}\n${input.projectType}\n${input.projectSummary}`
  );
}

export function isRateLimitBlocked(
  blockedUntil: Date | null,
  timestamp: Date
): boolean {
  return blockedUntil !== null && blockedUntil > timestamp;
}
