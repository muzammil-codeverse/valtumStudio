export type ActionErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "DUPLICATE"
  | "INVALID_STATE"
  | "STORAGE_ERROR"
  | "STORAGE_DISABLED"
  | "UPLOAD_EXPIRED"
  | "PROVIDER_UNAVAILABLE"
  | "VERIFICATION_FAILED"
  | "INTERNAL_ERROR";

export type ActionResult<T = undefined> =
  | Readonly<{ ok: true; data: T; message?: string }>
  | Readonly<{
      ok: false;
      code: ActionErrorCode;
      message: string;
      fieldErrors?: Record<string, string[]>;
    }>;

export function success<T>(data: T, message?: string): ActionResult<T> {
  if (message === undefined) {
    return { ok: true, data };
  }

  return { ok: true, data, message };
}

export const failure = (
  code: ActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): ActionResult<never> => {
  if (fieldErrors === undefined) {
    return { ok: false, code, message };
  }

  return { ok: false, code, message, fieldErrors };
};
