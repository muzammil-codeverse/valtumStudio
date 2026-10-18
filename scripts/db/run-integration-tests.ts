import { spawn } from "node:child_process";
import { resolve } from "node:path";

import { config } from "dotenv";

import { requireApprovedTestDatabaseUrl } from "./reset-test-database";

config({ path: process.env["ENV_FILE"] ?? ".env.local" });

function testDatabaseUrl(): string {
  const value = process.env["TEST_DATABASE_URL"];
  if (value === undefined || value.length === 0)
    throw new Error("TEST_DATABASE_URL is required for integration tests.");
  return requireApprovedTestDatabaseUrl(value, process.env["DATABASE_URL"]);
}

function run(
  command: string,
  arguments_: readonly string[],
  environment: NodeJS.ProcessEnv
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, arguments_, { env: environment, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            `${command} ${arguments_.join(" ")} failed with exit code ${String(code)}.`
          )
        );
    });
  });
}

const databaseUrl = testDatabaseUrl();
const developmentDatabaseUrl = process.env["DATABASE_URL"];
const environment = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  DEVELOPMENT_DATABASE_URL: developmentDatabaseUrl,
  DIRECT_URL: databaseUrl
};

await run(
  process.execPath,
  [
    resolve(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"),
    "--env-file=.env.local",
    "prisma/test-database.ts"
  ],
  environment
);
await run(
  process.execPath,
  [
    resolve(process.cwd(), "node_modules", "vitest", "vitest.mjs"),
    "run",
    "--config",
    "vitest.integration.config.ts"
  ],
  environment
);
