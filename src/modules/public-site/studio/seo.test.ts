import { afterEach, describe, expect, it, vi } from "vitest";

import {
  indexablePublicPaths,
  mayIndexPublicSite,
  pageSeo,
  projectSeo,
  publicCanonical,
  publicPageMetadata,
  SEO_SOCIAL_IMAGE,
  serviceSeo
} from "./seo";

afterEach(() => vi.unstubAllEnvs());

describe("Valtum public SEO", () => {
  it("uses a brand-first homepage title for navigational searches", () => {
    expect(pageSeo.home.title).toMatch(/^Valtum Studio \| /);
  });

  it("lists only real indexable marketing, service and case study routes", () => {
    const paths = indexablePublicPaths();
    expect(paths).toHaveLength(22);
    expect(paths).toContain("/cookies");
    expect(paths).not.toContain("/cookie");
    expect(paths).not.toContain("/journal");
    expect(paths).not.toContain("/start-a-project");
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toContain("/services/digital-products");
    expect(paths).toContain("/work/aegis-sentinel");
    expect(paths).not.toContain("/admin");
    expect(paths).not.toContain("/portal");
    expect(paths).not.toContain("/about");
    expect(paths).not.toContain("/process");
  });

  it("requires real canonical production configuration to allow indexing", () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("APP_BASE_URL", "https://valtumstudio.com.au/");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(mayIndexPublicSite()).toBe(true);
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(mayIndexPublicSite()).toBe(false);
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("APP_BASE_URL", "https://example.com");
    expect(mayIndexPublicSite()).toBe(false);
  });

  it("sets canonical, OG and noindex in preview environments", () => {
    vi.stubEnv("APP_ENV", "preview");
    const meta = publicPageMetadata(pageSeo.home, "/");
    expect(meta.alternates).toEqual({ canonical: "https://valtumstudio.com.au" });
    expect(meta.robots).toMatchObject({ index: false, follow: false });
    expect(meta.openGraph).toMatchObject({ siteName: "Valtum Studio" });
  });

  it("uses the approved homepage hero for social sharing", () => {
    const metadata = publicPageMetadata(pageSeo.home, "/");
    expect(SEO_SOCIAL_IMAGE).toContain("/social-hero-2026-11.png");
    expect(metadata.openGraph?.images).toMatchObject([
      { url: SEO_SOCIAL_IMAGE, width: 1200, height: 630 }
    ]);
  });

  it("uses authentic project screenshots for case-study link previews", () => {
    const metadata = publicPageMetadata(
      projectSeo["aegis-sentinel"] ?? pageSeo.work,
      "/work/aegis-sentinel",
      "/products/aegis.webp"
    );
    expect(metadata.openGraph?.images).toMatchObject([
      {
        url: "https://valtumstudio.com.au/products/aegis.webp",
        width: 1440,
        height: 900
      }
    ]);
  });

  it("gives each live service and case study a distinct, useful SEO title", () => {
    const all = [
      ...Object.values(pageSeo),
      ...Object.values(serviceSeo),
      ...Object.values(projectSeo)
    ];
    expect(new Set(all.map((item) => item.title)).size).toBe(all.length);
    expect(all.every((item) => item.description.length >= 75)).toBe(true);
  });

  it("does not accept open redirect syntax as a canonical path", () => {
    expect(() => publicCanonical("//outside.example")).toThrow();
    expect(() => publicCanonical("/work?fake=1")).toThrow();
  });
});
