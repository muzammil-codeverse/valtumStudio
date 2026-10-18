import { revalidateTag, unstable_cache } from "next/cache";
import { draftMode } from "next/headers";

import { logger } from "@/lib/logging";

export const cacheTags = {
  services: "public:services",
  service: (slug: string) => `public:service:${slug}`,
  projects: "public:projects",
  project: (slug: string) => `public:project:${slug}`,
  insights: "public:insights",
  insight: (slug: string) => `public:insight:${slug}`,
  faqs: "public:faqs",
  team: "public:team",
  navigation: (location: string) => `public:navigation:${location.toLowerCase()}`,
  settings: "public:settings",
  sitemap: "public:sitemap"
} as const;

export type PublicCacheOptions = Readonly<{
  keyParts: ReadonlyArray<string>;
  tags: ReadonlyArray<string>;
}>;

/**
 * Executes a query with Next.js unstable_cache unless preview mode (draftMode) is active.
 * Ensures preview requests bypass cache.
 */
export async function withPublicCache<T>(
  queryFn: () => Promise<T>,
  options: PublicCacheOptions
): Promise<T> {
  let isDraft = false;
  try {
    const draft = await draftMode();
    isDraft = draft.isEnabled;
  } catch {
    // Fail safely if headers/draftMode are called in non-request contexts
  }

  if (isDraft) {
    return queryFn();
  }

  const cached = unstable_cache(async () => queryFn(), options.keyParts as string[], {
    tags: options.tags as string[]
  });

  return cached();
}

/**
 * Invalidates a specific cache tag safely.
 */
export function invalidateTag(tag: string): void {
  try {
    revalidateTag(tag, { expire: 0 });
  } catch (error) {
    logger.warn("Cache invalidation failed for tag", {
      tag,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
