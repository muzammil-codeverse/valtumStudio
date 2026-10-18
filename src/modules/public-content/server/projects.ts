import "server-only";

import { draftMode } from "next/headers";

import { type Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/database";
import { validateRichTextDocument } from "@/modules/cms/shared/domain/rich-text";

import { mapPublicMedia, type MediaFields } from "../domain/media";
import type { PublicPage, PublicProjectDTO } from "../types/dto";
import { cacheTags, withPublicCache } from "./cache";

async function isPreviewMode(): Promise<boolean> {
  try {
    const draft = await draftMode();
    return draft.isEnabled;
  } catch {
    return false;
  }
}

/**
 * Encodes sort order and ID into a cursor string.
 */
function encodeCursor(sortOrder: number, id: string): string {
  const payload = { sortOrder, id };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

/**
 * Decodes a cursor string into sort order and ID.
 */
function decodeCursor(cursor: string | null): { sortOrder: number; id: string } | null {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf-8");
    const parsed = JSON.parse(decoded);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.sortOrder === "number" &&
      typeof parsed.id === "string"
    ) {
      return { sortOrder: parsed.sortOrder, id: parsed.id };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Maps a Prisma project record to PublicProjectDTO.
 * Respects preview mode:
 * - If not preview, filters out unpublished services.
 * - If not preview, filters out unverified media from sections/gallery.
 */
type ProjectRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  challenge: string | null;
  solution: string | null;
  outcome: string | null;
  projectYear: number | null;
  featured: boolean;
  sortOrder: number;
  publishedAt: Date | null;
  coverAsset: MediaFields | null;
  socialImageAsset: MediaFields | null;
  sections: Array<{
    kind: "OVERVIEW" | "CHALLENGE" | "SOLUTION" | "OUTCOME" | "PROCESS" | "CUSTOM";
    heading: string | null;
    bodyJson: Prisma.JsonValue;
    bodyText: string | null;
  }>;
  media: Array<{
    role: "COVER" | "GALLERY" | "INLINE";
    caption: string | null;
    altOverride: string | null;
    mediaAsset: MediaFields;
  }>;
  technologies: Array<{
    technology: {
      name: string;
      slug: string;
    } | null;
  }>;
  services: Array<{
    serviceOffering: {
      id: string;
      title: string;
      slug: string;
      status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
      publishedAt: Date | null;
      archivedAt: Date | null;
    } | null;
  }>;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
};

/**
 * Maps a Prisma project record to PublicProjectDTO.
 * Respects preview mode:
 * - If not preview, filters out unpublished services.
 * - If not preview, filters out unverified media from sections/gallery.
 */
function mapProject(project: ProjectRecord, isPreview: boolean): PublicProjectDTO {
  const now = new Date();

  // Filter and map services
  const services = project.services
    .map((ps) => ps.serviceOffering)
    .filter((s): s is NonNullable<typeof s> => {
      if (!s) return false;
      if (isPreview) return true;
      return (
        s.status === "PUBLISHED" &&
        s.publishedAt !== null &&
        s.publishedAt <= now &&
        s.archivedAt === null
      );
    })
    .map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug
    }));

  // Filter and map project media
  const media = project.media
    .map((pm) => {
      const mappedAsset = mapPublicMedia(pm.mediaAsset);
      if (!mappedAsset) return null;
      return {
        mediaAsset: mappedAsset,
        role: pm.role,
        caption: pm.caption,
        altOverride: pm.altOverride
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  // Map technologies
  const technologies = project.technologies
    .map((pt) => pt.technology)
    .filter((t): t is NonNullable<typeof t> => t !== null)
    .map((t) => ({
      name: t.name,
      slug: t.slug
    }));

  // Map sections
  const sections = project.sections.map((sec) => {
    const doc = validateRichTextDocument(sec.bodyJson);
    return {
      kind: sec.kind,
      heading: sec.heading,
      bodyJson: doc,
      bodyText: sec.bodyText
    };
  });

  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    challenge: project.challenge,
    solution: project.solution,
    outcome: project.outcome,
    projectYear: project.projectYear,
    featured: project.featured,
    sortOrder: project.sortOrder,
    coverAsset: mapPublicMedia(project.coverAsset),
    seoTitle: project.seoTitle,
    seoDescription: project.seoDescription,
    canonicalUrl: project.canonicalUrl,
    socialImageAsset: mapPublicMedia(project.socialImageAsset),
    publishedAt: project.publishedAt ? project.publishedAt.toISOString() : null,
    sections,
    media,
    technologies,
    services
  };
}

const PROJECT_SELECT = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  challenge: true,
  solution: true,
  outcome: true,
  projectYear: true,
  featured: true,
  sortOrder: true,
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
  sections: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      kind: true,
      heading: true,
      bodyJson: true,
      bodyText: true
    }
  },
  media: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      role: true,
      caption: true,
      altOverride: true,
      mediaAsset: {
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
  },
  technologies: {
    select: {
      technology: {
        select: {
          name: true,
          slug: true
        }
      }
    }
  },
  services: {
    select: {
      serviceOffering: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          publishedAt: true,
          archivedAt: true
        }
      }
    }
  }
};

