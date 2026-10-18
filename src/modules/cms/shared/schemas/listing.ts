import { z } from "zod";

export const listingSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  query: z.string().trim().max(120).default(""),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  direction: z.enum(["asc", "desc"]).default("desc")
});

export type ListingInput = z.infer<typeof listingSchema>;
