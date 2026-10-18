import { spawn } from "node:child_process";
import { resolve } from "node:path";

import {
  requireApprovedTestDatabaseUrl,
  resetApprovedTestDatabase
} from "../scripts/db/reset-test-database";
import { seedDatabase } from "./seed";

function requireTestDatabaseUrl(): string {
  const connectionString = process.env["TEST_DATABASE_URL"];

  if (connectionString === undefined || connectionString.length === 0) {
    throw new Error("TEST_DATABASE_URL must be configured before integration tests.");
  }

  return requireApprovedTestDatabaseUrl(
    connectionString,
    process.env["DEVELOPMENT_DATABASE_URL"] ?? process.env["DATABASE_URL"]
  );
}

function runMigrations(connectionString: string): Promise<void> {
  const prismaCli = resolve(
    process.cwd(),
    "node_modules",
    "prisma",
    "build",
    "index.js"
  );

  return new Promise((resolveMigration, rejectMigration) => {
    const child = spawn(process.execPath, [prismaCli, "migrate", "deploy"], {
      env: {
        ...process.env,
        DATABASE_URL: connectionString,
        DIRECT_URL: connectionString
      },
      stdio: "inherit"
    });

    child.once("error", rejectMigration);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolveMigration();
        return;
      }

      rejectMigration(
        new Error(
          `Prisma migrate deploy failed with code ${String(code)} and signal ${String(signal)}.`
        )
      );
    });
  });
}

async function prepareTestDatabase(): Promise<void> {
  const connectionString = requireTestDatabaseUrl();

  await resetApprovedTestDatabase(connectionString);
  await runMigrations(connectionString);
  await seedDatabase(connectionString);
}

prepareTestDatabase().catch((error: unknown) => {
  console.error("Test database preparation failed.", error);
  process.exitCode = 1;
});
