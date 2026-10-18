"use server";

import { parseMediaEnvironment } from "@/config/env/media";

import { authorizeCms, toActionFailure } from "../shared/server/action";
import { invalidateMediaContent } from "../shared/server/cache";
import { type ActionResult, failure, success } from "../shared/types/action-result";
import {
  deleteUnusedMedia,
  finalizeMediaUpload,
  getMediaUsage,
  MediaOperationError,
  reserveMediaUpload,
  transitionMediaState,
  updateMediaMetadata
} from "./server/media-service";
import { findReadyMedia } from "./server/queries";
import { getMediaStorage } from "./server/storage";
import { StorageError } from "./server/storage-errors";

function mediaFailure(error: unknown): ActionResult<never> | null {
  if (error instanceof MediaOperationError) {
    if (error.code === "DUPLICATE_CONTENT") {
      return failure("DUPLICATE", "An identical verified asset already exists.");
    }
    if (error.code === "INVALID_STATE") {
      return failure(
        "INVALID_STATE",
        "This media asset cannot perform that operation now."
      );
    }
    if (error.code === "UPLOAD_EXPIRED") {
      return failure(
        "UPLOAD_EXPIRED",
        "The upload reservation has expired. Please try again."
      );
    }
    if (error.code === "PROVIDER_UNAVAILABLE") {
      return failure(
        "PROVIDER_UNAVAILABLE",
        "Media storage is temporarily unavailable."
      );
    }
    return failure(
      "VERIFICATION_FAILED",
      "The uploaded file did not pass verification."
    );
  }
  if (error instanceof StorageError) {
    return failure(
      error.code === "PROVIDER_UNAVAILABLE" || error.code === "THROTTLED"
        ? "PROVIDER_UNAVAILABLE"
        : "STORAGE_ERROR",
      "Media storage could not complete the request."
    );
  }
  return null;
}

function configuredStorage(): Readonly<{
  environment: Exclude<ReturnType<typeof parseMediaEnvironment>, { enabled: false }>;
  storage: NonNullable<ReturnType<typeof getMediaStorage>>;
}> | null {
  const environment = parseMediaEnvironment(process.env);
  const storage = getMediaStorage();
  if (!environment.enabled || storage === null) return null;
  return { environment, storage };
}

export async function requestMediaUploadAction(
  input: Readonly<{
    byteSize: number;
    checksumSha256?: string;
    filename: string;
    mimeType: string;
    requestToken: string;
  }>
): Promise<
  ActionResult<{
    assetId: string;
    expiresAt: string;
    headers: Readonly<Record<string, string>>;
    method: "PUT";
    revision: number;
    uploadUrl: string;
  }>
> {
  try {
    const principal = await authorizeCms("media", "create");
    const configured = configuredStorage();
    if (!configured)
      return failure("STORAGE_DISABLED", "Media storage is not configured.");
    const reservation = await reserveMediaUpload(
      input,
      principal.userId,
      configured.environment,
      configured.storage
    );
    return success({
      assetId: reservation.assetId,
      expiresAt: reservation.expiresAt.toISOString(),
      headers: reservation.headers,
      method: reservation.method,
      revision: reservation.revision,
      uploadUrl: reservation.uploadUrl
    });
  } catch (error) {
    return mediaFailure(error) ?? toActionFailure(error);
  }
}

export async function finalizeMediaUploadAction(
  input: Readonly<{
    assetId: string;
    expectedRevision: number;
  }>
): Promise<ActionResult<{ id: string; revision: number }>> {
  try {
    const principal = await authorizeCms("media", "create");
    const configured = configuredStorage();
    if (!configured)
      return failure("STORAGE_DISABLED", "Media storage is not configured.");
    const completed = await finalizeMediaUpload({
      actorUserId: principal.userId,
      assetId: input.assetId,
      environment: configured.environment,
      expectedRevision: input.expectedRevision,
      storage: configured.storage
    });
    invalidateMediaContent(completed.id);
    return success(completed);
  } catch (error) {
    return mediaFailure(error) ?? toActionFailure(error);
  }
}

export async function updateMediaMetadataAction(
  input: Readonly<{
    altText?: string;
    assetId: string;
    caption?: string;
    credit?: string;
    expectedRevision: number;
  }>
): Promise<ActionResult<{ id: string; revision: number }>> {
  try {
    const principal = await authorizeCms("media", "update");
    const result = await updateMediaMetadata({
      ...input,
      actorUserId: principal.userId
    });
    invalidateMediaContent(result.id);
    return success(result);
  } catch (error) {
    return mediaFailure(error) ?? toActionFailure(error);
  }
}

export async function archiveMediaAction(
  id: string,
  expectedRevision: number
): Promise<ActionResult<{ id: string; revision: number }>> {
  try {
    const principal = await authorizeCms("media", "archive");
    const result = await transitionMediaState({
      actorUserId: principal.userId,
      assetId: id,
      expectedRevision,
      target: "ARCHIVED"
    });
    invalidateMediaContent(result.id);
    return success(result);
  } catch (error) {
    return mediaFailure(error) ?? toActionFailure(error);
  }
}

export async function restoreMediaAction(
  id: string,
  expectedRevision: number
): Promise<ActionResult<{ id: string; revision: number }>> {
  try {
    const principal = await authorizeCms("media", "archive");
    const result = await transitionMediaState({
      actorUserId: principal.userId,
      assetId: id,
      expectedRevision,
      target: "READY"
    });
    invalidateMediaContent(result.id);
    return success(result);
  } catch (error) {
    return mediaFailure(error) ?? toActionFailure(error);
  }
}

export async function deleteMediaAction(
  id: string,
  expectedRevision: number
): Promise<ActionResult<{ id: string; revision: number }>> {
  try {
    const principal = await authorizeCms("media", "delete");
    if (principal.role === "editor")
      return failure("FORBIDDEN", "Only owners and admins can delete media.");
    const configured = configuredStorage();
    if (!configured)
      return failure("STORAGE_DISABLED", "Media storage is not configured.");
    const result = await deleteUnusedMedia({
      actorUserId: principal.userId,
      assetId: id,
      expectedRevision,
      storage: configured.storage
    });
    invalidateMediaContent(result.id);
    return success(result);
  } catch (error) {
    return mediaFailure(error) ?? toActionFailure(error);
  }
}

export async function getMediaUsageAction(
  id: string
): Promise<ActionResult<Readonly<Record<string, number>>>> {
  try {
    await authorizeCms("media", "read");
    return success(await getMediaUsage(id));
  } catch (error) {
    return mediaFailure(error) ?? toActionFailure(error);
  }
}

export async function findReadyMediaAction(
  input: Readonly<{
    page: number;
    query: string;
  }>
): Promise<ActionResult<Awaited<ReturnType<typeof findReadyMedia>>>> {
  try {
    await authorizeCms("media", "read");
    return success(await findReadyMedia(input));
  } catch (error) {
    return mediaFailure(error) ?? toActionFailure(error);
  }
}
