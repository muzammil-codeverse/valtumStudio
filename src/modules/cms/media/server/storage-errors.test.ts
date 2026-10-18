import { describe, expect, it } from "vitest";

import { toStorageError } from "./storage-errors";

describe("storage error mapping", () => {
  it("maps only explicit provider conditions", () => {
    expect(toStorageError({ name: "NoSuchKey" }).code).toBe("NOT_FOUND");
    expect(toStorageError({ name: "AccessDenied" }).code).toBe("ACCESS_DENIED");
    expect(toStorageError({ name: "SlowDown" }).code).toBe("THROTTLED");
    expect(toStorageError({ $metadata: { httpStatusCode: 503 } }).code).toBe(
      "PROVIDER_UNAVAILABLE"
    );
  });

  it("does not turn unrelated provider errors into not found", () => {
    expect(toStorageError({ name: "MalformedRequest" }).code).toBe("UNEXPECTED");
    expect(toStorageError({ $metadata: { httpStatusCode: 400 } }).code).toBe(
      "UNEXPECTED"
    );
  });
});
