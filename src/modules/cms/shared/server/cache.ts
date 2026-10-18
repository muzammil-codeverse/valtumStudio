import "server-only";

import { revalidatePath } from "next/cache";

import { cacheTags, invalidateTag } from "@/modules/public-content/server/cache";

function invalidate(paths: string[]): void {
  paths.forEach((path) => revalidatePath(path));
}

export const invalidateServiceContent = (id?: string, slugs?: string[]) => {
  invalidate([
    "/admin/services",
    ...(id ? [`/admin/services/${id}`, `/admin/services/${id}/preview`] : [])
  ]);

  invalidateTag(cacheTags.services);
  invalidateTag(cacheTags.sitemap);

  if (slugs && slugs.length > 0) {
    slugs.forEach((slug) => invalidateTag(cacheTags.service(slug)));
  }
};

export const invalidateProjectContent = (id?: string, slugs?: string[]) => {
  invalidate([
    "/admin/projects",
    ...(id ? [`/admin/projects/${id}`, `/admin/projects/${id}/preview`] : [])
  ]);

  invalidateTag(cacheTags.projects);
  invalidateTag(cacheTags.sitemap);

  if (slugs && slugs.length > 0) {
    slugs.forEach((slug) => invalidateTag(cacheTags.project(slug)));
  }
};

export const invalidateInsightContent = (
  id?: string,
  slugs?: string[],
  categorySlugs?: string[]
) => {
  invalidate([
    "/admin/insights",
    ...(id ? [`/admin/insights/${id}`, `/admin/insights/${id}/preview`] : [])
  ]);

  invalidateTag(cacheTags.insights);
  invalidateTag(cacheTags.sitemap);

  if (slugs && slugs.length > 0) {
    slugs.forEach((slug) => invalidateTag(cacheTags.insight(slug)));
  }

  if (categorySlugs && categorySlugs.length > 0) {
    categorySlugs.forEach((cs) => invalidateTag(`public:insights:category:${cs}`));
  }
};

export const invalidateFaqContent = (id?: string) => {
  invalidate(["/admin/faqs", ...(id ? [`/admin/faqs/${id}`] : [])]);
  invalidateTag(cacheTags.faqs);
};

export const invalidateNavigationContent = (id?: string, locations?: string[]) => {
  invalidate(["/admin/navigation", ...(id ? [`/admin/navigation/${id}`] : [])]);

  if (locations && locations.length > 0) {
    locations.forEach((location) => invalidateTag(cacheTags.navigation(location)));
  } else {
    invalidateTag(cacheTags.navigation("primary"));
    invalidateTag(cacheTags.navigation("footer"));
    invalidateTag(cacheTags.navigation("legal"));
  }
};

export const invalidateTeamContent = (id?: string) => {
  invalidate([
    "/admin/team",
    ...(id ? [`/admin/team/${id}`, `/admin/team/${id}/preview`] : [])
  ]);
  invalidateTag(cacheTags.team);
};

export const invalidateMediaContent = (id?: string) => {
  invalidate(["/admin/media", ...(id ? [`/admin/media/${id}`] : [])]);

  invalidateTag(cacheTags.services);
  invalidateTag(cacheTags.projects);
  invalidateTag(cacheTags.insights);
  invalidateTag(cacheTags.team);
};

export const invalidateLeadContent = (id?: string) => {
  invalidate(["/admin/leads", ...(id ? [`/admin/leads/${id}`] : [])]);
};

export const invalidateSiteSettings = () => {
  invalidate(["/admin/settings"]);

  invalidateTag(cacheTags.settings);
  invalidateTag(cacheTags.services);
  invalidateTag(cacheTags.projects);
  invalidateTag(cacheTags.insights);
  invalidateTag(cacheTags.sitemap);
};
