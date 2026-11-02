import type { MetadataRoute } from "next";

import { mayIndexPublicSite, SEO_ORIGIN } from "@/modules/public-site/studio/seo";

export default function robots(): MetadataRoute.Robots {
  if (!mayIndexPublicSite()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep JavaScript, CSS and image resources crawlable for Google's renderer.
      disallow: ["/admin", "/portal", "/auth", "/api", "/preview"]
    },
    sitemap: SEO_ORIGIN + "/sitemap.xml",
    host: SEO_ORIGIN
  };
}
