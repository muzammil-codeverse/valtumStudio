import type { MetadataRoute } from "next";

import {
  indexablePublicPaths,
  mayIndexPublicSite,
  publicCanonical
} from "@/modules/public-site/studio/seo";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!mayIndexPublicSite()) return [];
  return indexablePublicPaths().map((path) => ({ url: publicCanonical(path) }));
}
