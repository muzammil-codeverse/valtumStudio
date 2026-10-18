import "server-only";

import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/database";

import {
  createDuplicateFingerprint,
  hashLeadIdentifier,
  isRateLimitBlocked,
  startOfUtcWindow
} from "../domain/protection";
import {
  leadSubmissionSchema,
  type NormalizedLeadSubmission,
  normalizeLeadSubmission
} from "../domain/submission";

const DUPLICATE_WINDOW_MS = 15 * 60 * 1000;
const EMAIL_LIMIT = 8;
const EMAIL_WINDOW_MS = 60 * 60 * 1000;
const REQUESTER_LIMIT = 12;
const REQUESTER_WINDOW_MS = 15 * 60 * 1000;

export class LeadSubmissionError extends Error {
  public constructor(
    public readonly code: "INVALID" | "RATE_LIMITED" | "CONFIGURATION" | "UNEXPECTED",
    cause?: unknown
  ) {
    super(code, cause === undefined ? undefined : { cause });
    this.name = "LeadSubmissionError";
  }
}

function leadHash(value: string, domain: string): string {
  const key = process.env["LEAD_IDENTIFIER_HASH_KEY"];
  if (key === undefined || key.length < 43) {
    throw new LeadSubmissionError("CONFIGURATION");
  }
  return hashLeadIdentifier(key, domain, value);
}

async function enforceRateLimit(
  client: Pick<PrismaClient, "leadRateLimitBucket">,
  scope: "email" | "requester",
  identifier: string,
  limit: number,
  windowMs: number,
  now: Date
): Promise<void> {
  const windowStartedAt = startOfUtcWindow(now, windowMs);
  const bucketKey = leadHash(identifier, `lead-rate-limit:v1:${scope}`);
  const record = await client.leadRateLimitBucket.upsert({
    where: { scope_bucketKey_windowStartedAt: { scope, bucketKey, windowStartedAt } },
    create: {
      scope,
      bucketKey,
      windowStartedAt,
      attemptCount: 1,
      expiresAt: new Date(windowStartedAt.getTime() + windowMs * 2)
    },
    update: { attemptCount: { increment: 1 } }
  });

  if (isRateLimitBlocked(record.blockedUntil, now)) {
    throw new LeadSubmissionError("RATE_LIMITED");
  }
  if (record.attemptCount > limit) {
    await client.leadRateLimitBucket.update({
      where: { id: record.id },
      data: { blockedUntil: new Date(now.getTime() + windowMs) }
    });
    throw new LeadSubmissionError("RATE_LIMITED");
  }
}

function isErrorRecord(error: unknown): error is Record<string, unknown> {
  return typeof error === "object" && error !== null;
}

function uniqueConstraintFields(error: unknown): Readonly<{
  fields: readonly string[];
  modelName: string | null;
}> | null {
  if (!isErrorRecord(error) || error["code"] !== "P2002") {
    return null;
  }
  const metadata = error["meta"];
  if (!isErrorRecord(metadata)) {
    return null;
  }
  const modelName =
    typeof metadata["modelName"] === "string" ? metadata["modelName"] : null;
  const target = metadata["target"];
  if (typeof target === "string") {
    return { fields: [target], modelName };
  }
  if (Array.isArray(target)) {
    return {
      fields: target.filter((value): value is string => typeof value === "string"),
      modelName
    };
  }

  const adapterError = metadata["driverAdapterError"];
  if (!isErrorRecord(adapterError) || !isErrorRecord(adapterError["cause"])) {
    return { fields: [], modelName };
  }
  const constraint = adapterError["cause"]["constraint"];
  if (!isErrorRecord(constraint) || !Array.isArray(constraint["fields"])) {
    return { fields: [], modelName };
  }
  return {
    fields: constraint["fields"].filter(
      (value): value is string => typeof value === "string"
    ),
    modelName
  };
}

