import type { Metadata } from "next";

import { isDatabaseUnavailableError } from "@/lib/errors";
import { logger } from "@/lib/logging";
import { buildSiteMetadata } from "@/modules/public-content/domain/metadata";
import { getPublicSettings } from "@/modules/public-content/server/settings";
import { loadHomePageData } from "@/modules/public-site/home/data/home-loader";
import { HomePage } from "@/modules/public-site/home/ui/HomePage";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getPublicSettings();
    return buildSiteMetadata({
      canonicalPath: "/",
      description: settings.defaultSeoDescription,
      socialImage: settings.defaultSocialImageAsset,
      title: settings.defaultSeoTitle ?? settings.studioName
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      logger.warn(
        "Public settings query failed for homepage metadata due to database unavailability; using fallback defaults.",
        {
          classification: "database_unavailable",
          domain: "homepage-metadata",
          event: "homepage_metadata_db_unavailable"
        }
      );
      return buildSiteMetadata({
        canonicalPath: "/"
      });
    }
    throw error;
  }
}

export default async function PublicHomePage(): Promise<React.JSX.Element> {
  const data = await loadHomePageData();
  return <HomePage {...data} />;
}
