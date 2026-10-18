import "server-only";

import { draftMode } from "next/headers";

import { type Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/database";
import { validateRichTextDocument } from "@/modules/cms/shared/domain/rich-text";

import { mapPublicMedia, type MediaFields } from "../domain/media";
import type { PublicInsightDTO, PublicPage } from "../types/dto";
import { cacheTags, withPublicCache } from "./cache";

async function isPreviewMode(): Promise<boolean> {
  try {
    const draft = await draftMode();
    return draft.isEnabled;
  } catch {
    return false;
  }
}

function encodeCursor(publishedAt: Date, id: string): string {
  const payload = { publishedAt: publishedAt.toISOString(), id };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeCursor(
  cursor: string | null
): { publishedAt: string; id: string } | null {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf-8");
    const parsed = JSON.parse(decoded);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.publishedAt === "string" &&
      typeof parsed.id === "string"
    ) {
      return { publishedAt: parsed.publishedAt, id: parsed.id };
    }
    return null;
  } catch {
    return null;
  }
}

type InsightRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  bodyJson: Prisma.JsonValue;
  bodyText: string;
  featured: boolean;
  publishedAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  coverAsset: MediaFields | null;
  socialImageAsset: MediaFields | null;
  category: {
    name: string;
    slug: string;
    description: string | null;
  };
  author: {
    name: string;
    slug: string;
    title: string | null;
    bio: string | null;
    avatarAsset: MediaFields | null;
  };
};

/**
 * Maps a Prisma insight record to PublicInsightDTO.
 */
function mapInsight(insight: InsightRecord): PublicInsightDTO | null {
  const doc = validateRichTextDocument(insight.bodyJson);
  if (!doc) {
    return null;
  }
  return {
    id: insight.id,
    title: insight.title,
    slug: insight.slug,
    excerpt: insight.excerpt,
    bodyJson: doc,
    bodyText: insight.bodyText,
    featured: insight.featured,
    publishedAt: insight.publishedAt ? insight.publishedAt.toISOString() : null,
    coverAsset: mapPublicMedia(insight.coverAsset),
    seoTitle: insight.seoTitle,
    seoDescription: insight.seoDescription,
    canonicalUrl: insight.canonicalUrl,
    socialImageAsset: mapPublicMedia(insight.socialImageAsset),
    category: {
      name: insight.category.name,
      slug: insight.category.slug,
      description: insight.category.description
    },
    author: {
      name: insight.author.name,
      slug: insight.author.slug,
      title: insight.author.title,
      bio: insight.author.bio,
      avatarAsset: mapPublicMedia(insight.author.avatarAsset)
    }
  };
}

const INSIGHT_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  bodyJson: true,
  bodyText: true,
  featured: true,
  publishedAt: true,
  seoTitle: true,
  seoDescription: true,
  canonicalUrl: true,
  coverAsset: {
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
  category: {
    select: {
      name: true,
      slug: true,
      description: true,
      isActive: true
    }
  },
  author: {
    select: {
      name: true,
      slug: true,
      title: true,
      bio: true,
      isActive: true,
      avatarAsset: {
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
      }
    }
  }
};

/**
 * Returns list of insights with cursor pagination.
 */
