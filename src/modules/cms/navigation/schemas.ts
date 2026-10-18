import { z } from "zod";

import { validateNavigationHref } from "../shared/domain/urls";
export const navigationSchema = z
  .object({
    id: z.string().optional(),
    revision: z.coerce.number().int().positive().optional(),
    location: z.enum(["PRIMARY", "FOOTER", "LEGAL"]),
    type: z.enum(["INTERNAL", "EXTERNAL", "GROUP", "CTA"]),
    label: z.string().trim().min(1).max(100),
    href: z.string().trim().max(2048).optional(),
    parentId: z.string().optional(),
    sortOrder: z.coerce.number().int().min(0).default(0),
    isEnabled: z.coerce.boolean().default(true),
    openInNewTab: z.coerce.boolean().default(false)
  })
  .superRefine((value, ctx) => {
    if (value.id && value.revision === undefined)
      ctx.addIssue({
        code: "custom",
        path: ["revision"],
        message: "A revision is required to update content."
      });
    if (!validateNavigationHref(value.type, value.href))
      ctx.addIssue({
        code: "custom",
        path: ["href"],
        message:
          value.type === "GROUP"
            ? "Groups cannot have a URL."
            : "Enter a valid URL for this item type."
      });
  });
