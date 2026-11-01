import { describe, expect, it } from "vitest";

import { signCloudinaryParameters } from "./cloudinary-signature";

describe("Cloudinary parameter signatures", () => {
  it("matches the published minimal authentication vector", () => {
    expect(signCloudinaryParameters({ timestamp: "1315060510" }, "abcd")).toBe(
      "a21ad0f63beb4de2e5575204b79ab90bffb02c10"
    );
  });

  it("sorts parameters independent of insertion order", () => {
    const secret = "test-secret";
    expect(
      signCloudinaryParameters(
        { timestamp: "123", public_id: "valtum/photo", overwrite: "true" },
        secret
      )
    ).toBe(
      signCloudinaryParameters(
        { overwrite: "true", public_id: "valtum/photo", timestamp: "123" },
        secret
      )
    );
  });
});
