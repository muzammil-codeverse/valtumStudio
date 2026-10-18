import "server-only";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import { validateSlug } from "@/modules/cms/shared/domain/slug";

import { publicRoutes } from "../domain/routes";

export type PreviewType = "service" | "project" | "insight";

/**
 * Validates that the preview requester is authenticated and authorized to read
 * the specified content type.
 */
export async function authorizePreview(
  requestHeaders: Headers,
  type: PreviewType
): Promise<void> {
  const resourceMap: Record<PreviewType, "services" | "projects" | "insights"> = {
    service: "services",
    project: "projects",
    insight: "insights"
  };

  const resource = resourceMap[type];
  if (!resource) {
    throw new Error("Invalid preview resource type.");
  }

  // Enforces completed authentication and checks read permission on the resource
  await requirePermission(requestHeaders, resource, "read");
}

/**
 * Verifies if the target content entity exists in the database.
 * If it exists, returns its canonical internal preview path.
 */
export async function getPreviewRedirectPath(
  type: PreviewType,
  slug: string
): Promise<string | null> {
  const validation = validateSlug(slug);
  if (!validation.ok) {
    return null;
  }

  if (type === "service") {
    const service = await prisma.serviceOffering.findUnique({
      where: { slug },
      select: { slug: true }
    });
    return service ? publicRoutes.service(service.slug) : null;
  }

  if (type === "project") {
    const project = await prisma.project.findUnique({
      where: { slug },
      select: { slug: true }
    });
    return project ? publicRoutes.project(project.slug) : null;
  }

  if (type === "insight") {
    const insight = await prisma.insight.findUnique({
      where: { slug },
      select: { slug: true }
    });
    return insight ? publicRoutes.insight(insight.slug) : null;
  }

  return null;
}
