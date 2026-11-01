import { createHash } from "node:crypto";

/** Cloudinary v1 signature: alphabetically sorted key=value pairs, then API secret. */
export function signCloudinaryParameters(
  parameters: Readonly<Record<string, string>>,
  apiSecret: string
): string {
  const canonical = Object.entries(parameters)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1")
    .update(canonical + apiSecret)
    .digest("hex");
}
