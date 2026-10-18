import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true
  },
  test: {
    coverage: {
      exclude: ["src/test/**", "src/**/*.d.ts"],
      include: [
        "src/app/api/health/health-response.ts",
        "src/config/env/**/*.ts",
        "src/lib/errors/**/*.ts"
      ],
      provider: "v8",
      reporter: ["text", "html", "lcov"]
    },
    environment: "jsdom",
    exclude: ["src/**/*.integration.test.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    globals: false,
    setupFiles: ["./src/test/setup.ts"]
  }
});
