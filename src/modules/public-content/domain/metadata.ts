import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

import type { PublicMediaDTO } from "../types/dto";
import { generateCanonicalUrl, getTrustedBaseUrl, publicRoutes } from "./routes";

export type BaseMetadataInput = Readonly<{
  title?: string | null | undefined;
  description?: string | null | undefined;
  slug?: string | null | undefined;
  canonicalPath?: string | null | undefined;
  socialImage?: PublicMediaDTO | null | undefined;
  isPreview?: boolean | undefined;
}>;

/**
 * Returns a fallback value or site default.
 */
function getTitle(customTitle?: string | null, entityTitle?: string | null): string {
  if (customTitle && customTitle.trim().length > 0) return customTitle.trim();
  if (entityTitle && entityTitle.trim().length > 0) return entityTitle.trim();
  return siteConfig.title;
}

function getDescription(
  customDesc?: string | null,
  entityExcerpt?: string | null
): string {
  if (customDesc && customDesc.trim().length > 0) return customDesc.trim();
  if (entityExcerpt && entityExcerpt.trim().length > 0) return entityExcerpt.trim();
  return siteConfig.description;
}

/**
 * Build site-wide base metadata.
 */
export function buildSiteMetadata(input: BaseMetadataInput = {}): Metadata {
  const appBaseUrl = getTrustedBaseUrl();
  const isNoIndexPolicy = !appBaseUrl;
  const baseToUse = appBaseUrl || "http://localhost:3000";

  const title = getTitle(input.title);
  const description = getDescription(input.description);

  // Canonical URL calculation
  const path = input.canonicalPath ?? "/";
  const canonical =
    input.isPreview || isNoIndexPolicy ? null : generateCanonicalUrl(path, baseToUse);

  const images = [];
  if (input.socialImage) {
    const imageObj: { url: string; alt?: string; width?: number; height?: number } = {
      url: input.socialImage.url
    };
    if (input.socialImage.altText && input.socialImage.altText.trim() !== "") {
      imageObj.alt = input.socialImage.altText.trim();
    } else if (title && title.trim() !== "") {
      imageObj.alt = title.trim();
    }
    if (input.socialImage.width !== null && input.socialImage.width !== undefined) {
      imageObj.width = input.socialImage.width;
    }
    if (input.socialImage.height !== null && input.socialImage.height !== undefined) {
      imageObj.height = input.socialImage.height;
    }
    images.push(imageObj);
  }

  const metadata: Metadata = {
    title,
    description,
    metadataBase: new URL(baseToUse),
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      title,
      description,
      type: "website",
      siteName: siteConfig.name,
      ...(canonical ? { url: canonical } : {}),
      ...(images.length > 0 ? { images } : {})
    },
    ...(images.length > 0 && input.socialImage
      ? {
          twitter: {
            card: "summary_large_image" as const,
            title,
            description,
            images: [input.socialImage.url]
          }
        }
      : {}),
    ...(input.isPreview || isNoIndexPolicy
      ? {
          robots: {
            index: false,
            follow: false
          }
        }
      : {})
  };

  return metadata;
}

/**
 * Build metadata for a service.
 */
export function buildServiceMetadata(
  service: Readonly<{
    title: string;
    summary: string;
    slug: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
    socialImageAsset?: PublicMediaDTO | null;
  }> | null,
  isPreview = false
): Metadata | null {
  if (!service) return null;

  return buildSiteMetadata({
    title: service.seoTitle || service.title,
    description: service.seoDescription || service.summary,
    canonicalPath: publicRoutes.service(service.slug),
    socialImage: service.socialImageAsset,
    isPreview
  });
}

/**
 * Build metadata for a project.
 */
export function buildProjectMetadata(
  project: Readonly<{
    title: string;
    summary: string;
    slug: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
    socialImageAsset?: PublicMediaDTO | null;
  }> | null,
  isPreview = false
): Metadata | null {
  if (!project) return null;

  return buildSiteMetadata({
    title: project.seoTitle || project.title,
    description: project.seoDescription || project.summary,
    canonicalPath: publicRoutes.project(project.slug),
    socialImage: project.socialImageAsset,
    isPreview
  });
}

/**
 * Build metadata for an insight.
 */
export function buildInsightMetadata(
  insight: Readonly<{
    title: string;
    excerpt: string;
    slug: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
    socialImageAsset?: PublicMediaDTO | null;
  }> | null,
  isPreview = false
): Metadata | null {
  if (!insight) return null;

  return buildSiteMetadata({
    title: insight.seoTitle || insight.title,
    description: insight.seoDescription || insight.excerpt,
    canonicalPath: publicRoutes.insight(insight.slug),
    socialImage: insight.socialImageAsset,
    isPreview
  });
}

/**
 * Generic page metadata builder.
 */
export function buildGenericPageMetadata(
  input: Readonly<{
    title: string;
    description?: string | null | undefined;
    path: string;
    socialImage?: PublicMediaDTO | null | undefined;
  }>
): Metadata {
  return buildSiteMetadata({
    title: input.title,
    description: input.description,
    canonicalPath: input.path,
    socialImage: input.socialImage
  });
}

/**
 * Build metadata for Not Found (404) page.
 */
export function buildNotFoundMetadata(): Metadata {
  return {
    title: "Page Not Found | Siglum Studio",
    description: "The requested page does not exist.",
    robots: {
      index: false,
      follow: false
    }
  };
}

/**
 * Build preview specific metadata override.
 */
export function buildPreviewMetadata(base: Metadata): Metadata {
  const rest = { ...base };
  delete rest.alternates;
  delete rest.openGraph;

  const cleanOpenGraph = base.openGraph ? { ...base.openGraph } : undefined;
  if (cleanOpenGraph) {
    delete cleanOpenGraph.url;
  }

  return {
    ...rest,
    ...(cleanOpenGraph ? { openGraph: cleanOpenGraph } : {}),
    robots: {
      index: false,
      follow: false
    }
  };
}
