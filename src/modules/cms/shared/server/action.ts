import "server-only";

import { headers } from "next/headers";
import { ZodError } from "zod";

import type { Action, Resource } from "@/modules/auth/policies/authorization";
import { AuthorizationError } from "@/modules/auth/policies/authorization";
import type { AuthPrincipal } from "@/modules/auth/server/authorization";
import {
  AuthenticationAssuranceError,
  AuthenticationError,
  requirePermission
} from "@/modules/auth/server/authorization";

import { CmsValidationError } from "../domain/concurrency";
import { type ActionResult, failure } from "../types/action-result";

export async function authorizeCms(
  resource: Resource,
  action: Action
): Promise<AuthPrincipal> {
  return requirePermission(await headers(), resource, action);
}

/** Editors may only edit drafts; this is enforced by server actions, not UI. */
export function assertDraftEditable(
  principal: AuthPrincipal,
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
): void {
  if (principal.role === "editor" && status !== "DRAFT") {
    throw new AuthorizationError();
  }
}

export function toActionFailure(error: unknown): ActionResult<never> {
  if (error instanceof ZodError) {
    const entries = Object.entries(error.flatten().fieldErrors).filter(
      (entry): entry is [string, string[]] => entry[1] !== undefined
    );
    const fieldErrors = Object.fromEntries(entries);
    return failure("VALIDATION_ERROR", "Check the highlighted fields.", fieldErrors);
  }

  if (error instanceof CmsValidationError) {
    return failure("VALIDATION_ERROR", error.message);
  }

  if (
    error instanceof AuthenticationError ||
    error instanceof AuthenticationAssuranceError
  ) {
    return failure("UNAUTHORIZED", "Authentication is required.");
  }

  if (error instanceof AuthorizationError) {
    return failure("FORBIDDEN", "You do not have permission to do that.");
  }

  if (error instanceof Error && error.message === "CMS_CONFLICT") {
    return failure(
      "CONFLICT",
      "This content changed elsewhere. Reload before saving again."
    );
  }

  if (error instanceof Error && error.message === "CMS_NOT_FOUND") {
    return failure("NOT_FOUND", "This content no longer exists.");
  }

  if (error instanceof Error && error.message === "CMS_DUPLICATE") {
    return failure("DUPLICATE", "That value is already in use.");
  }
  return failure("INTERNAL_ERROR", "We could not save this change. Please try again.");
}
