"use server";

import { prisma } from "@/lib/database";

import {
  assertRevisionMatch,
  requireUpdateIdentity
} from "../shared/domain/concurrency";
import { canTransition, publicationStateUpdate } from "../shared/domain/publication";
import { validateSlug } from "../shared/domain/slug";
import { authorizeCms, toActionFailure } from "../shared/server/action";
import { invalidateProjectContent } from "../shared/server/cache";
import { type ActionResult, success } from "../shared/types/action-result";
import { projectSchema } from "./schemas";

function parseProjectForm(formData: FormData) {
  let technologyIds: unknown = [];

  try {
    technologyIds = JSON.parse(String(formData.get("technologyIds") ?? "[]"));
  } catch {
    technologyIds = [];
  }

  return projectSchema.parse({
    ...Object.fromEntries(formData),
    featured: formData.get("featured") === "on",
    technologyIds
  });
}

export async function saveProjectAction(
  _state: ActionResult<{ id: string }> | undefined,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const principal = await authorizeCms(
      "projects",
      formData.get("id") ? "update" : "create"
    );
    const input = parseProjectForm(formData);
    const slug = validateSlug(input.slug);

    if (!slug.ok) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: slug.message,
        fieldErrors: { slug: [slug.message] }
      };
    }

    const project = await prisma.$transaction(async (tx) => {
      const duplicate = await tx.project.findFirst({
        where: {
          slug: slug.slug,
          ...(input.id === undefined ? {} : { NOT: { id: input.id } })
        },
        select: { id: true }
      });

      if (duplicate) {
        throw new Error("CMS_DUPLICATE");
      }

      const data = {
        title: input.title,
        slug: slug.slug,
        summary: input.summary,
        challenge: input.challenge ?? null,
        solution: input.solution ?? null,
        outcome: input.outcome ?? null,
        projectYear: input.projectYear ?? null,
        featured: input.featured,
        sortOrder: input.sortOrder,
        coverAssetId: input.coverAssetId ?? null,
        socialImageAssetId: input.socialImageAssetId ?? null,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        canonicalUrl: input.canonicalUrl ?? null,
        updatedById: principal.userId
      };

      let oldSlug: string | undefined;
      if (input.id) {
        const existing = await tx.project.findUnique({
          where: { id: input.id },
          select: { slug: true }
        });
        oldSlug = existing?.slug;
      }

      let saved;
      let action: "CREATED" | "UPDATED";

      if (input.id) {
        const { id, revision } = requireUpdateIdentity(input.id, input.revision);
        const updated = await tx.project.updateMany({
          where: { id, revision },
          data: { ...data, revision: { increment: 1 } }
        });

        assertRevisionMatch(updated.count);
        saved = await tx.project.findUniqueOrThrow({ where: { id } });
        action = "UPDATED";
      } else {
        saved = await tx.project.create({
          data: { ...data, createdById: principal.userId }
        });
        action = "CREATED";
      }

      await tx.projectTechnology.deleteMany({ where: { projectId: saved.id } });

      if (input.technologyIds.length > 0) {
        await tx.projectTechnology.createMany({
          data: [...new Set(input.technologyIds)].map((technologyId) => ({
            projectId: saved.id,
            technologyId
          })),
          skipDuplicates: true
        });
      }

      await tx.auditEvent.create({
        data: {
          actorUserId: principal.userId,
          action,
          entityType: "Project",
          entityId: saved.id,
          entityLabel: saved.title,
          summary:
            action === "UPDATED" ? "Updated project draft." : "Created project draft."
        }
      });

      return { id: saved.id, slug: saved.slug, oldSlug };
    });

    invalidateProjectContent(project.id, [
      project.slug,
      ...(project.oldSlug ? [project.oldSlug] : [])
    ]);
    return success({ id: project.id });
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function changeProjectStateAction(
  id: string,
  revision: number,
  target: "PUBLISHED" | "ARCHIVED" | "DRAFT"
): Promise<ActionResult<{ id: string }>> {
  try {
    const principal = await authorizeCms(
      "projects",
      target === "PUBLISHED" ? "publish" : "archive"
    );
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.project.findUnique({ where: { id } });

      if (!current) {
        throw new Error("CMS_NOT_FOUND");
      }

      if (!canTransition(current.status, target)) {
        throw new Error("CMS_CONFLICT");
      }

      if (
        target === "PUBLISHED" &&
        (!current.challenge || !current.solution || !current.outcome)
      ) {
        throw new Error("CMS_CONFLICT");
      }

      const updated = await tx.project.updateMany({
        where: { id, revision },
        data: {
          ...publicationStateUpdate(target),
          updatedById: principal.userId,
          revision: { increment: 1 }
        }
      });

      assertRevisionMatch(updated.count);

      await tx.auditEvent.create({
        data: {
          actorUserId: principal.userId,
          action:
            target === "PUBLISHED"
              ? "PUBLISHED"
              : target === "ARCHIVED"
                ? "ARCHIVED"
                : "RESTORED",
          entityType: "Project",
          entityId: id,
          entityLabel: current.title,
          summary: `Changed project state to ${target}.`
        }
      });

      return { id, slug: current.slug };
    });

    invalidateProjectContent(result.id, [result.slug]);
    return success(result);
  } catch (error) {
    return toActionFailure(error);
  }
}
