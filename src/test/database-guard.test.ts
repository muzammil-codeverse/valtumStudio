import { describe, expect, it } from "vitest";

import { requireApprovedTestDatabaseUrl } from "../../scripts/db/reset-test-database";

const testDatabase =
  "postgresql://test-user:test-password@127.0.0.1:5432/siglum_test?schema=public";
const developmentDatabase =
  "postgresql://app-user:app-password@127.0.0.1:5432/siglum?schema=public";

describe("test database safety guard", () => {
  it("accepts the approved isolated test database", () => {
    expect(requireApprovedTestDatabaseUrl(testDatabase, developmentDatabase)).toBe(
      testDatabase
    );
  });

  it("fails closed when test and development URLs identify the same database", () => {
    expect(() => requireApprovedTestDatabaseUrl(testDatabase, testDatabase)).toThrow(
      "distinct from DATABASE_URL"
    );
  });

  it("does not allow a non-approved database name to be reset", () => {
    expect(() =>
      requireApprovedTestDatabaseUrl(developmentDatabase, testDatabase)
    ).toThrow("approved test database");
  });
});
