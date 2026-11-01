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
import { publishVerifiedMedia, removePublishedMedia } from "./cloudinary-publisher";
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

export type Uplo¶»§q«^