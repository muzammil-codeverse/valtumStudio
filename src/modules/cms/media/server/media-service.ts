import "server-only";

import { createHash, randomUUID } from "node:crypto";

import type { EnabledMediaEnvironment } from "@/config/env/media";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/database";

import {
  inspectImageSignature,
  validateImageDimensions
} from "../domain/image-signatures";
import { assertMediaTransition } from "../domain/lifecycle";
import {
  createIncomingObjectKey,
  createVerifiedObjectKey,
  publicUrlForObject
} from "../domain/object-keys";
import {
  isValidUploadRequestToken,
  normalizeOriginalFilename,
  validateMediaUpload,
  validateMetadata
} from "../domain/validation";
import { StorageError } from "./storage-errors";
import type { MediaStorage } from "./storage-port";

const checksumChunkSize = 1024 * 1024;
const signatureInspectionLimit = 256 * 1024;

export type MediaFailureCode =
  | "CHECKSUM_MISMATCH"
  | "DELETE_FAILED"
  | "FILE_TOO_LARGE"
  | "INVALID_DIMENSIONS"
  | "MIME_MISMATCH"
  | "OBJECT_NOT_FOUND"
  | "PROMOTION_FAILED"
  | "PROVIDER_UNAVAILABLE"
  | "SIZE_MISMATCH"
  | "STORAGE_NOT_CONFIGURED"
  | "UNEXPECTED"
  | "UNSUPPORTED_SIGNATURE"
  | "UPLOAD_EXPIRED";

export class MediaOperationError extends Error {
  public constructor(
    public readonly code: MediaFailureCode | "DUPLICATE_CONTENT" | "INVALID_STATE"
  ) {
    super(code);
    this.name = "MediaOperationError";
  }
}

export type UploadReservationInput = Readonly<{
  byteSize: number;
  checksumSha256?: string;
  filename: string;
  mimeType: string;
  requestToken: string;
}>;

export type UploadReservation = Readonly<{
  assetId: string;
  expiresAt: Date;
  headers: Readonly<Record<string, string>>;
  method: "PUT";
  revision: number;
  uploadUrl: string;
}>;

function mediaExtensionForMimeType(mimeType: string): "jpg" | "png" | "webp" {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  throw new MediaOperationError("UNSUPPORTED_SIGNATURE");
}

function checksumHex(value: string): string | null {
  if (/^[a-f0-9]{64}$/.test(value)) return value;
  if (!/^[A-Za-z0-9+/]{43}=$/.test(value)) return null;
  const bytes = Buffer.from(value, "base64");
  return bytes.length === 32 ? bytes.toString("hex") : null;
}

function checksumBase64(value: string): string {
  return Buffer.from(value, "hex").toString("base64");
}

function nonEmptyTrimmed(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function isKnownUniqueConstraint(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

async function calculateObjectChecksum(
  storage: MediaStorage,
  key: string,
  byteSize: number
): Promise<string> {
  const hash = createHash("sha256");
  for (let start = 0; start < byteSize; start += checksumChunkSize) {
    const endInclusive = Math.min(byteSize - 1, start + checksumChunkSize - 1);
    hash.update(await storage.readObjectRange({ endInclusive, key, start }));
  }
  return hash.digest("hex");
}

async function recordFailure(
  input: Readonly<{ actorUserId: string; assetId: string; code: MediaFailureCode }>
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const asset = await tx.mediaAsset.findUnique({ where: { id: input.assetId } });
    if (!asset || asset.status !== "VERIFYING") return;
    await tx.mediaAsset.updateMany({
      where: { id: input.assetId, revision: asset.revision, status: "VERIFYING" },
      data: {
        failureCode: input.code,
        failureMessage: "Media verification did not complete.",
        revision: { increment: 1 },
        status: "FAILED"
      }
    });
    await tx.auditEvent.create({
      data: {
        action: "MEDIA_UPLOAD_FAILED",
        actorUserId: input.actorUserId,
        changes: { code: input.code },
        entityId: input.assetId,
        entityLabel: asset.filename,
        entityType: "MediaAsset",
        summary: "Media upload verification failed."
      }
    });
  });
}

