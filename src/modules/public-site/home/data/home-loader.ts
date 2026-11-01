import "server-only";

import type { HomePageData } from "./home-data";

export async function loadHomePageData(): Promise<HomePageData> {
  const cms = await import("./home-cms-loader");
  return cms.loadHomePageData();
}
