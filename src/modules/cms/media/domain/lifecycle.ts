import type { MediaStatus } from "@/generated/prisma/client";

const transitionMap: Readonly<Record<MediaStatus, readonly MediaStatus[]>> = {
  ACTIVE: ["ARCHIVED"],
  ARCHIVED: ["READY", "DELETION_PENDING"],
  DELETED: [],
  DELETION_PENDING: ["ARCHIVED", "READY", "DELETED"],
  FAILED: [],
  PENDING_UPLOAD: ["VERIFYING", "FAILED"],
  READY: ["ARCHIVED", "DELETION_PENDING"],
  VERIFYING: ["READY", "FAILED"]
};

export function canMediaTransition(from: MediaStatus, to: MediaStatus): boolean {
  return transitionMap[from].includes(to);
}

export function assertMediaTransition(from: MediaStatus, to: MediaStatus): void {
  if (!canMediaTransition(from, to)) {
    throw new Error("MEDIA_INVALID_STATE");
  }
}

export function isDeliverableMediaStatus(status: MediaStatus): boolean {
  return status === "READY" || status === "ARCHIVED";
}
