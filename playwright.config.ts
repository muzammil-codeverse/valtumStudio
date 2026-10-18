import { randomBytes } from "node:crypto";

import { defineConfig, devices } from "@playwright/test";

const chromiumProject = {
  name: "chromium",
  use: { ...devices["Desktop Chrome"], channel: "chromium" }
};
const testBaseUrl = "http://127.0.0.1:3100";
const temporarySecret = () => randomBytes(32).toString("base64url");

export default defineConfig({
  forbidOnly: Boolean(process.env["CI"]),
  fullyParallel: true,
  outputDir: "test-results",
  reporter: process.env["CI"] ? "github" : "list",
  retries: process.env["CI"] ? 2 : 0,
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: testBaseUrl,
    trace: "on-first-retry"
  },
  webServer: {
    command: "corepack pnpm exec next dev --webpack --port 3100",
    env: {
      ...process.env,
      APP_BASE_URL: testBaseUrl,
      APP_ENV: "test",
      AUTH_ABSOLUTE_SESSION_MAX_AGE_SECONDS: "604800",
      AUTH_BOOTSTRAP_ENABLED: "false",
      AUTH_FAILED_LOGIN_LOCK_SECONDS: "900",
      AUTH_FAILED_LOGIN_MAX_ATTEMPTS: "10",
      AUTH_FAILED_LOGIN_WINDOW_SECONDS: "900",
      AUTH_IDENTIFIER_HASH_KEY:
        process.env["AUTH_IDENTIFIER_HASH_KEY"] || temporarySecret(),
      AUTH_SESSION_EXPIRES_SECONDS: "43200",
      AUTH_SESSION_UPDATE_AGE_SECONDS: "3600",
      AUTH_TRUSTED_ORIGINS: testBaseUrl,
      BETTER_AUTH_SECRET: process.env["BETTER_AUTH_SECRET"] || temporarySecret(),
      BETTER_AUTH_URL: testBaseUrl,
      NEXT_DIST_DIR: ".next-playwright"
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: testBaseUrl
  },
  projects: [chromiumProject]
});
