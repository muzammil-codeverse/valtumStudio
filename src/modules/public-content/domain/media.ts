import type { PublicMediaDTO } from "../types/dto";

export type MediaFields = Readonly<{
  status:
    | "ACTIVE"
    | "PENDING_UPLOAD"
    | "VERIFYING"
    | "READY"
    | "FAILED"
    | "ARCHIVED"
    | "DELETION_PENDING"
    | "DELETED";
  storageKey: string | null;
  mimeType: string;
  finalizedAt: Date | null;
  publicUrl: string | null;
  width: number | null;
  height: number | null;
  altText: string | null;
  caption: string | null;
  credit: string | null;
}>;

/**
 * Checks whether a media asset is publicly deliverable.
 * Asset must be:
 * - status READY, or status ARCHIVED (meaning previously verified)
 * - must have storageKey
 * - must have finalizedAt
 * - must have publicUrl
 * - if it is an image, must have width and height > 0
 */
export function isPubliclyDeliverableMedia(media: MediaFields): boolean {
  const isReady = media.status === "READY";
  const isArchived = media.status === "ARCHIVED";

  if (!isReady && !isArchived) {
    return false;
  }

  // Require verified fields
  if (
    media.storageKey === null ||
    media.finalizedAt === null ||
    media.publicUrl === null ||
    media.publicUrl.trim().length === 0
  ) {
    return false;
  }

  // If it's an image, require valid dimensions
  if (media.mimeType.startsWith("image/")) {
    if (
      media.width === null ||
      media.width <= 0 ||
      media.height === null ||
      media.height <= 0
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Maps a database media asset record to a clean public DTO.
 * Returns null if the media record is null or not publicly deliverable.
 */
export function mapPublicMedia(media: MediaFields | null): PublicMediaDTO | null {
  if (media === null) {
    return null;
  }

  if (!isPubliclyDeliverableMedia(media)) {
    return null;
  }

  return {
    url: media.publicUrl ?? "",
    width: media.width,
    height: media.height,
    mimeType: media.mimeType,
    altText: media.altText,
    caption: media.caption,
    credit: media.credit
  };
}
