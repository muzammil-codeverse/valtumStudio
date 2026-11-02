import { describe, expect, it } from "vitest";

import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "./structured-data";

describe("Valtum official brand identity schema", () => {
  const settings = { studioName: "Valtum Studio" };
  const origin = "https://valtumstudio.com.au";

  it("provides Valtum as the alternate name for both website and organization", () => {
    expect(buildWebSiteJsonLd(origin, settings)).toMatchObject({
      name: "Valtum Studio",
      alternateName: "Valtum"
    });
    expect(buildOrganizationJsonLd(origin, settings)).toMatchObject({
      name: "Valtum Studio",
      alternateName: "Valtum"
    });
  });

  it("links only confirmed company identities and preserves configured social profiles", () => {
    const org = buildOrganizationJsonLd(origin, {
      ...settings,
      publicSocialLinks: { linkedinUrl: "https://www.linkedin.com/company/valtum-studio/" }
    });
    expect(org.sameAs).toContain("https://clutch.co/profile/valtum-studio");
    expect(org.sameAs).toContain("https://themanifest.com/company/valtum-studio");
    expect(org.sameAs).toContain("https://www.linkedin.com/company/valtum-studio/");
    expect(org.url).toBe(origin);
  });
});
