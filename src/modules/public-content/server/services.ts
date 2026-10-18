import "server-only";

import { draftMode } from "next/headers";

import { prisma } from "@/lib/database";

import { mapPublicMedia, type MediaFields } from "../domain/media";
import type { PublicServiceDTO } from "../types/dto";
import { cacheTags, withPublicCache } from "./cache";

async function isPreviewMode(): Promise<boolean> {
  try {
    const draft = await draftMode();
    return draft.isEnabled;
  } catch {
    return false;
  }
}

type ServiceRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string | null;
  featured: boolean;
  sortOrder: number;
  heroAsset: MediaFields | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  socialImageAsset: MediaFields | null;
  publishedAt: Date | null;
  capabilities: Array<{
    title: string;
    description: string | null;
  }>;
};

/**
 * Maps a Prisma service offering to the PublicServiceDTO.
 */
function mapService(service: ServiceRecord): PublicServiceDTO {
  return {
    id: service.id,
    slug: service.slug,
    title: service.title,
    summary: service.summary,
    description: service.description,
    featured: service.featured,
    sortOrder: service.sortOrder,
    heroAsset: mapPublicMedia(service.heroAsset),
    seoTitle: service.seoTitle,
    seoDescription: service.seoDescription,
    canonicalUrl: service.canonicalUrl,
    socialImageAsset: mapPublicMedia(service.socialImageAsset),
    publishedAt: service.publishedAt ? service.publishedAt.toISOString() : null,
    capabilities: service.capabilities.map((c) => ({
      title: c.title,
      description: c.description
    }))
  };
}

/**
 * Returns all publicly available services ordered by sortOrder asc.
 */
export async function getPublicServices(): Promise<ReadonlyArray<PublicServiceDTO>> {
  const isPreview = await isPreviewMode();

  const query = async () => {
    const now = new Date();
    const where = isPreview
      ? {}
      : {
          status: "PUBLISHED" as const,
          publishedAt: { lte: now },
          archivedAt: null
        };

    const services = await prisma.serviceOffering.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        description: true,
        featured: true,
        sortOrder: true,
        publishedAt: true,
        seoTitle: true,
        seoDescription: true,
        canonicalUrl: true,
        heroAsset: {
          select: {
            status: true,
            storageKey: true,
            mimeType: true,
            finalizedAt: true,
            publicUrl: true,
            width: true,
            height: true,
            altText: true,
            caption: true,
            credit: true
          }
        },
        socialImageAsset: {
          select: {
            status: true,
            storageKey: true,
            mimeType: true,
            finalizedAt: true,
            publicUrl: true,
            width: true,
            height: true,
            altText: true,
            caption: true,
            credit: true
          }
        },
        capabilities: {
          orderBy: { sortOrder: "asc" },
          select: {
            title: true,
            description: true
          }
        }
      }
    });

    return services.map(mapService);
  };

  if (isPreview) {
    return query();
  }

  return withPublicCache(query, {
    keyParts: ["services"],
    tags: [cacheTags.services]
  });
}

/**
 * Returns a service offering by slug. Returns null if not found or not published.
 */
export async function getPublicServiceBySlug(
  slug: string
): Promise<PublicServiceDTO | null> {
  const isPreview = await isPreviewMode();

  const query = async () => {
    const now = new Date();
    const where = isPreview
      ? { slug }
      : {
          slug,
          status: "PUBLISHED" as const,
          publishedAt: { lte: now },
          archivedAt: null
        };

    const service = await prisma.serviceOffering.findFirst({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        description: true,
        featured: true,
        sortOrder: true,
        publishedAt: true,
        seoTitle: true,
        seoDescription: true,
        canonicalUrl: true,
        heroAsset: {
          select: {
            status: true,
            storageKey: true,
            mimeType: true,
            finalizedAt: true,
            publicUrl: true,
            width: true,
            height: true,
            altText: true,
            caption: true,
            credit: true
          }
        },
        socialImageAsset: {
          select: {
            status: true,
            storageKey: true,
            mimeType: true,
            finalizedAt: true,
            publicUrl: true,
            width: true,
            height: true,
            altText: true,
            caption: true,
            credit: true
          }
        },
        capabilities: {
          orderBy: { sortOrder: "asc" },
          select: {
            title: true,
            description: true
          }
        }
      }
    });

    return service ? mapService(service) : null;
  };

  if (isPreview) {
    return query();
  }

  return withPublicCache(query, {
    keyParts: ["service", slug],
    tags: [cacheTags.services, cacheTags.service(slug)]
  });
}

/**
 * Returns featured service offerings up to a bounded limit.
 */
export async function getPublicFeaturedServices(
  limit = 6
): Promise<ReadonlyArray<PublicServiceDTO>> {
  const boundedLimit = Math.max(1, Math.min(limit, 20));
  const isPreview = await isPreviewMode();

  const query = async () => {
    const now = new Date();
    const where = isPreview
      ? { featured: true }
      : {
          featured: true,
          status: "PUBLISHED" as const,
          publishedAt: { lte: now },
          archivedAt: null
        };

    const services = await prisma.serviceOffering.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      take: boundedLimit,
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        description: true,
        featured: true,
        sortOrder: true,
        publishedAt: true,
        seoTitle: true,
        seoDescription: true,
        canonicalUrl: true,
        heroAsset: {
          select: {
            status: true,
            storageKey: true,
            mimeType: true,
            finalizedAt: true,
            publicUrl: true,
            width: true,
            height: true,
            altText: true,
            caption: true,
            credit: true
          }
        },
        socialImageAsset: {
          select: {
            status: true,
            storageKey: true,
            mimeType: true,
            finalizedAt: true,
            publicUrl: true,
            width: true,
            height: true,
            altText: true,
            caption: true,
            credit: true
          }
        },
        capabilities: {
          orderBy: { sortOrder: "asc" },
          select: {
            title: true,
            description: true
          }
        }
      }
    });

    return services.map(mapService);
  };

  if (isPreview) {
    return query();
  }

  return withPublicCache(query, {
    keyParts: ["featured-services", String(boundedLimit)],
    tags: [cacheTags.services]
  });
}