function storageFailureCode(error: unknown): MediaFailureCode {
  if (error instanceof StorageError) {
    if (error.code === "NOT_FOUND") return "OBJECT_NOT_FOUND";
    if (error.code === "PROVIDER_UNAVAILABLE" || error.code === "THROTTLED") {
      return "PROVIDER_UNAVAILABLE";
    }
  }
  return "UNEXPECTED";
}

export async function reserveMediaUpload(
  input: UploadReservationInput,
  actorUserId: string,
  environment: EnabledMediaEnvironment,
  storage: MediaStorage
): Promise<UploadReservation> {
  const filename = normalizeOriginalFilename(input.filename);
  const validation = validateMediaUpload(
    input.mimeType,
    input.byteSize,
    environment.MEDIA_MAX_IMAGE_BYTES
  );
  const declaredChecksum =
    input.checksumSha256 === undefined ? null : checksumHex(input.checksumSha256);
  if (!filename || validation || !isValidUploadRequestToken(input.requestToken)) {
    throw new MediaOperationError("INVALID_STATE");
  }
  if (environment.MEDIA_REQUIRE_SHA256_CHECKSUM && declaredChecksum === null) {
    throw new MediaOperationError("CHECKSUM_MISMATCH");
  }
  if (input.checksumSha256 !== undefined && declaredChecksum === null) {
    throw new MediaOperationError("CHECKSUM_MISMATCH");
  }

  const existing = await prisma.mediaAsset.findUnique({
    where: { uploadRequestToken: input.requestToken }
  });
  let asset = existing;
  if (!asset) {
    const id = randomUUID();
    const incomingKey = createIncomingObjectKey({
      assetId: id,
      extension: mediaExtensionForMimeType(input.mimeType),
      nonce: randomUUID(),
      prefix: environment.MEDIA_KEY_PREFIX
    });
    const uploadExpiresAt = new Date(
      Date.now() + environment.MEDIA_UPLOAD_URL_TTL_SECONDS * 1_000
    );
    try {
      asset = await prisma.$transaction(async (tx) => {
        const created = await tx.mediaAsset.create({
          data: {
            byteSize: input.byteSize,
            createdById: actorUserId,
            declaredChecksum,
            filename,
            incomingKey,
            mimeType: input.mimeType,
            status: "PENDING_UPLOAD",
            uploadExpiresAt,
            uploadRequestToken: input.requestToken
          }
        });
        await tx.auditEvent.create({
          data: {
            action: "MEDIA_UPLOAD_RESERVED",
            actorUserId,
            entityId: created.id,
            entityLabel: filename,
            entityType: "MediaAsset",
            summary: "Reserved a media upload."
          }
        });
        return created;
      });
    } catch (error) {
      if (!isKnownUniqueConstraint(error)) throw error;
      asset = await prisma.mediaAsset.findUnique({
        where: { uploadRequestToken: input.requestToken }
      });
      if (!asset) throw error;
    }
  }

  if (
    asset.status !== "PENDING_UPLOAD" ||
    asset.incomingKey === null ||
    asset.uploadExpiresAt === null ||
    asset.uploadExpiresAt <= new Date()
  ) {
    throw new MediaOperationError(
      asset.uploadExpiresAt !== null ? "UPLOAD_EXPIRED" : "INVALID_STATE"
    );
  }

  const checksum = environment.MEDIA_REQUIRE_SHA256_CHECKSUM
    ? checksumBase64(asset.declaredChecksum ?? "")
    : undefined;
  const presigned = await storage.createPresignedUpload({
    ...(checksum === undefined ? {} : { checksumSha256: checksum }),
    contentType: asset.mimeType,
    expiresInSeconds: environment.MEDIA_UPLOAD_URL_TTL_SECONDS,
    key: asset.incomingKey
  });
  return {
    assetId: asset.id,
    expiresAt: presigned.expiresAt,
    headers: presigned.headers,
    method: presigned.method,
    revision: asset.revision,
    uploadUrl: presigned.url
  };
}

