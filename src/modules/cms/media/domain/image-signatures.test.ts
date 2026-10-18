import { describe, expect, it } from "vitest";

import { inspectImageSignature, validateImageDimensions } from "./image-signatures";

const png = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48,
  0x44, 0x52, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x03
]);

describe("image signature inspection", () => {
  it("reads PNG dimensions from a bounded header", () => {
    expect(inspectImageSignature(png)).toEqual({
      extension: "png",
      height: 3,
      mimeType: "image/png",
      width: 2
    });
  });

  it("rejects HTML, SVG, and truncated content", () => {
    expect(inspectImageSignature(new TextEncoder().encode("<svg/>"))).toBeNull();
    expect(inspectImageSignature(png.slice(0, 16))).toBeNull();
  });

  it("enforces width, height, and pixel bounds", () => {
    const image = inspectImageSignature(png);
    expect(image).not.toBeNull();
    if (image) {
      expect(
        validateImageDimensions(image, { maxHeight: 3, maxPixels: 6, maxWidth: 2 })
      ).toBe(true);
      expect(
        validateImageDimensions(image, { maxHeight: 2, maxPixels: 6, maxWidth: 2 })
      ).toBe(false);
    }
  });
});
