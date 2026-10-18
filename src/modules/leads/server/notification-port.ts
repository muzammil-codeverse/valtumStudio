import "server-only";

export type LeadNotificationEvent =
  | Readonly<{ leadId: string; type: "LEAD_SUBMITTED" }>
  | Readonly<{ leadId: string; type: "LEAD_ASSIGNED" }>
  | Readonly<{ leadId: string; type: "LEAD_STATUS_CHANGED" }>;

/**
 * Phase 12 may provide an email adapter. Phase 6 persistence never depends on
 * notification delivery, so a missing provider cannot lose an enquiry.
 */
export interface LeadNotificationPort {
  publish(event: LeadNotificationEvent): Promise<void>;
}

export const disabledLeadNotificationPort: LeadNotificationPort = {
  publish: () => Promise.resolve()
};
