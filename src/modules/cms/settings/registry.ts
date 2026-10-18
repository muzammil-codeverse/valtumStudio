import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));
export const settingsRegistry = {
  identity: z.object({
    siteName: z.string().trim().min(1).max(120),
    legalName: z.string().trim().max(160).optional(),
    tagline: z.string().trim().max(220).optional(),
    shortDescription: z.string().trim().max(500).optional()
  }),
  contact: z.object({
    contactEmail: z.string().email().optional().or(z.literal("")),
    contactPhone: z.string().trim().max(60).optional(),
    businessLocation: z.string().trim().max(240).optional()
  }),
  social: z.object({ linkedinUrl: optionalUrl, instagramUrl: optionalUrl }),
  seo: z.object({
    defaultSeoTitle: z.string().trim().max(70).optional(),
    defaultSeoDescription: z.string().trim().max(170).optional(),
    defaultSocialImageAssetId: z.string().optional()
  }),
  legal: z.object({
    companyNumber: z.string().trim().max(100).optional(),
    registeredAddress: z.string().trim().max(500).optional()
  })
} as const;
export type SettingsGroup = keyof typeof settingsRegistry;
export const settingsGroups = [
  "identity",
  "contact",
  "social",
  "seo",
  "legal"
] as const satisfies readonly SettingsGroup[];
const secretPattern = /(secret|password|token|api[_-]?key|database|private[_-]?key)/i;
export function isSafeSettingKey(key: string): key is SettingsGroup {
  return !secretPattern.test(key) && settingsGroups.some((group) => group === key);
}
