import "server-only";

import { prisma } from "@/lib/database";
import { logger } from "@/lib/logging";

import {
  generateCanonicalUrl,
  getTrustedBaseUrl,
  publicRoutes
} from "../domain/routes";
import { cacheTags, withPublicCache } from "./cache";

export type SitemapEntry = Readonly<{
  url: string;
  lastModified?: string;
  changeFrequency?:
    "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}>;

/**
 * Route availability registry.
 * Tells the sitemap generator which public routes are actually implemented and ready to index.
 * Under Phase 8, only the home route (/) is active. Later phases will toggle these.
 */
export const routeAvailabilityRegistry = {
  home: true,
  services: false,
  servicesDetail: false,
  work: false,
  workDetail: false,
  insights: false,
  insightsDetail: false,
  faq: false,
  about: false,
  process: false,
  contact: false,
  privacy: false,
  terms: false,
  accessibility: false
};

/**
 * Builds all canonical sitemap entries based on published content and route availability.
 */
export async function getPublicSitemapEntries(): Promise<ReadonlyArray<SitemapEntry>> {
  const appBaseUrl = getTrustedBaseUrl();
  if (!appBaseUrl) {
    return [];
  }

  const query = async (): Promise<SitemapEntry[]> => {
    const entries: SitemapEntry[] = [];
    const now = new Date();

    // 1. Static Pages
    if (routeAvailabilityRegistry.home) {
      entries.push({
        url: generateCanonicalUrl(publicRoutes.home(), appBaseUrl),
        changeFrequency: "daily",
        priority: 1.0
      });
    }

    if (routeAvailabilityRegistry.services) {
      entries.push({
        url: generateCanonicalUrl(publicRoutes.services(), appBaseUrl),
        changeFrequency: "weekly",
        priority: 0.8
      });
    }

    if (routeAvailabilityRegistry.work) {
      entries.push({
        url: generateCanonicalUrl(publicRoutes.work(), appBaseUrl),
        changeFrequency: "weekly",
        priority: 0.8
      });
    }

    if (routeAvailabilityRegistry.insights) {
      entries.push({
        url: generateCanonicalUrl(publicRoutes.insights(), appBaseUrl),
        changeFrequency: "daily",
        priority: 0.8
      });
    }

    const staticKeys: Array<keyof typeof routeAvailabilityRegistry> = [
      "faq",
      "about",
      "process",
      "contact",
      "privacy",
      "terms",
      "accessibility"
    ];

    for (const key of staticKeys) {
      if (routeAvailabilityRegistry[key]) {
        const routeFn = publicRoutes[key as keyof typeof publicRoutes] as () => string;
        if (routeFn) {
          entries.push({
            url: generateCanonicalUrl(routeFn(), appBaseUrl),
            changeFrequency: "monthly",
            priority: 0.5
          });
        }
      }
    }

    // 2. Dynamic Content (Fetched from DB)
    try {
      if (routeAvailabilityRegistry.servicesDetail) {
        const services = await prisma.serviceOffering.findMany({
          where: {
            status: "PUBLISHED",
            publishedAt: { lte: now },
            archivedAt: null
          },
          select: { slug: true, updatedAt: true }
        });
        for (const s of services) {
          entries.push({
            url: generateCanonicalUrl(publicRoutes.service(s.slug), appBaseUrl),
            lastModified: s.updatedAt.toISOString(),
            changeFrequency: "weekly",
            priority: 0.6
          });
        }
      }

      if (routeAvailabilityRegistry.workDetail) {
        const projects = await prisma.project.findMany({
          where: {
            status: "PUBLISHED",
            publishedAt: { lte: now },
            archivedAt: null
          },
          select: { slug: true, updatedAt: true }
        });
        for (const p of projects) {
          entries.push({
            url: generateCanonicalUrl(publicRoutes.project(p.slug), appBaseUrl),
            lastModified: p.updatedAt.toISOString(),
            changeFrequency: "monthly",
            priority: 0.6
          });
        }
      }

      if (routeAvailabilityRegistry.insightsDetail) {
        const insights = await prisma.insight.findMany({
          where: {
            status: "PUBLISHED",
            publishedAt: { lte: now },
            archivedAt: null,
            category: { isActive: true },
            author: { isActive: true }
          },
          select: { slug: true, updatedAt: true }
        });
        for (const i of insights) {
          entries.push({
            url: generateCanonicalUrl(publicRoutes.insight(i.slug), appBaseUrl),
            lastModified: i.updatedAt.toISOString(),
            changeFrequency: "weekly",
            priority: 0.6
          });
        }
      }
    } catch (error) {
      // Safe logging and controlled result on DB failure (do not return empty list silently, do not leak drafts)
      logger.error("Failed to fetch dynamic sitemap entries", { error });
      // Return static entries compiled so far instead of crashing the site builder
    }

    // Clean duplicates (URL deduplication) and sort alphabetically
    const seen = new Set<string>();
    const uniqueEntries = entries.filter((e) => {
      if (seen.has(e.url)) return false;
      seen.add(e.url);
      return true;
    });

    uniqueEntries.sort((a, b) => a.url.localeCompare(b.url));
    return uniqueEntries;
  };

  return withPublicCache(query, {
    keyParts: ["sitemap"],
    tags: [cacheTags.sitemap]
  });
}