/**
 * Query published projects with cursor-based pagination.
 */
export async function getPublicProjects(options?: {
  limit?: number;
  cursor?: string;
}): Promise<PublicPage<PublicProjectDTO>> {
  const limit = Math.max(1, Math.min(options?.limit ?? 10, 50));
  const decoded = decodeCursor(options?.cursor ?? null);
  const isPreview = await isPreviewMode();

  const query = async () => {
    const now = new Date();

    // Construct base where clause
    const baseWhere: Prisma.ProjectWhereInput = isPreview
      ? {}
      : {
          status: "PUBLISHED" as const,
          publishedAt: { lte: now },
          archivedAt: null
        };

    // If cursor exists, add keyset pagination conditions
    const where = { ...baseWhere };
    if (decoded) {
      where.OR = [
        {
          sortOrder: { gt: decoded.sortOrder }
        },
        {
          sortOrder: decoded.sortOrder,
          id: { gt: decoded.id }
        }
      ];
    }

    // Retrieve limit + 1 items to see if there are more
    const projects = await prisma.project.findMany({
      where,
      orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }],
      take: limit + 1,
      select: PROJECT_SELECT
    });

    const hasMore = projects.length > limit;
    const itemsToMap = hasMore ? projects.slice(0, limit) : projects;
    const mapped = itemsToMap.map((p) => mapProject(p, isPreview));

    let nextCursor: string | null = null;
    if (hasMore && itemsToMap.length > 0) {
      const lastItem = itemsToMap[itemsToMap.length - 1];
      if (lastItem) {
        nextCursor = encodeCursor(lastItem.sortOrder, lastItem.id);
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

  return withPublicCache(query, {
    keyParts: ["projects", String(limit), options?.cursor ?? ""],
    tags: [cacheTags.projects]
  });
}

/**
 * Returns a single project by slug.
 */
export async function getPublicProjectBySlug(
  slug: string
): Promise<PublicProjectDTO | null> {
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

    const project = await prisma.project.findFirst({
      where,
      select: PROJECT_SELECT
    });

    return project ? mapProject(project, isPreview) : null;
  };

  if (isPreview) {
    return query();
  }

  return withPublicCache(query, {
    keyParts: ["project", slug],
    tags: [cacheTags.projects, cacheTags.project(slug)]
  });
}

/**
 * Returns featured projects up to limit.
 */
export async function getPublicFeaturedProjects(
  limit = 3
): Promise<ReadonlyArray<PublicProjectDTO>> {
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

    const projects = await prisma.project.findMany({
      where,
      orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }],
      take: boundedLimit,
      select: PROJECT_SELECT
    });

    return projects.map((p) => mapProject(p, isPreview));
  };

  if (isPreview) {
    return query();
  }

  return withPublicCache(query, {
    keyParts: ["featured-projects", String(boundedLimit)],
    tags: [cacheTags.projects]
  });
}

/**
 * Returns related projects for a given project, based on shared service offerings or technologies.
 * Bounded by limit (default 3), current project excluded.
 */
export async function getRelatedPublicProjects(
  projectId: string,
  options?: { limit?: number }
): Promise<ReadonlyArray<PublicProjectDTO>> {
  const limit = Math.max(1, Math.min(options?.limit ?? 3, 10));
  const isPreview = await isPreviewMode();

  const query = async () => {
    const now = new Date();

    // Fetch current project services & technologies to match
    const current = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        services: { select: { serviceOfferingId: true } },
        technologies: { select: { technologyId: true } }
      }
    });

    if (!current) {
      return [];
    }

    const serviceIds = current.services.map((s) => s.serviceOfferingId);
    const techIds = current.technologies.map((t) => t.technologyId);

    const baseWhere: Prisma.ProjectWhereInput = isPreview
      ? {}
      : {
          status: "PUBLISHED" as const,
          publishedAt: { lte: now },
          archivedAt: null
        };

    // Filter projects that share any service offering OR any technology, EXCLUDING current project
    const where = {
      ...baseWhere,
      id: { not: projectId },
      OR: [
        { services: { some: { serviceOfferingId: { in: serviceIds } } } },
        { technologies: { some: { technologyId: { in: techIds } } } }
      ]
    };

    const projects = await prisma.project.findMany({
      where,
      orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }],
      take: limit,
      select: PROJECT_SELECT
    });

    return projects.map((p) => mapProject(p, isPreview));
  };

  if (isPreview) {
    return query();
  }

  return withPublicCache(query, {
    keyParts: ["related-projects", projectId, String(limit)],
    tags: [cacheTags.projects]
  });
}