export async function finalizeMediaUpload(
  input: Readonly<{
    actorUserId: string;
    assetId: string;
    expectedRevision: number;
    environment: EnabledMediaEnvironment;
    storage: MediaStorage;
  }>
): Promise<{ id: string; revision: number }> {
  const initial = await prisma.mediaAsset.findUnique({ where: { id: input.assetId } });
  if (!initial) throw new Error("CMS_NOT_FOUND");
  if (initial.status === "READY") return { id: initial.id, revision: initial.revision };
  if (
    initial.status !== "PENDING_UPLOAD" ||
    initial.revision !== input.expectedRevision
  ) {
    throw new Error(
      initial.revision !== input.expectedRevision
        ? "CMS_CONFLICT"
        : "MEDIA_INVALID_STATE"
    );
  }
  if (initial.uploadExpiresAt === null || initial.uploadExpiresAt <= new Date()) {
    throw new MediaOperationError("UPLOAD_EXPIRED");
  }
  if (initial.incomingKey === null) throw new MediaOperationError("INVALID_STATE");

  const claim = await prisma.mediaAsset.updateMany({
    where: { id: initial.id, revision: initial.revision, status: "PENDING_UPLOAD" },
    data: { revision: { increment: 1 }, status: "VERIFYING" }
  });
  if (claim.count !== 1) throw new Error("CMS_CONFLICT");
  const claimedRevision = initial.revision + 1;

  try {
    const head = await input.storage.headObject(initial.incomingKey);
    if (head.byteSize !== initial.byteSize)
      throw new MediaOperationError("SIZE_MISMATCH");
    if (head.byteSize <= 0 || head.byteSize > input.environment.MEDIA_MAX_IMAGE_BYTES) {
      throw new MediaOperationError("FILE_TOO_LARGE");
    }
    if (head.contentType !== undefined && head.contentType !== initial.mimeType) {
      throw new MediaOperationError("MIME_MISMATCH");
    }
    const signature = inspectImageSignature(
      await input.storage.readObjectRange({
        endInclusive: Math.min(head.byteSize - 1, signatureInspectionLimit - 1),
        key: initial.incomingKey,
        start: 0
      })
    );
    if (!signature) throw new MediaOperationError("UNSUPPORTED_SIGNATURE");
    if (signature.mimeType !== initial.mimeType)
      throw new MediaOperationError("MIME_MISMATCH");
    if (
      !validateImageDimensions(signature, {
        maxHeight: input.environment.MEDIA_MAX_IMAGE_HEIGHT,
        maxPixels: input.environment.MEDIA_MAX_IMAGE_PIXELS,
        maxWidth: input.environment.MEDIA_MAX_IMAGE_WIDTH
      })
    ) {
      throw new MediaOperationError("INVALID_DIMENSIONS");
    }
    const checksum = await calculateObjectChecksum(
      input.storage,
      initial.incomingKey,
      head.byteSize
    );
    if (initial.declaredChecksum !== null && checksum !== initial.declaredChecksum) {
      throw new MediaOperationError("CHECKSUM_MISMATCH");
    }
    if (
      input.environment.MEDIA_REQUIRE_SHA256_CHECKSUM &&
      head.checksumSha256 !== undefined &&
      checksumBase64(checksum) !== head.checksumSha256
    ) {
      throw new MediaOperationError("CHECKSUM_MISMATCH");
    }

    const duplicate = await prisma.mediaAsset.findFirst({
      where: { checksum, status: "READY", NOT: { id: initial.id } },
      select: { id: true }
    });
    if (duplicate) throw new MediaOperationError("DUPLICATE_CONTENT");

    const finalKey = createVerifiedObjectKey({
      assetId: initial.id,
      checksum,
      createdAt: initial.createdAt,
      extension: signature.extension,
      prefix: input.environment.MEDIA_KEY_PREFIX
    });
    if (!(await input.storage.objectExists(finalKey))) {
      await input.storage.copyObject({
        cacheControl: "public, max-age=31536000, immutable",
        contentType: signature.mimeType,
        destinationKey: finalKey,
        sourceKey: initial.incomingKey
      });
    }
    try {
      await input.storage.deleteObject(initial.incomingKey);
    } catch {
      // The verified key is authoritative; incoming cleanup is retried by operations tooling.
    }
    const publicUrl = input.environment.MEDIA_PUBLIC_BASE_URL
      ? publicUrlForObject(input.environment.MEDIA_PUBLIC_BASE_URL, finalKey)
      : null;
    const completed = await prisma.$transaction(async (tx) => {
      const updated = await tx.mediaAsset.updateMany({
        where: { id: initial.id, revision: claimedRevision, status: "VERIFYING" },
        data: {
          byteSize: head.byteSize,
          checksum,
          checksumAlgorithm: "SHA-256",
          failureCode: null,
          failureMessage: null,
          finalizedAt: new Date(),
          height: signature.height,
          incomingKey: null,
          mimeType: signature.mimeType,
          publicUrl,
          revision: { increment: 1 },
          status: "READY",
          storageKey: finalKey,
          verifiedExtension: signature.extension,
          width: signature.width
        }
      });
      if (updated.count !== 1) throw new Error("CMS_CONFLICT");
      await tx.auditEvent.create({
        data: {
          action: "MEDIA_UPLOAD_FINALIZED",
          actorUserId: input.actorUserId,
          changes: {
            checksumPrefix: checksum.slice(0, 12),
            mimeType: signature.mimeType
          },
          entityId: initial.id,
          entityLabel: initial.filename,
          entityType: "MediaAsset",
          summary: "Verified and finalized media upload."
        }
      });
      return { id: initial.id, revision: claimedRevision + 1 };
    });
    return completed;
  } catch (error) {
    const code =
      error instanceof MediaOperationError ? error.code : storageFailureCode(error);
    if (code !== "DUPLICATE_CONTENT" && code !== "INVALID_STATE") {
      await recordFailure({
        actorUserId: input.actorUserId,
        assetId: initial.id,
        code
      });
    }
    throw error;
  }
}

