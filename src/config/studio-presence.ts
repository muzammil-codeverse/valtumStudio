/**
 * Public contact details and owner-supplied profile URLs for Valtum Studio.
 * Keep personal founder identity separate from studio-owned platforms.
 */
export const studioContact = {
  email: "hello@valtumstudio.com.au",
  phone: "+61404412079",
  phoneDisplay: "+61 404 412 079",
  whatsApp: "https://wa.me/61404412079"
} as const;

export const studioSocialProfiles = [
  {
    label: "Instagram",
    url: "https://www.instagram.com/valtumstudio/",
    icon: "instagram"
  },
  {
    label: "Facebook",
    url: "https://www.facebook.com/people/Valtum-Studio/61596234295885/",
    icon: "facebook"
  },
  {
    label: "X",
    url: "https://x.com/valtumstudio",
    icon: "x"
  }
] as const;

export const studioMarketplaces = [
  {
    label: "Clutch",
    url: "https://clutch.co/profile/valtum-studio",
    icon: "clutch"
  },
  {
    label: "Upwork",
    url: "https://www.upwork.com/agencies/2112656975952381986/",
    icon: "upwork"
  },
  {
    label: "Fiverr",
    url: "https://www.fiverr.com/valtumstudio",
    icon: "fiverr"
  }
] as const;

export const studioFounderProfile = {
  label: "LinkedIn · Founder",
  url: "https://www.linkedin.com/in/abdurrehmankhalid/",
  icon: "linkedin"
} as const;

export const studioOrganizationProfiles = [
  ...studioSocialProfiles.map((profile) => profile.url),
  ...studioMarketplaces.map((profile) => profile.url),
  "https://themanifest.com/company/valtum-studio",
  "https://abr.business.gov.au/ABN/View?id=24207947663"
] as const;
