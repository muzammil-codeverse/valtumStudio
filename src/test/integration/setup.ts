import { Buffer } from "node:buffer";

import { vi } from "vitest";

const testSecret = Buffer.alloc(32, 17).toString("base64url");

process.env["APP_BASE_URL"] = "http://127.0.0.1:3000";
process.env["APP_ENV"] = "test";
process.env["AUTH_ABSOLUTE_SESSION_MAX_AGE_SECONDS"] = "604800";
process.env["AUTH_BOOTSTRAP_ENABLED"] = "false";
process.env["AUTH_FAILED_LOGIN_LOCK_SECONDS"] = "900";
process.env["AUTH_FAILED_LOGIN_MAX_ATTEMPTS"] = "10";
process.env["AUTH_FAILED_LOGIN_WINDOW_SECONDS"] = "900";
process.env["AUTH_IDENTIFIER_HASH_KEY"] = testSecret;
process.env["AUTH_SESSION_EXPIRES_SECONDS"] = "43200";
process.env["AUTH_SESSION_UPDATE_AGE_SECONDS"] = "3600";
process.env["AUTH_TRUSTED_ORIGINS"] = "http://127.0.0.1:3000";
process.env["BETTER_AUTH_SECRET"] = testSecret;
process.env["BETTER_AUTH_URL"] = "http://127.0.0.1:3000";
process.env["LEAD_IDENTIFIER_HASH_KEY"] = testSecret;

vi.mock("next/cache", () => ({
  unstable_cache: <T>(fn: T) => fn,
  revalidateTag: () => {},
  revalidatePath: () => {}
}));

vi.mock("next/headers", () => ({
  draftMode: async () => ({ isEnabled: false })
}));
