"use server";

import { prisma } from "@/lib/database";

import {
  assertRevisionMatch,
  requireUpdateIdentity
} from "../shared/domain/concurrency";
import { canTransition, publicationStateUpdate } from "../shared/domain/publication";
import {
  richTextToPlainText,
  validateRichTextDocument
} from "../shared/domain/rich-text";
import { validateSlug } from "../shared/domain/slug";
import { authorizeCms, toActionFailure } from "../shared/server/action";
import { invalidateInsightContent } from "../shared/server/cache";
import { toPrismaJson } from "../shared/server/json";
import { type ActionResult, success } from "../shared/types/action-result";
import { insightSchema } from "./schemas";

function parseInsightForm(formData: FormData) {
  let bodyJson: unknown = null;

  try {
    bodyJson = JSON.parse(String(formData.get("bodyJson") ?? ""));
  } catch {
    bodyJson = null;
  }

  return insightSchema.parse({
    ...Object.fromEntries(formData),
    featured: formData.get("featured") === "on",
    bodyJson
  });
}

export async function saveInsightAction(
  _state: ActionResult<{ id: string }> | undefined,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const principal = await authorizeCms(
      "insights",
      formData.get("id") ? "update" : "create"
    );
    const input = parseInsightForm(formData);
    const slug = validateSlug(input.slug);
    const document = validateRichTextDocument(input.bodyJson);

    if (!slug.ok || !document) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "Correct the slug and rich-text content.",
        fieldErrors: !slug.ok
          ? { slug: [slug.message] }
          : { bodyJson: ["Invalid rich-text document."] }
      };
    }

    const bodyJson = toPrismaJson(document);
    const bodyText = richTextToPlainText(document);
    const insight = await prisma.$transaction(async (tx) => {
      const duplicate = await tx.insight.findFirst({
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
        excerpt: input.excerpt,
        bodyJson,
        bodyText,
        categoryId: input.categoryId,
        authorId: input.authorId,
        featured: input.featured,
        coverAssetId: input.coverAssetId ?? null,
        socialImageAssetId: input.socialImageAssetId ?? null,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        canonicalUrl: input.canonicalUrl ?? null,
        updatedById: principal.userId
      };

      let oldSlug: string | undefined;
      let oldCategorySlug: string | undefined;
      if (input.id) {
        const existing = await tx.insight.findUnique({
          where: { id: input.id },
          select: { slug: true, category: { select: { slug: true } } }
        });
        oldSlug = existing?.slug;
        oldCategorySlug = existing?.category?.slug;
      }

      let saved;
      let action: "CREATED" | "UPDATED";

      if (input.id) {
        const { id, revision } = requireUpdateIdentity(input.id, input.revision);
        const updated = await tx.insight.updateMany({
          where: { id, revision },
          data: { ...data, revision: { increment: 1 } }
        });

        assertRevisionMatch(updated.count);
        saved = await tx.insight.findUniqueOrThrow({ where: { id } });
        action = "UPDATED";
      } else {
        saved = await tx.insight.create({
          data: { ...data, createdById: principal.userId }
        });
        action = "CREATED";
      }

      await tx.auditEvent.create({
        data: {
          actorUserId: principal.userId,
          action,
          entityType: "Insight",
          entityId: saved.id,
          entityLabel: saved.title,
          summary:
            action === "UPDATED" ? "Updated insight draft." : "Created insight draft."
        }
      });

      const category = await tx.insightCategory.findUnique({
        where: { id: saved.categoryId },
        select: { slug: true }
      });

      return {
        id: saved.id,
        slug: saved.slug,
        oldSlug,
        categorySlug: category?.slug,
        oldCategorySlug
      };
    });

    invalidateInsightContent(
      insight.id,
      [insight.slug, ...(insight.oldSlug ? [insight.oldSlug] : [])],
      [
        ...(insight.categorySlug ? [insight.categorySlug] : []),
        ...(insight.oldCategorySlug ? [insight.oldCategorySlug] : [])
      ]
    );
    return success({ id: insight.id });
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function changeInsightStateAction(
  id: string,
  revision: number,
  target: "PUBLISHED" | "ARCHIVED" | "DRAFT"
): Promise<ActionResult<{ id: string }>> {
  try {
    const principal = await authorizeCms(
      "insights",
      target === "PUBLISHED" ? "publish" : "archive"
    );
    const insight = await prisma.$transaction(async (tx) => {
      const current = await tx.insight.findUnique({
        where: { id },
        select: {
          slug: true,
          title: true,
          status: true,
          bodyText: true,
          category: { select: { slug: true } }
        }
      });

      if (!current) {
        throw new Error("CMS_NOT_FOUND");
      }

      if (
        !canTransition(current.status, target) ||
        (target === "PUBLISHED" && !current.bodyText.trim())
      ) {
        throw new Error("CMS_CONFLICT");
      }

      const updated = await tx.insight.updateMany({
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
          entityType: "Insight",
          entityId: id,
          entityLabel: current.title,
          summary: `Changed insight state to ${target}.`
        }
      });

      return { id, slug: current.slug, categorySlug: current.category?.slug };
    });

    invalidateInsightContent(
      insight.id,
      [insight.slug],
      insight.categorySlug ? [insight.categorySlug] : []
    );
    return success(insight);
  } catch (error) {
    return toActionFailure(error);
  }
}
