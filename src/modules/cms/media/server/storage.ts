import "server-only";

import { parseMediaEnvironment } from "@/config/env/media";

import { S3MediaStorageAdapter } from "./s3-storage-adapter";
import type { MediaStorage } from "./storage-port";

let cachedStorage: MediaStorage | null | undefined;

export function getMediaStorage(): MediaStorage | null {
  if (cachedStorage !== undefined) return cachedStorage;
  const environment = parseMediaEnvironment(process.env);
  cachedStorage = environment.enabled ? new S3MediaStorageAdapter(environment) : null;
  return cachedStorage;
}

export type { MediaStorage } from "./storage-port";
