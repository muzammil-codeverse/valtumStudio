import { z } from "zod";

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
export const projectSchema = z
  .object({
    id: z.string().optional(),
    revision: z.coerce.number().int().positive().optional(),
    title: z.string().trim().min(1).max(140),
    slug: z.string().trim().min(1).max(160),
    summary: z.string().trim().min(1).max(500),
    challenge: z.string().trim().max(10000).optional(),
    solution: z.string().trim().max(10000).optional(),
    outcome: z.string().trim().max(10000).optional(),
    projectYear: z.coerce.number().int().min(1900).max(2100).optional(),
    featured: z.coerce.boolean().default(false),
    sortOrder: z.coerce.number().int().min(0).default(0),
    coverAssetId: z.string().optional(),
    socialImageAssetId: z.string().optional(),
    seoTitle: z.string().trim().max(70).optional(),
    seoDescription: z.string().trim().max(170).optional(),
    canonicalUrl: optionalUrl,
    technologyIds: z.array(z.string()).default([])
  })
  .superRefine((value, ctx) => {
    if (value.id && value.revision === undefined)
      ctx.addIssue({
        code: "custom",
        path: ["revision"],
        message: "A revision is required to update content."
      });
  });
