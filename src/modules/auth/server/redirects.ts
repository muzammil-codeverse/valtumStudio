import "server-only";

import { authEnv } from "@/config/env/server";

const permittedInternalPrefixes = ["/admin", "/auth"];

export function safeAuthRedirect(
  value: string | null | undefined,
  fallback = "/admin"
): string {
  if (value === undefined || value === null || value.length === 0) {
    return fallback;
  }
  if (value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  if (value.startsWith("/")) {
    return permittedInternalPrefixes.some(
      (prefix) => value === prefix || value.startsWith(`${prefix}/`)
    )
      ? value
      : fallback;
  }

  try {
    const parsed = new URL(value);
    return authEnv.trustedOrigins.includes(parsed.origin) &&
      permittedInternalPrefixes.some(
        (prefix) =>
          parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`)
      )
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
