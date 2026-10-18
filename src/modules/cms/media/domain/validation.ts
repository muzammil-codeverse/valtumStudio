export const ACCEPTED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export const DEFAULT_MEDIA_MAX_BYTES = 15 * 1024 * 1024;

const controlCharacters = /[\u0000-\u001F\u007F]/g;
const checksumExpression = /^[a-f0-9]{64}$/;
const opaqueTokenExpression = /^[A-Za-z0-9_-]{16,160}$/;

export function validateMediaUpload(
  mimeType: string,
  byteSize: number,
  maxBytes = DEFAULT_MEDIA_MAX_BYTES
): string | null {
  if (!ACCEPTED_MEDIA_TYPES.has(mimeType)) {
    return "Only JPEG, PNG, and WebP images are accepted.";
  }
  if (!Number.isSafeInteger(byteSize) || byteSize <= 0 || byteSize > maxBytes) {
    return `Files must be no larger than ${maxBytes} bytes.`;
  }
  return null;
}

export function normalizeOriginalFilename(value: string): string | null {
  const filename = value.trim().replace(controlCharacters, "");
  if (filename.length === 0 || filename.length > 180) {
    return null;
  }
  return filename;
}

export function isValidUploadRequestToken(value: string): boolean {
  return opaqueTokenExpression.test(value);
}

export function isSha256Hex(value: string): boolean {
  return checksumExpression.test(value);
}

export function validateMetadata(
  value: Readonly<{
    altText?: string;
    caption?: string;
    credit?: string;
  }>
): string | null {
  if (value.altText !== undefined && value.altText.trim().length > 500) {
    return "Alt text must be 500 characters or fewer.";
  }
  if (value.caption !== undefined && value.caption.trim().length > 1_000) {
    return "Caption must be 1,000 characters or fewer.";
  }
  if (value.credit !== undefined && value.credit.trim().length > 500) {
    return "Credit must be 500 characters or fewer.";
  }
  return null;
}
