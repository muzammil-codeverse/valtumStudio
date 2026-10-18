import { z } from "zod";

import { validateCanonicalUrl } from "@/modules/cms/shared/domain/urls";

export const leadStatuses = [
  "NEW",
  "IN_REVIEW",
  "QUALIFIED",
  "CONTACTED",
  "DISCOVERY",
  "PROPOSAL",
  "WON",
  "LOST",
  "SPAM"
] as const;
export const leadPriorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export const leadSources = [
  "WEBSITE_CONTACT",
  "PROJECT_FIT",
  "REFERRAL",
  "LINKEDIN",
  "UPWORK",
  "FIVERR",
  "FREELANCER",
  "GURU",
  "INSTAGRAM",
  "DIRECT_OUTREACH",
  "OTHER"
] as const;
export const projectTypes = [
  "WEBSITE",
  "WEB_APPLICATION",
  "INTERNAL_BUSINESS_SYSTEM",
  "MARKETPLACE_OR_BOOKING_PLATFORM",
  "AI_OR_AUTOMATION",
  "DATA_OR_ANALYTICS",
  "COMPUTER_VISION",
  "ANDROID_OR_FLUTTER",
  "BLOCKCHAIN_OR_WEB3",
  "EXISTING_PRODUCT_IMPROVEMENT",
  "NOT_SURE",
  "OTHER"
] as const;
export const projectStages = [
  "IDEA",
  "DISCOVERY",
  "DESIGN",
  "IN_DEVELOPMENT",
  "EXISTING_PRODUCT",
  "LAUNCH_OR_GROWTH",
  "NOT_SURE",
  "OTHER"
] as const;
export const budgetRanges = [
  "UNDER_AUD_5000",
  "AUD_5000_TO_10000",
  "AUD_10000_TO_25000",
  "AUD_25000_TO_50000",
  "AUD_50000_PLUS",
  "NOT_SURE"
] as const;
export const timelines = [
  "AS_SOON_AS_POSSIBLE",
  "ONE_TO_THREE_MONTHS",
  "THREE_TO_SIX_MONTHS",
  "SIX_MONTHS_PLUS",
  "FLEXIBLE",
  "NOT_SURE"
] as const;
export const serviceInterests = [
  "WEBSITES",
  "WEB_APPLICATIONS",
  "BACKEND_OR_API_ENGINEERING",
  "ANDROID_OR_FLUTTER",
  "AI_AND_AUTOMATION",
  "DATA_AND_ANALYTICS",
  "COMPUTER_VISION",
  "BLOCKCHAIN_AND_WEB3",
  "TECHNICAL_CONSULTING",
  "NOT_SURE"
] as const;

const optionalText = (maximum: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(maximum).optional()
  );

export const leadSubmissionSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    company: optionalText(160),
    location: optionalText(160),
    projectType: z.enum(projectTypes),
    projectStage: z.enum(projectStages),
    projectSummary: z.string().trim().min(20).max(5000),
    desiredOutcome: optionalText(2000),
    timeline: z.enum(timelines).optional(),
    budgetRange: z.enum(budgetRanges).optional(),
    existingProductUrl: optionalText(2048),
    referralSource: optionalText(160),
    source: z.enum(leadSources).default("WEBSITE_CONTACT"),
    sourceDetail: optionalText(160),
    serviceInterests: z.array(z.enum(serviceInterests)).min(1).max(10),
    consent: z.literal(true),
    consentVersion: z.string().trim().min(1).max(80),
    submissionToken: z.string().regex(/^[A-Za-z0-9_-]{16,128}$/),
    honeypot: z.string().max(0).default(""),
    landingPageUrl: optionalText(2048),
    referrerUrl: optionalText(2048),
    utmSource: optionalText(160),
    utmMedium: optionalText(160),
    utmCampaign: optionalText(160),
    utmTerm: optionalText(160),
    utmContent: optionalText(160)
  })
  .strict()
  .superRefine((value, context) => {
    for (const field of [
      "existingProductUrl",
      "landingPageUrl",
      "referrerUrl"
    ] as const) {
      const candidate = value[field];
      if (candidate !== undefined && validateCanonicalUrl(candidate) === undefined) {
        context.addIssue({
          code: "custom",
          message: "Use a valid http or https URL.",
          path: [field]
        });
      }
    }
    if (new Set(value.serviceInterests).size !== value.serviceInterests.length) {
      context.addIssue({
        code: "custom",
        message: "Choose each service interest only once.",
        path: ["serviceInterests"]
      });
    }
  });

export type LeadSubmission = z.infer<typeof leadSubmissionSchema>;

function compactText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function nullableText(value: string | undefined): string | null {
  return value === undefined ? null : compactText(value);
}

export type NormalizedLeadSubmission = Readonly<{
  budgetRange: Exclude<LeadSubmission["budgetRange"], undefined> | null;
  company: string | null;
  consentVersion: string;
  desiredOutcome: string | null;
  email: string;
  existingProductUrl: string | null;
  fullName: string;
  landingPageUrl: string | null;
  location: string | null;
  projectStage: LeadSubmission["projectStage"];
  projectSummary: string;
  projectType: LeadSubmission["projectType"];
  referralSource: string | null;
  referrerUrl: string | null;
  serviceInterests: readonly LeadSubmission["serviceInterests"][number][];
  source: LeadSubmission["source"];
  sourceDetail: string | null;
  submissionToken: string;
  timeline: Exclude<LeadSubmission["timeline"], undefined> | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmMedium: string | null;
  utmSource: string | null;
  utmTerm: string | null;
}>;

export function normalizeLeadSubmission(
  input: LeadSubmission
): NormalizedLeadSubmission {
  const uniqueInterests = [...new Set(input.serviceInterests)];
  return {
    budgetRange: input.budgetRange ?? null,
    company: nullableText(input.company),
    consentVersion: compactText(input.consentVersion),
    desiredOutcome: input.desiredOutcome?.trim() ?? null,
    email: input.email.trim().toLowerCase(),
    existingProductUrl:
      input.existingProductUrl === undefined
        ? null
        : (validateCanonicalUrl(input.existingProductUrl) ?? null),
    fullName: compactText(input.fullName),
    landingPageUrl:
      input.landingPageUrl === undefined
        ? null
        : (validateCanonicalUrl(input.landingPageUrl) ?? null),
    location: nullableText(input.location),
    projectStage: input.projectStage,
    projectSummary: input.projectSummary.trim(),
    projectType: input.projectType,
    referralSource: nullableText(input.referralSource),
    referrerUrl:
      input.referrerUrl === undefined
        ? null
        : (validateCanonicalUrl(input.referrerUrl) ?? null),
    serviceInterests: uniqueInterests,
    source: input.source,
    sourceDetail: nullableText(input.sourceDetail),
    submissionToken: input.submissionToken,
    timeline: input.timeline ?? null,
    utmCampaign: nullableText(input.utmCampaign),
    utmContent: nullableText(input.utmContent),
    utmMedium: nullableText(input.utmMedium),
    utmSource: nullableText(input.utmSource),
    utmTerm: nullableText(input.utmTerm)
  };
}
