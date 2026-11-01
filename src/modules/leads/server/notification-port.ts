import "server-only";

import { logger } from "@/lib/logging";

export type LeadNotificationEvent =
  | Readonly<{ leadId: string; type: "LEAD_SUBMITTED" }>
  | Readonly<{ leadId: string; type: "LEAD_ASSIGNED" }>
  | Readonly<{ leadId: string; type: "LEAD_STATUS_CHANGED" }>;

export interface LeadNotificationPort {
  publish(event: LeadNotificationEvent): Promise<void>;
}

// The persistence transaction is authoritative even if email delivery is unavailable.
export const disabledLeadNotificationPort: LeadNotificationPort = {
  publish: () => Promise.resolve()
};

export type SubmittedLeadNotification = Readonly<{
  leadId: string;
  name: string;
  email: string;
  projectType: string;
  projectSummary: string;
}>;

type ResendSettings = Readonly<{
  apiKey: string;
  from: string;
  to: string[];
}>;

function configuredResend(): ResendSettings | null {
  const apiKey = process.env["RESEND_API_KEY"]?.trim();
  const from = process.env["LEAD_EMAIL_FROM"]?.trim();
  const to = process.env["LEAD_EMAIL_TO"]
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!apiKey || !from || !to?.length) return null;
  if (to.length > 4) throw new Error("LEAD_EMAIL_TO accepts at most four recipients.");
  return { apiKey, from, to };
}

/**
 * Sends one owner-facing alert after a new lead commits to PostgreSQL.
 * Uses the durable lead ID for 24-hour Resend idempotency, never the visitor's IP.
 * A provider error is logged without PII and must never roll back or rejec¶»§q«^