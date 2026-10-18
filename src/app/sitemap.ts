import type { MetadataRoute } from "next";

import { getPublicSitemapEntries } from "@/modules/public-content/server/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getPublicSitemapEntries();
  return entries.map((entry) => ({
    url: entry.url,
    ...(entry.lastModified ? { lastModified: new Date(entry.lastModified) } : {}),
    ...(entry.changeFrequency ? { changeFrequency: entry.changeFrequency } : {}),
    ...(entry.priority !== undefined ? { priority: entry.priority } : {})
  }));
}