export async function updateMediaMetadata(
  input: Readonly<{
    actorUserId: string;
    altText?: string;
    assetId: string;
    caption?: string;
    credit?: string;
    expectedRevision: number;
  }>
): Promise<{ id: string; revision: number }> {
  if (validateMetadata(input) !== null) throw new MediaOperationError("INVALID_STATE");
  const current = await prisma.mediaAsset.findUnique({ where: { id: input.assetId } });
  if (!current) throw new Error("CMS_NOT_FOUND");
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.mediaAsset.updateMany({
      where: { id: current.id, revision: input.expectedRevision },
      data: {
        altText: nonEmptyTrimmed(input.altText),
        caption: nonEmptyTrimmed(input.caption),
        credit: nonEmptyTrimmed(input.credit),
        revision: { increment: 1 }
      }
    });
    if (updated.count !== 1) throw new Error("CMS_CONFLICT");
    await tx.auditEvent.create({
      data: {
        action: "MEDIA_METADATA_UPDATED",
        actorUserId: input.actorUserId,
        entityId: current.id,
        entityLabel: current.filename,
        entityType: "MediaAsset",
        summary: "Updated media metadata."
      }
    });
    return { id: current.id, revision: input.expectedRevision + 1 };
  });
  return result;
}

export async function transitionMediaState(
  input: Readonly<{
    actorUserId: string;
    assetId: string;
    expectedRevision: number;
    target: "ARCHIVED" | "READY";
  }>
): Promise<{ id: string; revision: number }> {
  const current = await prisma.mediaAsset.findUnique({ where: { id: input.assetId } });
  if (!current) throw new Error("CMS_NOT_FOUND");
  assertMediaTransition(current.status, input.target);
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.mediaAsset.updateMany({
      where: {
        id: current.id,
        revision: input.expectedRevision,
        status: current.status
      },
      data: {
        archivedAt: input.target === "ARCHIVED" ? new Date() : null,
        revision: { increment: 1 },
        status: input.target
      }
    });
    if (updated.count !== 1) throw new Error("CMS_CONFLICT");
    await tx.auditEvent.create({
      data: {
        action: input.target === "ARCHIVED" ? "MEDIA_ARCHIVED" : "MEDIA_RESTORED",
        actorUserId: input.actorUserId,
        entityId: current.id,
        entityLabel: current.filename,
        entityType: "MediaAsset",
        summary:
          input.target === "ARCHIVED"
            ? "Archived media asset."
            : "Restored media asset."
      }
    });
    return { id: current.id, revision: input.expectedRevision + 1 };
  });
  return result;
}

