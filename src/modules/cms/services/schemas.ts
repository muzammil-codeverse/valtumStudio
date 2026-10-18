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
export const serviceSchema = z
  .object({
    id: z.string().optional(),
    revision: z.coerce.number().int().positive().optional(),
    title: z.string().trim().min(1).max(120),
    slug: z.string().trim().min(1).max(160),
    summary: z.string().trim().min(1).max(320),
    description: z.string().trim().min(1).max(10000),
    featured: z.coerce.boolean().default(false),
    sortOrder: z.coerce.number().int().min(0).default(0),
    heroAssetId: z.string().optional(),
    socialImageAssetId: z.string().optional(),
    seoTitle: z.string().trim().max(70).optional(),
    seoDescription: z.string().trim().max(170).optional(),
    canonicalUrl: optionalUrl,
    capabilities: z
      .array(
        z.object({
          title: z.string().trim().min(1).max(120),
          description: z.string().trim().max(500).optional(),
          sortOrder: z.number().int().min(0)
        })
      )
      .default([])
  })
  .superRefine((value, ctx) => {
    if (value.id && value.revision === undefined)
      ctx.addIssue({
        code: "custom",
        path: ["revision"],
        message: "A revision is required to update content."
      });
  });
export type ServiceInput = z.infer<typeof serviceSchema>;
