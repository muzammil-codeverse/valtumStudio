import { describe, expect, it } from "vitest";

import { assertRevisionMatch, requireUpdateIdentity } from "./concurrency";
describe("optimistic concurrency", () => {
  it("rejects stale update counts", () => {
    expect(() => assertRevisionMatch(0)).toThrow("CMS_CONFLICT");
    expect(() => assertRevisionMatch(1)).not.toThrow();
  });

  it("requires a revision when updating content", () => {
    expect(() => requireUpdateIdentity("service-1", undefined)).toThrow(
      "record identifier and revision"
    );
    expect(requireUpdateIdentity("service-1", 3)).toEqual({
      id: "service-1",
      revision: 3
    });
  });
});
