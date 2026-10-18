const safeSegment = /^[a-z0-9-]+$/;
const allowedExtensions = new Set(["jpg", "png", "webp"]);

function requireSafePrefix(prefix: string): string {
  if (!safeSegment.test(prefix)) {
    throw new Error("Invalid media key prefix.");
  }
  return prefix;
}

function requireIdentifier(value: string): string {
  if (!safeSegment.test(value)) {
    throw new Error("Invalid media object identifier.");
  }
  return value;
}

function requireExtension(extension: string): string {
  if (!allowedExtensions.has(extension)) {
    throw new Error("Unsupported verified image extension.");
  }
  return extension;
}

export function createIncomingObjectKey(
  input: Readonly<{
    assetId: string;
    extension: string;
    nonce: string;
    prefix: string;
  }>
): string {
  const key = `${requireSafePrefix(input.prefix)}/incoming/media/${requireIdentifier(
    input.assetId
  )}/${requireIdentifier(input.nonce)}.${requireExtension(input.extension)}`;
  if (
    key.length > 320 ||
    key.split("/").some((segment) => segment === "." || segment === "..")
  ) {
    throw new Error("Invalid incoming media object key.");
  }
  return key;
}

export function createVerifiedObjectKey(
  input: Readonly<{
    assetId: string;
    checksum: string;
    createdAt: Date;
    extension: string;
    prefix: string;
  }>
): string {
  const checksumPrefix = input.checksum.slice(0, 20);
  if (!/^[a-f0-9]{20}$/.test(checksumPrefix)) {
    throw new Error("Invalid media checksum.");
  }
  const year = String(input.createdAt.getUTCFullYear());
  const month = String(input.createdAt.getUTCMonth() + 1).padStart(2, "0");
  const key = `${requireSafePrefix(input.prefix)}/public/media/${year}/${month}/${requireIdentifier(
    input.assetId
  )}-${checksumPrefix}.${requireExtension(input.extension)}`;
  if (key.length > 320) {
    throw new Error("Verified media object key is too long.");
  }
  return key;
}

export function publicUrlForObject(baseUrl: string, objectKey: string): string {
  const base = new URL(baseUrl);
  if (base.protocol !== "http:" && base.protocol !== "https:") {
    throw new Error("Invalid media public URL.");
  }
  const segments = objectKey.split("/");
  if (
    segments.length === 0 ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error("Invalid public media object key.");
  }
  const joinedPath = [base.pathname.replace(/^\/+|\/+$/g, ""), ...segments]
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  base.pathname = `/${joinedPath}`;
  base.search = "";
  base.hash = "";
  return base.toString();
}
