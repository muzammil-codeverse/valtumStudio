import { describe, expect, it } from "vitest";

import {
  isValidUploadRequestToken,
  normalizeOriginalFilename,
  validateMediaUpload
} from "./validation";
describe("media validation", () => {
  it("rejects unsafe SVG", () =>
    expect(validateMediaUpload("image/svg+xml", 100)).toContain("Only JPEG"));
  it("normalizes display-only filenames", () => {
    expect(normalizeOriginalFilename("  portrait\u0000.webp  ")).toBe("portrait.webp");
  });
  it("requires bounded opaque upload tokens", () => {
    expect(isValidUploadRequestToken("x".repeat(16))).toBe(true);
    expect(isValidUploadRequestToken("short")).toBe(false);
  });
});
