import type { Role } from "./roles";

export type EntryAssurance =
  | "ANONYMOUS"
  | "PASSWORD_AUTHENTICATED"
  | "PASSWORD_CHANGE_REQUIRED"
  | "TWO_FACTOR_SETUP_REQUIRED"
  | "FULLY_AUTHENTICATED";

export function destinationForSession(assurance: EntryAssurance, role?: Role): string {
  if (assurance === "ANONYMOUS" || assurance === "PASSWORD_AUTHENTICATED") {
    return "/auth/sign-in";
  }
  if (assurance === "PASSWORD_CHANGE_REQUIRED") return "/auth/change-password";
  if (assurance === "TWO_FACTOR_SETUP_REQUIRED") return "/auth/setup-two-factor";
  return role === "client" ? "/portal" : "/admin";
}
