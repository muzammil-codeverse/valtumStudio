export const CONSENT_STORAGE_KEY = "valtum-cookie-preferences-v1";
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

export type ConsentRecord = Readonly<{
  version: 1;
  analytics: boolean;
  savedAt: number;
}>;

export function createConsentRecord(analytics: boolean, now = Date.now()): ConsentRecord {
  return { version: CONSENT_VERSION, analytics, savedAt: now };
}

export function readStoredConsent(raw: string | null, now = Date.now()): ConsentRecord | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const record = value as Partial<ConsentRecord>;
    if (
      record.version !== CONSENT_VERSION ||
      typeof record.analytics !== "boolean" ||
      typeof record.savedAt !== "number" ||
      !Number.isFinite(record.savedAt) ||
      record.savedAt > now ||
      now - record.savedAt > CONSENT_MAX_AGE_MS
    ) return null;
    return record as ConsentRecord;
  } catch {
    return null;
  }
}