export async function getPublicInsights(options?: {
  limit?: number;
  cursor?: string;
  categorySlug?: string;
}): Promise<PublicPage<PublicInsightDTO>> {
  const limit = Math.max(1, Math.min(options?.limit ?? 10, 50));
  const decoded = decodeCursor(options?.cursor ?? null);
  const isPreview = await isPreviewMode();

  const query = async () => {
    const now = new Date();

    const baseWhere: Prisma.InsightWhereInput = isPreview
      ? {}
      : {
          status: "PUBLISHED" as const,
          publishedAt: { lte: now },
          archivedAt: null,
          category: { isActive: true },
          author: { isActive: true }
        };

    if (options?.categorySlug) {
      baseWhere.category = isPreview
        ? { slug: options.categorySlug }
        : { isActive: true, slug: options.categorySlug };
    }

    const where = { ...baseWhere };
    if (decoded) {
      const cursorDate = new Date(decoded.publishedAt);
      where.OR = [
        {
          publishedAt: { lt: cursorDate }
        },
        {
          publishedAt: cursorDate,
          id: { lt: decoded.id }
        }
      ];
    }

    const insights = await prisma.insight.findMany({
      where,
      orderBy: [{ publishedAt: "desc" as const }, { id: "desc" as const }],
      take: limit + 1,
      select: INSIGHT_SELECT
    });

    const hasMore = insights.length > limit;
    const itemsToMap = hasMore ? insights.slice(0, limit) : insights;
    const mapped = itemsToMap
      .map(mapInsight)
      .filter((i): i is NonNullable<typeof i> => i !== null);

    let nextCursor: string | null = null;
    if (hasMore && itemsToMap.length > 0) {
      const lastItem = itemsToMap[itemsToMap.length - 1];
      if (lastItem) {
        nextCursor = encodeCursor(lastItem.publishedAt || new Date(0), lastItem.id);
      }
    }

    return {
      items: mapped,
      nextCursor,
      hasMore
    };
  };

  if (isPreview) {
    return query();
  }

  const tags: string[] = [cacheTags.insights];
  if (options?.categorySlug) {
    tags.push(`public:insights:category:${options.categorySlug}`);
  }

  return withPublicCache(query, {
    keyParts: [
      "insights",
      String(limit),
      options?.cursor ?? "",
      options?.categorySlug ?? ""
    ],
    tags
  });
}

/**
 * Returns insight details by slug.
 */
export async function getPublicInsightBySlug(
  slug: string
): Promise<PublicInsightDTO | null> {
  const isPreview = await isPreviewMode();

  const query = async () => {
    const now = new Date();
    const where = isPreview
      ? { slug }
      : {
          slug,
          status: "PUBLISHED" as const,
          publishedAt: { lte: now },
          archivedAt: null,
          category: { isActive: true },
          author: { isActive: true }
        };

    const insight = await prisma.insight.findFirst({
      where,
      select: INSIGHT_SELECT
    });

    return insight ? mapInsight(insight) : null;
  };

  if (isPreview) {
    return query();
  }

  return withPublicCache(query, {
    keyParts: ["insight", slug],
    tags: [cacheTags.insights, cacheTags.insight(slug)]
  });
}

/**
 * Returns insights by category slug.
 */
export async function getPublicInsightsByCategory(
  categorySlug: string,
  options?: { limit?: number; cursor?: string }
): Promise<PublicPage<PublicInsightDTO>> {
  return getPublicInsights({
    ...options,
    categorySlug
  });
}

/**
 * Returns related insights sharing same category, excluding current.
 */
export async function getRelatedPublicInsights(
  insightId: string,
  options?: { limit?: number }
): Promise<ReadonlyArray<PublicInsightDTO>> {
  const limit = Math.max(1, Math.min(options?.limit ?? 3, 10));
  const isPreview = await isPreviewMode();

  const query = async () => {
    const now = new Date();

    const current = await prisma.insight.findUnique({
      where: { id: insightId },
      select: { categoryId: true }
    });

    if (!current) {
      return [];
    }

    const baseWhere: Prisma.InsightWhereInput = isPreview
      ? {}
      : {
          status: "PUBLISHED" as const,
          publishedAt: { lte: now },
          archivedAt: null,
          category: { isActive: true },
          author: { isActive: true }
        };

    const where = {
      ...baseWhere,
      id: { not: insightId },
      categoryId: current.categoryId
    };

    const insights = await prisma.insight.findMany({
      where,
      orderBy: [{ publishedAt: "desc" as const }, { id: "desc" as const }],
      take: limit,
      select: INSIGHT_SELECT
    });

    return insights
      .map(mapInsight)
      .filter((i): i is NonNullable<typeof i> => i !== null);
  };

  if (isPreview) {
    return query();
  }

  return withPublicCache(query, {
    keyParts: ["related-insights", insightId, String(limit)],
    tags: [cacheTags.insights]
  });
}
