import { fileURLToPath, URL } from "node:url";

import { createPrismaClient } from "@/lib/database/create-client";

const approvedDatabaseName = "siglum_test";

function normalizedDatabaseIdentity(value: string, label: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid PostgreSQL connection URL.`);
  }

  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error(`${label} must use a PostgreSQL protocol.`);
  }

  const schema = parsed.searchParams.get("schema") ?? "public";
  const port = parsed.port === "" ? "5432" : parsed.port;
  return `${parsed.protocol}//${parsed.hostname.toLowerCase()}:${port}/${decodeURIComponent(parsed.pathname).replace(/^\//, "")}?schema=${schema}`;
}

export function requireApprovedTestDatabaseUrl(
  value: string | undefined,
  developmentDatabaseUrl: string | undefined = process.env["DATABASE_URL"]
): string {
  if (value === undefined || value.length === 0) {
    throw new Error("TEST_DATABASE_URL must be configured.");
  }

  const testIdentity = normalizedDatabaseIdentity(value, "TEST_DATABASE_URL");
  if (developmentDatabaseUrl === undefined || developmentDatabaseUrl.length === 0) {
    throw new Error("DATABASE_URL is required to verify test database isolation.");
  }
  const developmentIdentity = normalizedDatabaseIdentity(
    developmentDatabaseUrl,
    "DATABASE_URL"
  );
  if (testIdentity === developmentIdentity) {
    throw new Error(
      "TEST_DATABASE_URL must identify a database distinct from DATABASE_URL before reset."
    );
  }

  const parsed = new URL(value);

  const databaseName = decodeURIComponent(parsed.pathname).replace(/^\//, "");
  if (databaseName !== approvedDatabaseName) {
    throw new Error(
      "Refusing to reset a database other than the approved test database."
    );
  }

  return value;
}

export async function resetApprovedTestDatabase(
  connectionString: string
): Promise<void> {
  const prisma = createPrismaClient(connectionString);
  try {
    await prisma.$executeRawUnsafe("DROP SCHEMA public CASCADE");
    await prisma.$executeRawUnsafe("CREATE SCHEMA public");
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const connectionString = requireApprovedTestDatabaseUrl(
    process.env["TEST_DATABASE_URL"],
    process.env["DEVELOPMENT_DATABASE_URL"] ?? process.env["DATABASE_URL"]
  );
  resetApprovedTestDatabase(connectionString).catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Test database reset failed."
    );
    process.exitCode = 1;
  });
}
