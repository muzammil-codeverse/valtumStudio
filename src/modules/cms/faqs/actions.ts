"use server";

import { prisma } from "@/lib/database";

import {
  assertRevisionMatch,
  CmsValidationError,
  requireUpdateIdentity
} from "../shared/domain/concurrency";
import { canTransition, publicationStateUpdate } from "../shared/domain/publication";
import {
  richTextToPlainText,
  validateRichTextDocument
} from "../shared/domain/rich-text";
import { validateSlug } from "../shared/domain/slug";
import { authorizeCms, toActionFailure } from "../shared/server/action";
import { invalidateFaqContent } from "../shared/server/cache";
import { toPrismaJson } from "../shared/server/json";
import { type ActionResult, success } from "../shared/types/action-result";
import { faqGroupSchema } from "./schemas";

function parseFaqGroupForm(formData: FormData) {
  let items: unknown = [];

  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    items = [];
  }

  return faqGroupSchema.parse({
    ...Object.fromEntries(formData),
    items
  });
}

function assertUniqueQuestions(
  items: ReadonlyArray<Readonly<{ question: string }>>
): void {
  const questions = new Set<string>();

  for (const item of items) {
    const question = item.question.toLocaleLowerCase();

    if (questions.has(question)) {
      throw new CmsValidationError("Questions in a group must be unique.");
    }

    questions.add(question);
  }
}

export async function saveFaqGroupAction(
  _state: ActionResult<{ id: string }> | undefined,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const principal = await authorizeCms(
      "faqs",
      formData.get("id") ? "update" : "create"
    );
    const input = parseFaqGroupForm(formData);
    const slug = validateSlug(input.slug);

    if (!slug.ok) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: slug.message,
        fieldErrors: { slug: [slug.message] }
      };
    }

    assertUniqueQuestions(input.items);

    const group = await prisma.$transaction(async (tx) => {
      const duplicate = await tx.fAQGroup.findFirst({
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
        description: input.description ?? null,
        sortOrder: input.sortOrder,
        updatedById: principal.userId
      };
      let saved;
      let action: "CREATED" | "UPDATED";

      if (input.id) {
        const { id, revision } = requireUpdateIdentity(input.id, input.revision);
        const updated = await tx.fAQGroup.updateMany({
          where: { id, revision },
          data: { ...data, revision: { increment: 1 } }
        });

        assertRevisionMatch(updated.count);
        saved = await tx.fAQGroup.findUniqueOrThrow({ where: { id } });
        action = "UPDATED";
      } else {
        saved = await tx.fAQGroup.create({
          data: { ...data, createdById: principal.userId }
        });
        action = "CREATED";
      }

      await tx.fAQItem.deleteMany({ where: { groupId: saved.id } });

      if (input.items.length > 0) {
        const items = input.items.map((item, index) => {
          const document = validateRichTextDocument(item.answerJson);

          if (!document) {
            throw new CmsValidationError("Each FAQ answer must be valid rich text.");
          }

          return {
            groupId: saved.id,
            question: item.question,
            answerJson: toPrismaJson(document),
            answerText: richTextToPlainText(document),
            isActive: item.isActive,
            sortOrder: index
          };
        });

        await tx.fAQItem.createMany({ data: items });
      }

      await tx.auditEvent.create({
        data: {
          actorUserId: principal.userId,
          action,
          entityType: "FAQGroup",
          entityId: saved.id,
          entityLabel: saved.title,
          summary:
            action === "UPDATED"
              ? "Updated FAQ group draft."
              : "Created FAQ group draft."
        }
      });

      return saved;
    });

    invalidateFaqContent(group.id);
    return success({ id: group.id });
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function changeFaqGroupStateAction(
  id: string,
  revision: number,
  target: "PUBLISHED" | "ARCHIVED" | "DRAFT"
): Promise<ActionResult<{ id: string }>> {
  try {
    const principal = await authorizeCms(
      "faqs",
      target === "PUBLISHED" ? "publish" : "archive"
    );
    const group = await prisma.$transaction(async (tx) => {
      const current = await tx.fAQGroup.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!current) {
        throw new Error("CMS_NOT_FOUND");
      }

      if (
        !canTransition(current.status, target) ||
        (target === "PUBLISHED" &&
          !current.items.some((item) => item.isActive && item.answerText.trim()))
      ) {
        throw new Error("CMS_CONFLICT");
      }

      const updated = await tx.fAQGroup.updateMany({
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
          entityType: "FAQGroup",
          entityId: id,
          entityLabel: current.title,
          summary: `Changed FAQ group state to ${target}.`
        }
      });

      return { id };
    });

    invalidateFaqContent(group.id);
    return success(group);
  } catch (error) {
    return toActionFailure(error);
  }
}
