import type { MetadataRoute } from "next";

import { getTrustedBaseUrl } from "@/modules/public-content/domain/routes";

export default function robots(): MetadataRoute.Robots {
  const appEnv = process.env["APP_ENV"] || "local";
  const isProd = appEnv === "production";
  const appBaseUrl = getTrustedBaseUrl();

  // Fail-closed policy: disallow indexing unless APP_ENV is explicitly production and base URL is valid
  if (!appBaseUrl || !isProd) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/"
      }
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/auth", "/api", "/preview", "/_next", "/static"]
    },
    sitemap: `${appBaseUrl.replace(/\/+$/, "")}/sitemap.xml`
  };
}
