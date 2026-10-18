import "server-only";

import { draftMode } from "next/headers";

import { prisma } from "@/lib/database";
import { validateRichTextDocument } from "@/modules/cms/shared/domain/rich-text";

import type { PublicFaqGroupDTO } from "../types/dto";
import { cacheTags, withPublicCache } from "./cache";

async function isPreviewMode(): Promise<boolean> {
  try {
    const draft = await draftMode();
    return draft.isEnabled;
  } catch {
    return false;
  }
}

/**
 * Returns publicly available FAQ groups and their items.
 * Enforces the policy: empty groups (groups with zero active items) are omitted.
 */
export async function getPublicFaqGroups(): Promise<ReadonlyArray<PublicFaqGroupDTO>> {
  const isPreview = await isPreviewMode();

  const query = async () => {
    const now = new Date();
    const baseWhere = isPreview
      ? {}
      : {
          status: "PUBLISHED" as const,
          publishedAt: { lte: now },
          archivedAt: null
        };

    const groups = await prisma.fAQGroup.findMany({
      where: baseWhere,
      orderBy: { sortOrder: "asc" },
      select: {
        title: true,
        slug: true,
        description: true,
        items: {
          where: isPreview ? {} : { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            question: true,
            answerJson: true,
            answerText: true,
            isActive: true
          }
        }
      }
    });

    const mapped: PublicFaqGroupDTO[] = groups.map((g) => {
      const items = g.items
        .map((i) => {
          const doc = validateRichTextDocument(i.answerJson);
          if (!doc) {
            return null;
          }
          return {
            question: i.question,
            answerJson: doc,
            answerText: i.answerText
          };
        })
        .filter((i): i is NonNullable<typeof i> => i !== null);

      return {
        title: g.title,
        slug: g.slug,
        description: g.description,
        items
      };
    });

    // CENTRAL POLICY: Omit empty groups from the public delivery layer
    return mapped.filter((g) => g.items.length > 0);
  };

  if (isPreview) {
    return query();
  }

  return withPublicCache(query, {
    keyParts: ["faqs"],
    tags: [cacheTags.faqs]
  });
}