export function isExpectedLeadReplayConflict(error: unknown): boolean {
  const conflict = uniqueConstraintFields(error);
  if (conflict === null) {
    return false;
  }
  const fields = conflict.fields.map((field) => field.toLowerCase());
  const isDuplicateWindow =
    conflict.modelName === "LeadDuplicateWindow" &&
    fields.includes("fingerprint") &&
    fields.includes("window_start");
  const isIdempotencyKey =
    conflict.modelName === "Lead" &&
    fields.some((field) => field.includes("idempotency"));
  return isDuplicateWindow || isIdempotencyKey;
}

function isRetryableTransactionConflict(error: unknown): boolean {
  return isErrorRecord(error) && error["code"] === "P2034";
}

export type SubmitLeadInput = Readonly<{
  payload: unknown;
  requesterIdentifier: string | undefined;
  timestamp?: Date;
}>;

export async function submitLead(
  input: SubmitLeadInput,
  client: PrismaClient = prisma
): Promise<void> {
  const parsed = leadSubmissionSchema.safeParse(input.payload);
  if (!parsed.success || parsed.data.honeypot !== "") {
    throw new LeadSubmissionError("INVALID");
  }

  const normalized = normalizeLeadSubmission(parsed.data);
  const now = input.timestamp ?? new Date();
  await enforceRateLimit(
    client,
    "email",
    normalized.email,
    EMAIL_LIMIT,
    EMAIL_WINDOW_MS,
    now
  );
  if (input.requesterIdentifier !== undefined) {
    await enforceRateLimit(
      client,
      "requester",
      input.requesterIdentifier,
      REQUESTER_LIMIT,
      REQUESTER_WINDOW_MS,
      now
    );
  }

  const key = process.env["LEAD_IDENTIFIER_HASH_KEY"];
  if (key === undefined || key.length < 43) {
    throw new LeadSubmissionError("CONFIGURATION");
  }
  const fingerprint = createDuplicateFingerprint(key, normalized);
  const duplicateWindowStart = startOfUtcWindow(now, DUPLICATE_WINDOW_MS);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await client.$transaction(async (tx) => {
        await tx.leadDuplicateWindow.create({
          data: {
            fingerprint,
            windowStart: duplicateWindowStart,
            expiresAt: new Date(
              duplicateWindowStart.getTime() + DUPLICATE_WINDOW_MS * 2
            )
          }
        });
        await createLead(tx, normalized, fingerprint, now);
      });
      return;
    } catch (error) {
      if (isExpectedLeadReplayConflict(error)) {
        return;
      }
      if (isRetryableTransactionConflict(error) && attempt === 0) {
        continue;
      }
      if (error instanceof LeadSubmissionError) {
        throw error;
      }
      throw new LeadSubmissionError("UNEXPECTED", error);
    }
  }
}

async function createLead(
  tx: Prisma.TransactionClient,
  input: NormalizedLeadSubmission,
  fingerprint: string,
  now: Date
): Promise<void> {
  const lead = await tx.lead.create({
    data: {
      idempotencyKey: input.submissionToken,
      name: input.fullName,
      email: input.email,
      company: input.company,
      location: input.location,
      projectType: input.projectType,
      projectStage: input.projectStage,
      projectSummary: input.projectSummary,
      desiredOutcome: input.desiredOutcome,
      timeline: input.timeline,
      budgetRange: input.budgetRange,
      existingProductUrl: input.existingProductUrl,
      referralSource: input.referralSource,
      source: input.source,
      sourceDetail: input.sourceDetail,
      landingPageUrl: input.landingPageUrl,
      referrerUrl: input.referrerUrl,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      utmTerm: input.utmTerm,
      utmContent: input.utmContent,
      duplicateFingerprint: fingerprint,
      consentAt: now,
      consentVersion: input.consentVersion,
      serviceInterests: {
        create: input.serviceInterests.map((interest) => ({ interest }))
      }
    }
  });
  await tx.leadActivity.create({ data: { leadId: lead.id, type: "CREATED" } });
}

export const leadSubmissionPolicy = Object.freeze({
  duplicateWindowMinutes: DUPLICATE_WINDOW_MS / 60000,
  emailLimit: EMAIL_LIMIT,
  emailWindowMinutes: EMAIL_WINDOW_MS / 60000,
  requesterLimit: REQUESTER_LIMIT,
  requesterWindowMinutes: REQUESTER_WINDOW_MS / 60000
});
