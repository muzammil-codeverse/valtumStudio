import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(320));

const prohibitedPasswordTerms = ["admin", "password", "siglumstudio"];

export const passwordSchema = z.string().min(14).max(128);

export function validatePasswordForEmail(
  password: string,
  normalizedEmail: string
): string {
  const validated = passwordSchema.parse(password);
  const foldedPassword = validated.toLocaleLowerCase();
  const localPart = normalizedEmail.split("@", 1)[0] ?? "";

  if (
    foldedPassword === normalizedEmail ||
    foldedPassword.includes(normalizedEmail) ||
    (localPart.length >= 4 && foldedPassword.includes(localPart)) ||
    prohibitedPasswordTerms.some((term) => foldedPassword.includes(term))
  ) {
    throw new Error("Choose a different password.");
  }

  return validated;
}
