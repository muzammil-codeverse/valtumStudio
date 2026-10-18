import { z } from "zod";

import { validateRichTextDocument } from "../shared/domain/rich-text";
import { validateCanonicalUrl } from "../shared/domain/urls";
const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) return undefined;
    const url = validateCanonicalUrl(value);
    if (!url) {
      ctx.addIssue({ code: "custom", message: "Enter a valid http(s) URL." });
      return z.NEVER;
    }
    return url;
  });
export const teamSchema = z
  .object({
    id: z.string().optional(),
    revision: z.coerce.number().int().positive().optional(),
    name: z.string().trim().min(1).max(120),
    slug: z.string().trim().min(1).max(160),
    roleTitle: z.string().trim().min(1).max(160),
    shortBio: z.string().trim().max(500).optional(),
    bioJson: z.unknown().optional(),
    portraitAssetId: z.string().optional(),
    linkedinUrl: optionalUrl,
    websiteUrl: optionalUrl,
    featured: z.coerce.boolean().default(false),
    sortOrder: z.coerce.number().int().min(0).default(0)
  })
  .superRefine((value, ctx) => {
    if (value.id && value.revision === undefined)
      ctx.addIssue({
        code: "custom",
        path: ["revision"],
        message: "A revision is required to update content."
      });
    if (value.bioJson !== undefined && !validateRichTextDocument(value.bioJson))
      ctx.addIssue({
        code: "custom",
        path: ["bioJson"],
        message: "Use a supported structured rich-text document."
      });
  });
