export type ErrorMetadata = Readonly<Record<string, unknown>>;

export type ApplicationErrorOptions = {
  cause?: unknown;
  metadata?: ErrorMetadata;
  retryable?: boolean;
};

/**
 * Represents a known application failure with a stable code and a message that
 * is safe to expose outside the system. Callers must keep internal causes out
 * of public responses.
 */
export class ApplicationError extends Error {
  public readonly code: string;
  public readonly metadata: ErrorMetadata | undefined;
  public readonly retryable: boolean;

  public constructor(
    code: string,
    publicMessage: string,
    options: ApplicationErrorOptions = {}
  ) {
    super(
      publicMessage,
      options.cause === undefined ? undefined : { cause: options.cause }
    );
    this.name = "ApplicationError";
    this.code = code;
    this.metadata = options.metadata;
    this.retryable = options.retryable ?? false;
  }

  public toPublicError(): Readonly<{
    code: string;
    message: string;
    retryable: boolean;
  }> {
    return Object.freeze({
      code: this.code,
      message: this.message,
      retryable: this.retryable
    });
  }
}
