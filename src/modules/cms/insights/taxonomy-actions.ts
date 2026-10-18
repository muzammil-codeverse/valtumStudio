"use server";

import { z } from "zod";

import { prisma } from "@/lib/database";

import { validateSlug } from "../shared/domain/slug";
import { authorizeCms, toActionFailure } from "../shared/server/action";
import { type ActionResult, success } from "../shared/types/action-result";

const categorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1),
  description: z.string().trim().max(500).optional(),
  sortOrder: z.number().int().min(0).default(0)
});

const authorSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1),
  title: z.string().trim().max(160).optional(),
  bio: z.string().trim().max(3000).optional()
});

export async function createInsightCategory(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    await authorizeCms("insights", "create");
    const value = categorySchema.parse(input);
    const slug = validateSlug(value.slug);

    if (!slug.ok) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: slug.message
      };
    }

    const created = await prisma.insightCategory.create({
      data: {
        name: value.name,
        slug: slug.slug,
        sortOrder: value.sortOrder,
        description: value.description ?? null
      }
    });

    return success({ id: created.id });
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function createAuthor(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    await authorizeCms("insights", "create");
    const value = authorSchema.parse(input);
    const slug = validateSlug(value.slug);

    if (!slug.ok) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: slug.message
      };
    }

    const created = await prisma.author.create({
      data: {
        name: value.name,
        slug: slug.slug,
        title: value.title ?? null,
        bio: value.bio ?? null
      }
    });

    return success({ id: created.id });
  } catch (error) {
    return toActionFailure(error);
  }
}
