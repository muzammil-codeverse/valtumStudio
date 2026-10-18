import { describe, expect, it } from "vitest";

import { parseServerEnvironment } from "@/config/env/shared";

const validEnvironment = {
  APP_BASE_URL: "http://localhost:3000",
  APP_ENV: "test",
  DATABASE_URL: "postgresql://test:test@localhost:5432/siglum",
  DIRECT_URL: "postgresql://test:test@localhost:5432/siglum",
  LOG_LEVEL: "info"
} as const;

describe("parseServerEnvironment", () => {
  it("returns an immutable environment with valid values", () => {
    const environment = parseServerEnvironment(validEnvironment);

    expect(environment).toEqual(validEnvironment);
    expect(Object.isFrozen(environment)).toBe(true);
  });

  it("rejects unsupported application environments", () => {
    expect(() =>
      parseServerEnvironment({
        ...validEnvironment,
        APP_ENV: "development"
      })
    ).toThrow("APP_ENV");
  });

  it("rejects invalid base URLs", () => {
    expect(() =>
      parseServerEnvironment({
        ...validEnvironment,
        APP_BASE_URL: "not-a-url"
      })
    ).toThrow("APP_BASE_URL");
  });

  it("rejects an invalid database URL", () => {
    expect(() =>
      parseServerEnvironment({
        ...validEnvironment,
        DATABASE_URL: "not-a-url"
      })
    ).toThrow("DATABASE_URL");
  });
});
