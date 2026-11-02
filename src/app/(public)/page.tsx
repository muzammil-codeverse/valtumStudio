import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  serializeJsonLd
} from "@/modules/public-content/domain/structured-data";
import { loadHomePageData } from "@/modules/public-site/home/data/home-loader";
import { HomePage } from "@/modules/public-site/home/ui/HomePage";
import {
  pageSeo,
  publicPageMetadata,
  SEO_ORIGIN
} from "@/modules/public-site/studio/seo";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  // Metadata never waits for the CMS or database to become reachable.
  return publicPageMetadata(pageSeo.home, "/");
}

export default async function PublicHomePage(): Promise<React.JSX.Element> {
  const data = await loadHomePageData();
  return (
    <>
      <script
        id="valtum-organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildOrganizationJsonLd(SEO_ORIGIN, {
              ...data.settings,
              publicEmail: data.settings.publicEmail?.trim() || siteConfig.publicEmail
            })
          )
        }}
      />
      <script
        id="valtum-website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(buildWebSiteJsonLd(SEO_ORIGIN, data.settings))
        }}
      />
      <HomePage {...data} />
    </>
  );
}
