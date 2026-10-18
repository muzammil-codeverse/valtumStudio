"use server";

import { Prisma } from "@/generated/prisma/client";
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
import { invalidateTeamContent } from "../shared/server/cache";
import { toPrismaJson } from "../shared/server/json";
import { type ActionResult, success } from "../shared/types/action-result";
import { teamSchema } from "./schemas";

function parseTeamMemberForm(formData: FormData) {
  let bioJson: unknown;
  const rawBiography = formData.get("bioJson");

  if (rawBiography) {
    try {
      bioJson = JSON.parse(String(rawBiography));
    } catch {
      bioJson = null;
    }
  }

  return teamSchema.parse({
    ...Object.fromEntries(formData),
    featured: formData.get("featured") === "on",
    bioJson
  });
}

export async function saveTeamMemberAction(
  _state: ActionResult<{ id: string }> | undefined,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const principal = await authorizeCms(
      "team",
      formData.get("id") ? "update" : "create"
    );
    const input = parseTeamMemberForm(formData);
    const slug = validateSlug(input.slug);

    if (!slug.ok) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: slug.message,
        fieldErrors: { slug: [slug.message] }
      };
    }

    const document =
      input.bioJson === undefined ? undefined : validateRichTextDocument(input.bioJson);

    if (document === null) {
      throw new CmsValidationError("Use a supported structured rich-text document.");
    }

    const member = await prisma.$transaction(async (tx) => {
      const duplicate = await tx.teamMember.findFirst({
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
        name: input.name,
        slug: slug.slug,
        roleTitle: input.roleTitle,
        shortBio: input.shortBio ?? null,
        bioJson: document === undefined ? Prisma.DbNull : toPrismaJson(document),
        bioText: document === undefined ? null : richTextToPlainText(document),
        portraitAssetId: input.portraitAssetId ?? null,
        linkedinUrl: input.linkedinUrl ?? null,
        websiteUrl: input.websiteUrl ?? null,
        featured: input.featured,
        sortOrder: input.sortOrder,
        updatedById: principal.userId
      };
      let saved;
      let action: "CREATED" | "UPDATED";

      if (input.id) {
        const { id, revision } = requireUpdateIdentity(input.id, input.revision);
        const updated = await tx.teamMember.updateMany({
          where: { id, revision },
          data: { ...data, revision: { increment: 1 } }
        });

        assertRevisionMatch(updated.count);
        saved = await tx.teamMember.findUniqueOrThrow({ where: { id } });
        action = "UPDATED";
      } else {
        saved = await tx.teamMember.create({
          data: { ...data, createdById: principal.userId }
        });
        action = "CREATED";
      }

      await tx.auditEvent.create({
        data: {
          actorUserId: principal.userId,
          action,
          entityType: "TeamMember",
          entityId: saved.id,
          entityLabel: saved.name,
          summary:
            action === "UPDATED"
              ? "Updated team member draft."
              : "Created team member draft."
        }
      });

      return saved;
    });

    invalidateTeamContent(member.id);
    return success({ id: member.id });
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function changeTeamMemberStateAction(
  id: string,
  revision: number,
  target: "PUBLISHED" | "ARCHIVED" | "DRAFT"
): Promise<ActionResult<{ id: string }>> {
  try {
    const principal = await authorizeCms(
      "team",
      target === "PUBLISHED" ? "publish" : "archive"
    );
    const member = await prisma.$transaction(async (tx) => {
      const current = await tx.teamMember.findUnique({ where: { id } });

      if (!current) {
        throw new Error("CMS_NOT_FOUND");
      }

      if (
        !canTransition(current.status, target) ||
        (target === "PUBLISHED" && !current.bioText?.trim())
      ) {
        throw new Error("CMS_CONFLICT");
      }

      const updated = await tx.teamMember.updateMany({
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
          entityType: "TeamMember",
          entityId: id,
          entityLabel: current.name,
          summary: `Changed team member state to ${target}.`
        }
      });

      return { id };
    });

    invalidateTeamContent(member.id);
    return success(member);
  } catch (error) {
    return toActionFailure(error);
  }
}
