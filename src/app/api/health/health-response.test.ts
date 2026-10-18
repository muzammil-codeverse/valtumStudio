import { describe, expect, it } from "vitest";

import { createHealthResponse } from "@/app/api/health/health-response";

describe("createHealthResponse", () => {
  it("creates a stable liveness payload", () => {
    const timestamp = new Date("2026-07-12T00:00:00.000Z");

    expect(createHealthResponse(timestamp)).toEqual({
      service: "siglum-studio-web",
      status: "ok",
      timestamp: "2026-07-12T00:00:00.000Z"
    });
  });
});
