import { afterEach, describe, expect, it, vi } from "vitest";

import robots from "./robots";

afterEach(() => vi.unstubAllEnvs());

describe("robots.txt indexability", () => {
  it("blocks nonproduction environments", () => {
    vi.stubEnv("APP_ENV", "preview");
    expect(robots().rules).toEqual({ userAgent: "*", disallow: "/" });
  });

  it("allows Google to fetch CSS, scripts and images on the canonical site", () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("APP_BASE_URL", "https://valtumstudio.com.au/");
    vi.stubEnv("VERCEL_ENV", "production");
    const policy = robots();
    const rule = policy.rules;
    expect(rule).toMatchObject({ userAgent: "*", allow: "/" });
    expect(JSON.stringify(rule)).not.toContain("/_next");
    expect(JSON.stringify(rule)).not.toContain("/static");
    expect(JSON.stringify(rule)).toContain("/portal");
    expect(policy.sitemap).toBe("https://valtumstudio.com.au/sitemap.xml");
  });
});
