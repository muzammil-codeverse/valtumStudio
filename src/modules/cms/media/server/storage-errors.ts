export type StorageFailureCode =
  | "ACCESS_DENIED"
  | "CHECKSUM_MISMATCH"
  | "NOT_FOUND"
  | "PRECONDITION_FAILED"
  | "PROVIDER_UNAVAILABLE"
  | "THROTTLED"
  | "UNEXPECTED";

export class StorageError extends Error {
  public constructor(public readonly code: StorageFailureCode) {
    super(code);
    this.name = "StorageError";
  }
}

type AwsLikeError = Readonly<{
  $metadata?: Readonly<{ httpStatusCode?: number }>;
  code?: string;
  name?: string;
}>;

function isAwsLikeError(value: unknown): value is AwsLikeError {
  return typeof value === "object" && value !== null;
}

export function toStorageError(error: unknown): StorageError {
  if (error instanceof StorageError) return error;
  if (error instanceof DOMException && error.name === "AbortError") {
    return new StorageError("PROVIDER_UNAVAILABLE");
  }
  if (!isAwsLikeError(error)) return new StorageError("UNEXPECTED");

  const code = error.name ?? error.code;
  const status = error.$metadata?.httpStatusCode;
  if (code === "NoSuchKey" || code === "NotFound" || status === 404) {
    return new StorageError("NOT_FOUND");
  }
  if (code === "AccessDenied" || status === 403) {
    return new StorageError("ACCESS_DENIED");
  }
  if (code === "PreconditionFailed" || status === 412) {
    return new StorageError("PRECONDITION_FAILED");
  }
  if (code === "BadDigest" || code === "ChecksumMismatch") {
    return new StorageError("CHECKSUM_MISMATCH");
  }
  if (code === "SlowDown" || code === "Throttling" || status === 429) {
    return new StorageError("THROTTLED");
  }
  if (
    code === "TimeoutError" ||
    code === "RequestTimeout" ||
    (status !== undefined && status >= 500)
  ) {
    return new StorageError("PROVIDER_UNAVAILABLE");
  }
  return new StorageError("UNEXPECTED");
}
