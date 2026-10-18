import { describe, expect, it } from "vitest";

import { failure, success } from "./action-result";

describe("action results", () => {
  it("omits absent optional properties", () => {
    expect(success({ id: "service-1" })).toEqual({
      ok: true,
      data: { id: "service-1" }
    });
    expect(failure("VALIDATION_ERROR", "Invalid input")).toEqual({
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Invalid input"
    });
  });
});
