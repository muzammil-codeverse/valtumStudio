export function assertRevisionMatch(affected: number): void {
  if (affected !== 1) {
    throw new Error("CMS_CONFLICT");
  }
}

export class CmsValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "CmsValidationError";
  }
}

export type UpdateIdentity = Readonly<{
  id: string;
  revision: number;
}>;

export function requireUpdateIdentity(
  id: string | undefined,
  revision: number | undefined
): UpdateIdentity {
  if (!id || revision === undefined) {
    throw new CmsValidationError(
      "A valid record identifier and revision are required."
    );
  }

  return {
    id,
    revision
  };
}