export async function getMediaUsage(
  assetId: string
): Promise<Readonly<Record<string, number>>> {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: assetId },
    select: {
      _count: {
        select: {
          authorAvatars: true,
          evidence: true,
          insightCovers: true,
          insightSocialImages: true,
          projectCovers: true,
          projectMedia: true,
          projectSocialImages: true,
          serviceHeroes: true,
          serviceSocialImages: true,
          teamPortraits: true
        }
      }
    }
  });
  if (!asset) throw new Error("CMS_NOT_FOUND");
  return asset._count;
}

export async function deleteUnusedMedia(
  input: Readonly<{
    actorUserId: string;
    assetId: string;
    expectedRevision: number;
    storage: MediaStorage;
  }>
): Promise<{ id: string; revision: number }> {
  const current = await prisma.mediaAsset.findUnique({ where: { id: input.assetId } });
  if (!current) throw new Error("CMS_NOT_FOUND");
  if (current.status !== "READY" && current.status !== "ARCHIVED") {
    throw new MediaOperationError("INVALID_STATE");
  }
  const usage = await getMediaUsage(current.id);
  if (Object.values(usage).some((count) => count > 0))
    throw new MediaOperationError("INVALID_STATE");
  const claimed = await prisma.$transaction(async (tx) => {
    const updated = await tx.mediaAsset.updateMany({
      where: {
        id: current.id,
        revision: input.expectedRevision,
        status: current.status
      },
      data: { revision: { increment: 1 }, status: "DELETION_PENDING" }
    });
    if (updated.count !== 1) throw new Error("CMS_CONFLICT");
    await tx.auditEvent.create({
      data: {
        action: "MEDIA_DELETION_REQUESTED",
        actorUserId: input.actorUserId,
        entityId: current.id,
        entityLabel: current.filename,
        entityType: "MediaAsset",
        summary: "Requested permanent media deletion."
      }
    });
    return input.expectedRevision + 1;
  });
  try {
    if (current.storageKey) await input.storage.deleteObject(current.storageKey);
  } catch {
    await prisma.$transaction(async (tx) => {
      await tx.mediaAsset.updateMany({
        where: { id: current.id, revision: claimed, status: "DELETION_PENDING" },
        data: {
          failureCode: "DELETE_FAILED",
          revision: { increment: 1 },
          status: current.status
        }
      });
      await tx.auditEvent.create({
        data: {
          action: "MEDIA_DELETION_FAILED",
          actorUserId: input.actorUserId,
          entityId: current.id,
          entityLabel: current.filename,
          entityType: "MediaAsset",
          summary: "Media storage deletion failed."
        }
      });
    });
    throw new MediaOperationError("DELETE_FAILED");
  }
  await prisma.$transaction(async (tx) => {
    const updated = await tx.mediaAsset.updateMany({
      where: { id: current.id, revision: claimed, status: "DELETION_PENDING" },
      data: { deletedAt: new Date(), revision: { increment: 1 }, status: "DELETED" }
    });
    if (updated.count !== 1) throw new Error("CMS_CONFLICT");
    await tx.auditEvent.create({
      data: {
        action: "MEDIA_DELETION_COMPLETED",
        actorUserId: input.actorUserId,
        entityId: current.id,
        entityLabel: current.filename,
        entityType: "MediaAsset",
        summary: "Permanently deleted unused media asset."
      }
    });
  });
  return { id: current.id, revision: claimed + 1 };
}

export type MediaTransactionClient = Prisma.TransactionClient;
