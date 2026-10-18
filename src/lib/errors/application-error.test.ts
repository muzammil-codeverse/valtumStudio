import { describe, expect, it } from "vitest";

import { ApplicationError } from "@/lib/errors";

describe("ApplicationError", () => {
  it("keeps its public contract separate from internal metadata", () => {
    const error = new ApplicationError(
      "VALIDATION_FAILED",
      "Please review the input.",
      {
        metadata: { field: "email" },
        retryable: true
      }
    );

    expect(error.toPublicError()).toEqual({
      code: "VALIDATION_FAILED",
      message: "Please review the input.",
      retryable: true
    });
    expect(error.metadata).toEqual({ field: "email" });
  });
});
