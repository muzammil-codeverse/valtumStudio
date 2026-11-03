import "server-only";

import { prisma } from "@/lib/database";
import { getMediaStorage, type MediaStorage } from "@/modules/cms/media/server/storage";
import { StorageError } from "@/modules/cms/media/server/storage-errors";

import {
  incomingDeliveryFileKey,
  verifiedDeliveryFileKey
} from "../domain/collaboration";

const MAX_BATCH = 25;
const GRACE_MS = 60 * 60 * 1000;

/** Delete only expired, unverified upload objects; retain database tombstones for audit. */
export async function sweepExpiredDeliveryFiles({
  now = new Date(),
  storage = getMediaStorage()
}: {
  now?: Date;
  storage?: MediaStorage | null;
} = {}) {
  if (!storage) throw new Error("Private storage is not configured.");
  const cutoff = new Date(now.getTime() - GRACE_MS);
  const expired = await prisma.clientFile.findMany({
    where: {
      status: { in: ["UPLOADING", "VERIFYING", "FAILED"] },
      storageDeletedAt: null,
      expiresAt: { lt: cutoff }
    },
    select: { id: true, engagementId: true, storageKey: true },
    orderBy: [{ expiresAt: "asc" }, { id: "asc" }],
    take: MAX_BATCH
  });
  let cleaned = 0;
  let failed = 0;
  for (const item of expired) {
    try {
      try {
        await storage.deleteObject(item.storageKey);
      } catch (error) {
        if (!(error instanceof StorageError && error.code === "NOT_FOUND")) {
          throw error;
        }
      }
      try {
        await storage.deleteObject(verifiedDeliveryFileKey(item.engagementId, item.id));
      } catch (error) {
        if (!(error instanceof StorageError && error.code === "NOT_FOUND")) {
          throw error;
        }
      }
      const changed = await prisma.clientFile.updateMany({
        where: {
          id: item.id,
          status: { in: ["UPLOADING", "VERIFYING", "FAILED"] },
          storageDeletedAt: null,
          expiresAt: { lt: cutoff }
        },
        data: { status: "FAILED", storageDeletedAt: now }
      });
      cleaned += changed.count;
    } catch {
      // Never reveal storage keys or provider errors in public responses.
      failed++;
    }
  }
  // A READY record points only at an immutable scanned copy. Retry deleting
  // its old, presigned incoming key after the signed URL has expired.
  const readyOrphans = await prisma.clientFile.findMany({
    where: {
      status: "READY",
      scanCompletedAt: { not: null },
      uploadDeletedAt: null,
      expiresAt: { lt: cutoff }
    },
    select: { id: true, engagementId: true },
    orderBy: [{ expiresAt: "asc" }, { id: "asc" }],
    take: MAX_BATCH
  });
  let orphanUploadsRemoved = 0;
  for (const item of readyOrphans) {
    try {
      try {
        await storage.deleteObject(incomingDeliveryFileKey(item.engagementId, item.id));
      } catch (error) {
        if (!(error instanceof StorageError && error.code === "NOT_FOUND")) {
          throw error;
        }
      }
      const change = await prisma.clientFile.updateMany({
        where: { id: item.id, status: "READY", uploadDeletedAt: null },
        data: { uploadDeletedAt: now }
      });
      orphanUploadsRemoved += change.count;
    } catch {
      failed++;
    }
  }
  return {
    examined: expired.length,
    cleaned,
    orphanUploadsRemoved,
    failed,
    moreLikely: expired.length === MAX_BATCH || readyOrphans.length === MAX_BATCH
  };
}
