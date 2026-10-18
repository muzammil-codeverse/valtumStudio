import { describe, expect, it } from "vitest";

import { Prisma } from "@/generated/prisma/client";

import { isDatabaseUnavailableError } from "./database-error";

describe("isDatabaseUnavailableError", () => {
  it("classifies Prisma P1001 known request error as database unavailable", () => {
    const err = new Prisma.PrismaClientKnownRequestError(
      "Can't reach database server at 127.0.0.1:5434",
      {
        clientVersion: "5.0.0",
        code: "P1001"
      }
    );
    expect(isDatabaseUnavailableError(err)).toBe(true);
  });

  it("classifies Prisma P1002 timed out error as database unavailable", () => {
    const err = new Prisma.PrismaClientKnownRequestError("Timed out", {
      clientVersion: "5.0.0",
      code: "P1002"
    });
    expect(isDatabaseUnavailableError(err)).toBe(true);
  });

  it("classifies Prisma P1017 server closed connection error as database unavailable", () => {
    const err = new Prisma.PrismaClientKnownRequestError("Server closed connection", {
      clientVersion: "5.0.0",
      code: "P1017"
    });
    expect(isDatabaseUnavailableError(err)).toBe(true);
  });

  it("classifies Prisma P2002 constraint violation as NOT database unavailable", () => {
    const err = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      clientVersion: "5.0.0",
      code: "P2002"
    });
    expect(isDatabaseUnavailableError(err)).toBe(false);
  });

  it("classifies Prisma P2021 missing table error as NOT database unavailable", () => {
    const err = new Prisma.PrismaClientKnownRequestError(
      "Table does not exist in current database",
      {
        clientVersion: "5.0.0",
        code: "P2021"
      }
    );
    expect(isDatabaseUnavailableError(err)).toBe(false);
  });

  it("classifies PrismaClientInitializationError with P1001 as database unavailable", () => {
    const err = new Prisma.PrismaClientInitializationError(
      "Can't reach database server",
      "5.0.0",
      "P1001"
    );
    expect(isDatabaseUnavailableError(err)).toBe(true);
  });

  it("classifies direct network error with ECONNREFUSED code as database unavailable", () => {
    const err = { code: "ECONNREFUSED" };
    expect(isDatabaseUnavailableError(err)).toBe(true);
  });

  it("classifies cause chain network error with ENOTFOUND as database unavailable", () => {
    const err = new Error("Database query failed", {
      cause: { code: "ENOTFOUND" }
    });
    expect(isDatabaseUnavailableError(err)).toBe(true);
  });

  it("classifies nested driver-adapter error shape as database unavailable", () => {
    const err = {
      message: "Driver adapter error",
      meta: {
        driverAdapterError: {
          cause: {
            code: "ECONNREFUSED"
          }
        }
      }
    };
    expect(isDatabaseUnavailableError(err)).toBe(true);
  });

  it("classifies driver-adapter P1001 error shape as database unavailable", () => {
    const err = {
      meta: {
        driverAdapterError: {
          code: "P1001"
        }
      }
    };
    expect(isDatabaseUnavailableError(err)).toBe(true);
  });

  it("rejects arbitrary fake objects with unrelated nested code P1001", () => {
    const err = {
      foo: {
        bar: {
          code: "P1001"
        }
      }
    };
    expect(isDatabaseUnavailableError(err)).toBe(false);
  });

  it("rejects objects with arbitrary string matching P1001", () => {
    const err = {
      randomField: "P1001"
    };
    expect(isDatabaseUnavailableError(err)).toBe(false);
  });

  it("rejects standard programming errors", () => {
    expect(isDatabaseUnavailableError(new TypeError("Cannot read property"))).toBe(
      false
    );
    expect(isDatabaseUnavailableError(new SyntaxError("Unexpected token"))).toBe(false);
    expect(isDatabaseUnavailableError(new Error("Generic application failure"))).toBe(
      false
    );
  });

  it("rejects primitive inputs", () => {
    expect(isDatabaseUnavailableError(null)).toBe(false);
    expect(isDatabaseUnavailableError(undefined)).toBe(false);
    expect(isDatabaseUnavailableError("P1001")).toBe(false);
    expect(isDatabaseUnavailableError(1001)).toBe(false);
    expect(isDatabaseUnavailableError(true)).toBe(false);
  });
});
