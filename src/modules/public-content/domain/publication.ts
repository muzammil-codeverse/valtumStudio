import { validateSlug } from "@/modules/cms/shared/domain/slug";

export type PublicationFields = Readonly<{
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: Date | null;
  archivedAt: Date | null;
  slug: string;
}>;

/**
 * Validates whether a content item is publicly visible according to the publication policy:
 * - status must be PUBLISHED
 * - publishedAt must be not null and <= now
 * - archivedAt must be null
 * - slug must be valid (not reserved or empty)
 */
export function isPubliclyPublished(record: PublicationFields, now: Date): boolean {
  if (record.status !== "PUBLISHED") {
    return false;
  }
  if (record.publishedAt === null) {
    return false;
  }
  if (record.publishedAt > now) {
    return false;
  }
  if (record.archivedAt !== null) {
    return false;
  }
  const slugValidation = validateSlug(record.slug);
  if (!slugValidation.ok) {
    return false;
  }
  return true;
}
