import { afterEach, describe, expect, it, vi } from "vitest";

import sitemap from "./sitemap";

afterEach(() => vi.unstubAllEnvs());

describe("public sitemap", () => {
  it("does not advertise preview URLs", () => {
    vi.stubEnv("APP_ENV", "preview");
    expect(sitemap()).toEqual([]);
  });

  it("enumerates the real canonical pages without private or redirected URLs", () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("APP_BASE_URL", "https://valtumstudio.com.au/");
    vi.stubEnv("VERCEL_ENV", "production");
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toHaveLength(17);
    expect(urls).toContain("https://valtumstudio.com.au/services/connected-operations");
    expect(urls).toContain("https://valtumstudio.com.au/work/kt-couriers");
    expect(urls.every((url) => url.startsWith("https://valtumstudio.com.au"))).toBe(
      true
    );
    expect(urls.some((url) => /\/(admin|portal|auth|about|process)/.test(url))).toBe(
      false
    );
  });
});
