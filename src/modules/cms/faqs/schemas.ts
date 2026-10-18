import { z } from "zod";

import { validateRichTextDocument } from "../shared/domain/rich-text";
export const faqGroupSchema = z
  .object({
    id: z.string().optional(),
    revision: z.coerce.number().int().positive().optional(),
    title: z.string().trim().min(1).max(140),
    slug: z.string().trim().min(1).max(160),
    description: z.string().trim().max(500).optional(),
    sortOrder: z.coerce.number().int().min(0).default(0),
    items: z
      .array(
        z.object({
          id: z.string().optional(),
          question: z.string().trim().min(1).max(300),
          answerJson: z.unknown(),
          isActive: z.boolean().default(true),
          sortOrder: z.number().int().min(0)
        })
      )
      .min(0)
  })
  .superRefine((value, ctx) => {
    if (value.id && value.revision === undefined)
      ctx.addIssue({
        code: "custom",
        path: ["revision"],
        message: "A revision is required to update content."
      });
    value.items.forEach((item, index) => {
      if (!validateRichTextDocument(item.answerJson))
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "answerJson"],
          message: "Use a supported structured answer."
        });
    });
  });
