import "server-only";

import { signCloudinaryParameters } from "../domain/cloudinary-signature";
import type { MediaStorage } from "./storage-port";

type CloudinaryConfiguration = Readonly<{
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}>;

function cloudinaryConfiguration(): CloudinaryConfiguration | null {
  const cloudName = process.env["CLOUDINARY_CLOUD_NAME"]?.trim();
  const apiKey = process.env["CLOUDINARY_API_KEY"]?.trim();
  const apiSecret = process.env["CLOUDINARY_API_SECRET"]?.trim();
  if (!cloudName && !apiKey && !apiSecret) return null;
  if (!cloudName || !/^[a-z0-9_-]+$/i.test(cloudName) || !apiKey || !apiSecret) {
    throw new Error("Cloudinary delivery configuration is incomplete.");
  }
  return { cloudName, apiKey, apiSecret };
}

function publicIdForKey(key: string): string {
  if (!/^[a-z0-9/-]+\.(?:jpg|png|webp)$/.test(key) || key.includes("//")) {
    throw new Error("Invalid verified media key for Cloudinary.");
  }
  return key.replace(/\.(?:jpg|png|webp)$/, "");
}

function signedBody(
  params: Record<string, string>,
  config: CloudinaryConfiguration
): URLSearchParams {
  return new URLSearchParams({
    ...params,
    api_key: config.apiKey,
    signature: signCloudinaryParameters(params, config.apiSecret)
  });
}

/** Public Cloudinary copy is created ONLY after S3 signature, dimensions and SHA-256 checks pass. */
export async function publishVerifiedMedia(
  input: Readonly<{ byteSize: number; key: string; storage: MediaStor¶»§q«^