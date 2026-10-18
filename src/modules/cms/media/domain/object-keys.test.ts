import { describe, expect, it } from "vitest";

import {
  createIncomingObjectKey,
  createVerifiedObjectKey,
  publicUrlForObject
} from "./object-keys";

describe("media object keys", () => {
  it("creates a non-user-controlled incoming key", () => {
    const key = createIncomingObjectKey({
      assetId: "0f42fb16-e220-4e8a-b47d-99ae5d7599de",
      extension: "png",
      nonce: "2669b1f9-a733-4f1b-b0df-20d9f0373730",
      prefix: "siglum"
    });
    expect(key).toBe(
      "siglum/incoming/media/0f42fb16-e220-4e8a-b47d-99ae5d7599de/2669b1f9-a733-4f1b-b0df-20d9f0373730.png"
    );
    expect(key).not.toContain("portrait");
  });

  it("uses verified extension and safely joins public URLs", () => {
    const key = createVerifiedObjectKey({
      assetId: "0f42fb16-e220-4e8a-b47d-99ae5d7599de",
      checksum: "a".repeat(64),
      createdAt: new Date("2026-07-14T00:00:00Z"),
      extension: "webp",
      prefix: "siglum"
    });
    expect(key).toContain(".webp");
    expect(publicUrlForObject("https://cdn.example.test/assets/", key)).toContain(
      "/assets/siglum/public/media/2026/07/"
    );
  });

  it("rejects traversal-shaped identifiers", () => {
    expect(() =>
      createIncomingObjectKey({
        assetId: "..",
        extension: "png",
        nonce: "safe",
        prefix: "siglum"
      })
    ).toThrow();
  });
});
