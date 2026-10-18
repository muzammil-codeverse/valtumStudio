import { z } from "zod";

import { validateRichTextDocument } from "../shared/domain/rich-text";
import { validateCanonicalUrl } from "../shared/domain/urls";
const url = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) return undefined;
    const parsed = validateCanonicalUrl(value);
    if (!parsed) {
      ctx.addIssue({ code: "custom", message: "Enter a valid http(s) URL." });
      return z.NEVER;
    }
    return parsed;
  });
export const insightSchema = z
  .object({
    id: z.string().optional(),
    revision: z.coerce.number().int().positive().optional(),
    title: z.string().trim().min(1).max(160),
    slug: z.string().trim().min(1).max(160),
    excerpt: z.string().trim().min(1).max(500),
    bodyJson: z.unknown(),
    categoryId: z.string().min(1),
    authorId: z.string().min(1),
    featured: z.coerce.boolean().default(false),
    coverAssetId: z.string().optional(),
    socialImageAssetId: z.string().optional(),
    seoTitle: z.string().trim().max(70).optional(),
    seoDescription: z.string().trim().max(170).optional(),
    canonicalUrl: url
  })
  .superRefine((value, ctx) => {
    if (value.id && value.revision === undefined)
      ctx.addIssue({
        code: "custom",
        path: ["revision"],
        message: "A revision is required to update content."
      });
    if (!validateRichTextDocument(value.bodyJson))
      ctx.addIssue({
        code: "custom",
        path: ["bodyJson"],
        message: "Use a supported structured rich-text document."
      });
  });
