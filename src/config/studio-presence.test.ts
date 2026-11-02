import { describe, expect, it } from "vitest";

import {
  studioContact,
  studioFounderProfile,
  studioMarketplaces,
  studioOrganizationProfiles,
  studioSocialProfiles
} from "./studio-presence";

describe("Valtum official contact and profile directory", () => {
  it("uses one E.164 number for calls and WhatsApp", () => {
    expect(studioContact.phone).toMatch(/^\+[1-9]\d{7,14}$/);
    expect(studioContact.whatsApp).toBe(
      `https://wa.me/${studioContact.phone.slice(1)}`
    );
    expect(studioContact.email).toBe("hello@valtumstudio.com.au");
  });

  it("publishes exact owner-supplied studio URLs without mixing the founder profile", () => {
    const official = [...studioSocialProfiles, ...studioMarketplaces];
    expect(official).toHaveLength(6);
    expect(new Set(official.map((profile) => profile.url)).size).toBe(6);
    expect(studioOrganizationProfiles).toContain(
      "https://www.upwork.com/agencies/2112656975952381986/"
    );
    expect(studioOrganizationProfiles).toContain("https://www.fiverr.com/valtumstudio");
    expect(studioOrganizationProfiles).not.toContain(studioFounderProfile.url);
    expect(studioFounderProfile.label).toContain("Founder");
  });
});
