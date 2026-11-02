export const CONSENT_COOKIE = "valtum_cookie_choices";
export const CONSENT_REVISION = 1;
export const CONSENT_AGE_SECONDS = 60 * 60 * 24 * 180;

export type CookieChoices = Readonly<{
  revision: 1;
  analytics: boolean;
  functional: boolean;
  updatedAt: number;
}>;

export function parseCookieChoices(input: string | undefined): CookieChoices | null {
  if (!input || input.length > 400) return null;
  try {
    const value: unknown = JSON.parse(input);
    if (
      typeof value !== "object" ||
      value === null ||
      !("revision" in value) ||
      value.revision !== CONSENT_REVISION ||
      !("analytics" in value) ||
      typeof value.analytics !== "boolean" ||
      !("functional" in value) ||
      typeof value.functional !== "boolean" ||
      !("updatedAt" in value) ||
      typeof value.updatedAt !== "number" ||
      !Number.isFinite(value.updatedAt)
    ) {
      return null;
    }
    return {
      revision: CONSENT_REVISION,
      analytics: value.analytics,
      functional: value.functional,
      updatedAt: value.updatedAt
    };
  } catch {
    return null;
  }
}
