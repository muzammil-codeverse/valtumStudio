import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { headers } from "next/headers";

import { prisma } from "@/lib/database";
import { can } from "@/modules/auth/policies/authorization";
import {
  getAuthenticationAssurance,
  getOptionalSession
} from "@/modules/auth/server/authorization";
import { getMediaStorage } from "@/modules/cms/media/server/storage";

import {
  incomingDeliveryFileKey,
  matchesPrivateFileSignature,
  recordId,
  validatePrivateFile,
  verifiedDeliveryFileKey
} from "../domain/collaboration";
import { isClientPortalEnabled } from "./client-data";
import { configuredClamAv, scanWithClamAv } from "./delivery-malware-scanner";

const UPLOAD_TTL_SECONDS = 5 * 60;
const CHUNK_BYTES = 1024 * 1024;

export function isDeliveryFileExchangeEnabled(): boolean {
  return (
    isClientPortalEnabled() &&
    process.env["DELIVERY_FILES_ENABLED"] === "true" &&
    process.env["MEDIA_STORAGE_ENABLED"] === "true" &&
    configuredClamAv() !== null
  );
}

export class DeliveryFileError extends Error {
  public constructor(
    public readonly status: 400 | 401 | 403 | 404 | 409 | 413 | 503,
    public readonly safeMessage: string
  ) {
    super(safeMessage);
    this.name = "DeliveryFileError";
  }
}

async function fileActor() {
  if (!isDeliveryFileExchangeEnabled()) {
    throw new DeliveryFileError(503, "Private file exchange is not available yet.");
  }
  const principal = await getOptionalSession(await headers());
  if (!principal) throw new DeliveryFileError(401, "Please sign in.");
  if (getAuthenticationAssurance(principal) !== "FULLY_AUTHENTICATED") {
    throw new DeliveryFileError(403, "Finish account security setup first.");
  }
  if (
    principal.role !== "client" &&
    !can(principal.role, { resource: "clients", action: "manage" })
  )
    throw new DeliveryFileError(403, "Not permitted.");
  const storage = getMediaStorage();
  if (!storage)
    throw new DeliveryFileError(503, "Private file storage is unavailable.");
  return { principal, storage, customer: principal.role === "client" };
}

async function allowedProject(
  engagementId: string,
  actor: Awaited<ReturnType<typeof fileActor>>
) {
  const engagement = await prisma.clientEngagement.findFirst({
    where: {
      id: engagementId,
      ...(actor.customer
        ? { workspace: { memberships: { some: { userId: actor.principal.userId } } } }
        : {})
    },
    select: { id: true, workspaceId: true }
  });
  if (!engagement) throw new DeliveryFileError(404, "Project not available.");
  return engagement;
}

export async function reserveDeliveryFile(rawInput: unknown) {
  const input = rawInput as Record<string, unknown> | null;
  if (!input || typeof input !== "object") {
    throw new DeliveryFileError(400, "Invalid file details.");
  }
  let payload: ReturnType<typeof validatePrivateFile>;
  let engagementId: string;
  try {
    engagementId = recordId.parse(input["engagementId"]);
    payload = validatePrivateFile({
      filename: String(input["filename"] ?? ""),
      contentType: String(input["contentType"] ?? ""),
      byteSize: Number(input["byteSize"]),
      checksumSha256: String(input["checksumSha256"] ?? "")
    });
  } catch {
    throw new DeliveryFileError(400, "Choose a PDF, PNG, or JPG under 10 MB.");
  }
  // A feature flag is not a content-disarm pipeline. PDF files are blocked
  // until an actual sandboxed CDR transformation and post-transform scan exists.
  if (payload.contentType === "application/pdf") {
    throw new DeliveryFileError(400, "PDF uploads are not supported yet.");
  }
  const actor = await fileActor();
  await allowedProject(engagementId, actor);
  const recent = await prisma.clientFile.count({
    where: {
      uploaderUserId: actor.principal.userId,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }
    }
  });
  if (recent >= 25) throw new DeliveryFileError(413, "Hourly file limit reached.");
  const id = randomUUID();
  const key = incomingDeliveryFileKey(engagementId, id);
  const expiresAt = new Date(Date.now() + UPLOAD_TTL_SECONDS * 1000);
  const file = await prisma.clientFile.create({
    data: {
      id,
      engagementId,
      uploaderUserId: actor.principal.userId,
      filename: payload.filename,
      contentType: payload.contentType,
      byteSize: payload.byteSize,
      checksumSha256: payload.checksumSha256,
      storageKey: key,
      expiresAt
    }
  });
  try {
    const signed = await actor.storage.createPresignedUpload({
      contentType: payload.contentType,
      checksumSha256: Buffer.from(payload.checksumSha256, "hex").toString("base64"),
      expiresInSeconds: UPLOAD_TTL_SECONDS,
      key
    });
    return {
      fileId: file.id,
      uploadUrl: signed.url,
      headers: signed.headers,
      expiresAt: signed.expiresAt.toISOString()
    };
  } catch {
    await prisma.clientFile.update({
      where: { id: file.id },
      data: { status: "FAILED" }
    });
    throw new DeliveryFileError(503, "File storage could not prepare an upload.");
  }
}

