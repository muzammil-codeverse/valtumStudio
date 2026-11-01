import "server-only";

import { siteConfig } from "@/config/site";
import { isFrontendOnly } from "@/config/site-mode";

import type { HomePageData } from "./home-data";

export async function loadHomePageData(): Promise<HomePageData> {
  if (isFrontendOnly()) {
    return {
      projects: [],
      services: [],
      team: [],
      settings: { studioName: siteConfig.name }
    };
  }
  const cms = await import("./home-cms-loader");
  return cms.loadHomePageData();
}
