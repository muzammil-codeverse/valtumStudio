import { resolve } from "node:path";

import { config } from "dotenv";
import { defineConfig } from "vitest/config";

config({ path: process.env["ENV_FILE"] ?? ".env.local" });

export default defineConfig({
  resolve: {
    alias: { "server-only": resolve(process.cwd(), "src/test/server-only.ts") },
    tsconfigPaths: true
  },
  test: {
    environment: "node",
    hookTimeout: 30_000,
    include: ["src/**/*.integration.test.{ts,tsx}"],
    maxWorkers: 1,
    pool: "forks",
    setupFiles: ["./src/test/integration/setup.ts"],
    testTimeout: 30_000
  }
});
