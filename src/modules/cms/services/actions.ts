"use server";

import { prisma } from "@/lib/database";

import {
  assertRevisionMatch,
  requireUpdateIdentity
} from "../shared/domain/concurrency";
import { canTransition, publicationStateUpdate } from "../shared/domain/publication";
import { validateSlug } from "../shared/domain/slug";
import {
  assertDraftEditable,
  authorizeCms,
  toActionFailure
} from "../shared/server/action";
import { invalidateServiceContent } from "../shared/server/cache";
import { type ActionResult, success } from "../shared/types/action-result";
import { serviceSchema } from "./schemas";

function parseCapabilities(value: FormDataEntryValue | null): unknown {
  try {
    return JSON.parse(typeof value === "string" ? value : "[]");
  } catch {
    return [];
  }
}

function parseServiceForm(formData: FormData) {
  return serviceSchema.parse({
    ...Object.fromEntries(formData),
    featured: formData.get("featured") === "on",
    capabilities: parseCapabilities(formData.get("capabilities"))
  });
}

export async function saveServiceAction(
  _state: ActionResult<{ id: string }> | undefined,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const principal = await authorizeCms(
      "services",
      formData.get("id") ? "update" : "create"
    );
    const input = parseServiceForm(formData);
    const slug = validateSlug(input.slug);

    if (!slug.ok) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: slug.message,
        fieldErrors: { slug: [slug.message] }
      };
    }

    if (input.id) {
      const current = await prisma.serviceOffering.findUnique({
        where: { id: input.id },
        select: { status: true }
      });

      if (!current) {
        throw new Error("CMS_NOT_FOUND");
      }

      assertDraftEditable(principal, current.status);
    }

    const service = await prisma.$transaction(async (tx) => {
      const duplicate = await tx.serviceOffering.findFirst({
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
        description: input.description,
        featured: input.featured,
        sortOrder: input.sortOrder,
        heroAssetId: input.heroAssetId ?? null,
        socialImageAssetId: input.socialImageAssetId ?? null,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        canonicalUrl: input.canonicalUrl ?? null,
        updatedById: principal.userId
      };

      let oldSlug: string | undefined;
      if (input.id) {
        const existing = await tx.serviceOffering.findUnique({
          where: { id: input.id },
          select: { slug: true }
        });
        oldSlug = existing?.slug;
      }

      let saved;
      let action: "CREATED" | "UPDATED";

      if (input.id) {
        const { id, revision } = requireUpdateIdentity(input.id, input.revision);
        const updated = await tx.serviceOffering.updateMany({
          where: { id, revision },
          data: { ...data, revision: { increment: 1 } }
        });

        assertRevisionMatch(updated.count);
        saved = await tx.serviceOffering.findUniqueOrThrow({ where: { id } });
        action = "UPDATED";
      } else {
        saved = await tx.serviceOffering.create({
          data: { ...data, createdById: principal.userId }
        });
        action = "CREATED";
      }

      await tx.serviceCapability.deleteMany({ where: { serviceId: saved.id } });

      if (input.capabilities.length > 0) {
        await tx.serviceCapability.createMany({
          data: input.capabilities.map((capability, index) => ({
            serviceId: saved.id,
            title: capability.title,
            description: capability.description ?? null,
            sortOrder: index
          }))
        });
      }

      await tx.auditEvent.create({
        data: {
          actorUserId: principal.userId,
          action,
          entityType: "ServiceOffering",
          entityId: saved.id,
          entityLabel: saved.title,
          summary:
            action === "UPDATED" ? "Updated service draft." : "Created service draft."
        }
      });

      return { id: saved.id, slug: saved.slug, oldSlug };
    });

    invalidateServiceContent(service.id, [
      service.slug,
      ...(service.oldSlug ? [service.oldSlug] : [])
    ]);
    return success({ id: service.id }, "Service draft saved.");
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function changeServiceStateAction(
  id: string,
  revision: number,
  target: "PUBLISHED" | "ARCHIVED" | "DRAFT"
): Promise<ActionResult<{ id: string }>> {
  try {
    const action = target === "PUBLISHED" ? "publish" : "archive";
    const principal = await authorizeCms("services", action);
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.serviceOffering.findUnique({
        where: { id },
        include: { capabilities: true }
      });

      if (!current) {
        throw new Error("CMS_NOT_FOUND");
      }

      if (!canTransition(current.status, target)) {
        throw new Error("CMS_CONFLICT");
      }

      if (
        target === "PUBLISHED" &&
        (!current.title || !current.summary || !current.description)
      ) {
        throw new Error("CMS_CONFLICT");
      }

      const updated = await tx.serviceOffering.updateMany({
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
          entityType: "ServiceOffering",
          entityId: id,
          entityLabel: current.title,
          summary: `Changed service state to ${target}.`
        }
      });

      return { id, slug: current.slug };
    });

    invalidateServiceContent(result.id, [result.slug]);
    return success(result);
  } catch (error) {
    return toActionFailure(error);
  }
}
