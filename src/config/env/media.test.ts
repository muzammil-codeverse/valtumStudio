import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { parseMediaEnvironment } from "./media";

const enabled = {
  MEDIA_S3_ACCESS_KEY_ID: "test-key",
  MEDIA_S3_BUCKET: "siglum-media-test",
  MEDIA_S3_ENDPOINT: "https://storage.example.test",
  MEDIA_S3_REGION: "auto",
  MEDIA_S3_SECRET_ACCESS_KEY: "test-secret",
  MEDIA_STORAGE_ENABLED: "true"
};

describe("media environment", () => {
  it("allows disabled storage without provider credentials", () => {
    expect(parseMediaEnvironment({ MEDIA_STORAGE_ENABLED: "false" })).toEqual({
      enabled: false
    });
  });

  it("parses bounded enabled configuration", () => {
    const environment = parseMediaEnvironment({
      ...enabled,
      MEDIA_PUBLIC_BASE_URL: "https://cdn.example.test/assets/"
    });
    expect(environment.enabled).toBe(true);
    if (environment.enabled) {
      expect(environment.MEDIA_PUBLIC_BASE_URL).toBe("https://cdn.example.test/assets");
      expect(environment.MEDIA_UPLOAD_URL_TTL_SECONDS).toBe(300);
    }
  });

  it.each([
    "MEDIA_S3_ACCESS_KEY_ID",
    "MEDIA_S3_BUCKET",
    "MEDIA_S3_ENDPOINT",
    "MEDIA_S3_REGION",
    "MEDIA_S3_SECRET_ACCESS_KEY"
  ])("rejects enabled storage missing %s", (key) => {
    const input = { ...enabled };
    delete input[key as keyof typeof input];
    expect(() => parseMediaEnvironment(input)).toThrow();
  });

  it("rejects unsafe URLs and unbounded limits", () => {
    expect(() =>
      parseMediaEnvironment({
        ...enabled,
        MEDIA_PUBLIC_BASE_URL: "https://user:pass@example.test"
      })
    ).toThrow();
    expect(() =>
      parseMediaEnvironment({ ...enabled, MEDIA_MAX_IMAGE_BYTES: "999999999" })
    ).toThrow();
    expect(() =>
      parseMediaEnvironment({ ...enabled, MEDIA_STORAGE_ENABLED: "yes" })
    ).toThrow();
  });
});
