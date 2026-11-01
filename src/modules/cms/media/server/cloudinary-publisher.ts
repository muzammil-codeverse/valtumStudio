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
  input: Readonly<{ byteSize: number; key: string; storage: MediaStorage }>
): Promise<string | null> {
  const config = cloudinaryConfiguration();
  if (!config) return null;
  // The connected Cloudinary Free environment allows images up to 10,485,760 bytes.
  if (input.byteSize > 10 * 1024 * 1024) {
    throw new Error("Verified media exceeds the configured Cloudinary upload limit.");
  }
  const publicId = publicIdForKey(input.key);
  const privateSource = await input.storage.createPresignedRead({
    key: input.key,
    expiresInSeconds: 300
  });
  const params = {
    overwrite: "true",
    public_id: publicId,
    timestamp: String(Math.floor(Date.now() / 1000))
  };
  const body = signedBody(params, config);
  body.set("file", privateSource);
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    {
      method: "POST",
      body,
      signal: AbortSignal.timeout(25000)
    }
  );
  if (!response.ok) throw new Error("Cloudinary image publish failed.");
  const result: unknown = await response.json();
  if (typeof result !== "object" || result === null) {
    throw new Error("Cloudinary returned an invalid publish record.");
  }
  const record = result as Record<string, unknown>;
  if (
    record["public_id"] !== publicId ||
    record["resource_type"] !== "image" ||
    record["type"] !== "upload" ||
    record["bytes"] !== input.byteSize ||
    typeof record["secure_url"] !== "string"
  ) {
    throw new Error("Cloudinary image metadata did not match the verified source.");
  }
  const url = new URL(record["secure_url"]);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "res.cloudinary.com" ||
    !url.pathname.startsWith(`/${config.cloudName}/image/upload/`)
  ) {
    throw new Error("Cloudinary image URL failed origin verification.");
  }
  return url.toString();
}

/** Delete only our own deterministic Cloudinary public ID, never arbitrary URLs or assets. */
export async function removePublishedMedia(
  input: Readonly<{ key: string; publicUrl: string | null }>
): Promise<void> {
  if (!input.publicUrl || !input.publicUrl.startsWith("https://res.cloudinary.com/")) {
    return;
  }
  const config = cloudinaryConfiguration();
  if (!config) throw new Error("Cannot remove published Cloudinary asset without credentials.");
  const url = new URL(input.publicUrl);
  if (
    url.hostname !== "res.cloudinary.com" ||
    !url.pathname.startsWith(`/${config.cloudName}/image/upload/`)
  ) {
    throw new Error("Cloudinary deletion origin mismatch.");
  }
  const params = {
    invalidate: "true",
    public_id: publicIdForKey(input.key),
    timestamp: String(Math.floor(Date.now() / 1000))
  };
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`,
    {
      method: "POST",
      body: signedBody(params, config),
      signal: AbortSignal.timeout(15000)
    }
  );
  if (!response.ok) throw new Error("Cloudinary image deletion failed.");
  const value: unknown = await response.json();
  if (
    typeof value !== "object" ||
    value === null ||
    !["ok", "not found"].includes(String((value as Record<string, unknown>)["result"]))
  ) {
    throw new Error("Cloudinary did not confirm image deletion.");
  }
}