async function verifiedChecksum(
  storage: NonNullable<ReturnType<typeof getMediaStorage>>,
  key: string,
  byteSize: number
): Promise<{ checksum: string; bytes: Buffer }> {
  const hash = createHash("sha256");
  const chunks: Buffer[] = [];
  for (let start = 0; start < byteSize; start += CHUNK_BYTES) {
    const bytes = Buffer.from(
      await storage.readObjectRange({
        key,
        start,
        endInclusive: Math.min(byteSize - 1, start + CHUNK_BYTES - 1)
      })
    );
    hash.update(bytes);
    chunks.push(bytes);
  }
  return { checksum: hash.digest("hex"), bytes: Buffer.concat(chunks, byteSize) };
}

export async function finalizeDeliveryFile(rawFileId: unknown) {
  const id = recordId.safeParse(rawFileId);
  if (!id.success) throw new DeliveryFileError(400, "Invalid file reference.");
  const actor = await fileActor();
  const file = await prisma.clientFile.findFirst({
    where: {
      id: id.data,
      ...(actor.customer ? { uploaderUserId: actor.principal.userId } : {})
    }
  });
  if (!file) throw new DeliveryFileError(404, "File not available.");
  await allowedProject(file.engagementId, actor);
  if (file.status === "READY") return { fileId: file.id, ready: true };
  if (file.status !== "UPLOADING" || file.expiresAt < new Date()) {
    throw new DeliveryFileError(409, "Upload expired. Select the file again.");
  }
  const head = await actor.storage.headObject(file.storageKey).catch(() => null);
  if (!head) throw new DeliveryFileError(409, "Upload not found. Try again.");
  if (
    head.byteSize !== file.byteSize ||
    (head.contentType && head.contentType !== file.contentType)
  ) {
    await prisma.clientFile.updateMany({
      where: { id: file.id, status: "UPLOADING" },
      data: { status: "FAILED" }
    });
    await actor.storage.deleteObject(file.storageKey).catch(() => undefined);
    throw new DeliveryFileError(409, "File contents did not match the upload details.");
  }
  const claim = await prisma.clientFile.updateMany({
    where: {
      id: file.id,
      status: "UPLOADING",
      expiresAt: { gte: new Date() },
      ...(actor.customer
        ? {
            uploaderUserId: actor.principal.userId,
            engagement: {
              workspace: {
                memberships: { some: { userId: actor.principal.userId } }
              }
            }
          }
        : {})
    },
    data: { status: "VERIFYING" }
  });
  if (claim.count !== 1) {
    throw new DeliveryFileError(409, "File verification is already in progress.");
  }
  const verifiedKey = verifiedDeliveryFileKey(file.engagementId, file.id);
  try {
    await actor.storage.copyObject({
      sourceKey: file.storageKey,
      destinationKey: verifiedKey,
      cacheControl: "private, no-store",
      contentType: file.contentType
    });
  } catch {
    await prisma.clientFile.updateMany({
      where: { id: file.id, status: "VERIFYING" },
      data: { status: "FAILED" }
    });
    throw new DeliveryFileError(503, "Private file promotion failed.");
  }
  const copied = await actor.storage.headObject(verifiedKey).catch(() => null);
  if (
    !copied ||
    copied.byteSize !== file.byteSize ||
    (copied.contentType && copied.contentType !== file.contentType)
  ) {
    await actor.storage.deleteObject(verifiedKey).catch(() => undefined);
    await prisma.clientFile.updateMany({
      where: { id: file.id, status: "VERIFYING" },
      data: { status: "FAILED" }
    });
    throw new DeliveryFileError(409, "Copied file failed verification.");
  }
  const verified = await verifiedChecksum(actor.storage, verifiedKey, file.byteSize);
  if (
    !matchesPrivateFileSignature(file.contentType, verified.bytes) ||
    verified.checksum !== file.checksumSha256
  ) {
    await prisma.clientFile.updateMany({
      where: { id: file.id, status: "VERIFYING" },
      data: { status: "FAILED" }
    });
    await actor.storage.deleteObject(verifiedKey).catch(() => undefined);
    await actor.storage.deleteObject(file.storageKey).catch(() => undefined);
    throw new DeliveryFileError(409, "File verification failed.");
  }
  const daemon = configuredClamAv();
  if (!daemon) {
    throw new DeliveryFileError(503, "Malware scanning is not configured.");
  }
  let verdict: "clean" | "infected";
  try {
    verdict = await scanWithClamAv(verified.bytes, daemon);
  } catch {
    // Fail closed: the quarantined object is never made available as READY.
    throw new DeliveryFileError(503, "Malware scanner is unavailable. Try later.");
  }
  if (verdict !== "clean") {
    await prisma.clientFile.updateMany({
      where: { id: file.id, status: "VERIFYING" },
      data: { status: "FAILED" }
    });
    await actor.storage.deleteObject(verifiedKey).catch(() => undefined);
    await actor.storage.deleteObject(file.storageKey).catch(() => undefined);
    throw new DeliveryFileError(409, "The file failed its security scan.");
  }
  await prisma.$transaction(async (tx) => {
    const updated = await tx.clientFile.updateMany({
      where: {
        id: file.id,
        status: "VERIFYING",
        expiresAt: { gte: new Date() },
        ...(actor.customer
          ? {
              uploaderUserId: actor.principal.userId,
              engagement: {
                workspace: {
                  memberships: { some: { userId: actor.principal.userId } }
                }
              }
            }
          : {})
      },
      data: {
        status: "READY",
        storageKey: verifiedKey,
        verifiedAt: new Date(),
        scanCompletedAt: new Date()
      }
    });
    if (updated.count !== 1)
      throw new DeliveryFileError(409, "Upload no longer active.");
    await tx.clientDeliveryEvent.create({
      data: {
        engagementId: file.engagementId,
        actorUserId: actor.principal.userId,
        kind: "FILE_SHARED",
        entityId: file.id,
        summary: "Project file shared"
      }
    });
  });
  // A signed PUT remains reusable until it expires, so only the isolated,
  // copied and scanned key may ever be served to customers.
  try {
    await actor.storage.deleteObject(file.storageKey);
    await prisma.clientFile.updateMany({
      where: { id: file.id, status: "READY", uploadDeletedAt: null },
      data: { uploadDeletedAt: new Date() }
    });
  } catch {
    // Retain READY state; maintenance retries source deletion.
  }
  return { fileId: file.id, ready: true };
}

export async function downloadDeliveryFile(rawFileId: string) {
  const id = recordId.safeParse(rawFileId);
  if (!id.success) throw new DeliveryFileError(404, "File not found.");
  const actor = await fileActor();
  const file = await prisma.clientFile.findFirst({
    where: {
      id: id.data,
      status: "READY",
      scanCompletedAt: { not: null },
      ...(actor.customer
        ? {
            engagement: {
              workspace: { memberships: { some: { userId: actor.principal.userId } } }
            }
          }
        : {})
    },
    select: {
      storageKey: true,
      filename: true,
      byteSize: true,
      engagementId: true
    }
  });
  if (!file) throw new DeliveryFileError(404, "File not available.");
  await allowedProject(file.engagementId, actor);
  const bytes = await actor.storage
    .readObjectRange({
      key: file.storageKey,
      start: 0,
      endInclusive: file.byteSize - 1
    })
    .catch(() => {
      throw new DeliveryFileError(503, "File could not be retrieved.");
    });
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Type": "application/octet-stream",
      "Content-Disposition":
        "attachment; filename=\"project-file\"; filename*=UTF-8''" +
        encodeURIComponent(file.filename),
      "Content-Length": String(file.byteSize),
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox"
    }
  });
}
