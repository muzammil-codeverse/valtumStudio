import { describe, expect, it } from "vitest";

import { leadSubmissionSchema, normalizeLeadSubmission } from "./submission";

function validSubmission() {
  return {
    fullName: "  Ada   Lovelace ",
    email: "ADA@EXAMPLE.COM",
    company: "  Analytical   Engines  ",
    location: " Sydney ",
    projectType: "WEB_APPLICATION",
    projectStage: "IDEA",
    projectSummary:
      "Keep punctuation, intentional prose, and line breaks.\nThis is a real project brief.",
    desiredOutcome: "  A useful launch  ",
    timeline: "ONE_TO_THREE_MONTHS",
    budgetRange: "AUD_10000_TO_25000",
    existingProductUrl: "https://example.com/product",
    source: "WEBSITE_CONTACT",
    serviceInterests: ["WEB_APPLICATIONS", "BACKEND_OR_API_ENGINEERING"],
    consent: true,
    consentVersion: "privacy-2026-07",
    submissionToken: "4bnJx6Ytq2iN_9sv",
    honeypot: ""
  };
}

describe("lead submission validation", () => {
  it("accepts a complete consented enquiry", () => {
    expect(leadSubmissionSchema.safeParse(validSubmission()).success).toBe(true);
  });

  it("rejects missing consent, unsafe URLs, duplicate interests, and invalid tokens", () => {
    expect(
      leadSubmissionSchema.safeParse({ ...validSubmission(), consent: false }).success
    ).toBe(false);
    expect(
      leadSubmissionSchema.safeParse({
        ...validSubmission(),
        existingProductUrl: "javascript:alert(1)"
      }).success
    ).toBe(false);
    expect(
      leadSubmissionSchema.safeParse({
        ...validSubmission(),
        serviceInterests: ["WEB_APPLICATIONS", "WEB_APPLICATIONS"]
      }).success
    ).toBe(false);
    expect(
      leadSubmissionSchema.safeParse({ ...validSubmission(), submissionToken: "short" })
        .success
    ).toBe(false);
  });

  it("rejects honeypot activation and unexpected fields", () => {
    expect(
      leadSubmissionSchema.safeParse({ ...validSubmission(), honeypot: "bot" }).success
    ).toBe(false);
    expect(
      leadSubmissionSchema.safeParse({ ...validSubmission(), unexpected: "value" })
        .success
    ).toBe(false);
  });
});

describe("lead submission normalization", () => {
  it("canonicalizes simple identity fields without mutating meaningful prose", () => {
    const parsed = leadSubmissionSchema.parse(validSubmission());
    const normalized = normalizeLeadSubmission(parsed);
    expect(normalized.email).toBe("ada@example.com");
    expect(normalized.fullName).toBe("Ada Lovelace");
    expect(normalized.company).toBe("Analytical Engines");
    expect(normalized.projectSummary).toBe(validSubmission().projectSummary.trim());
  });

  it("omits empty optional values as database nulls and canonicalizes safe URLs", () => {
    const parsed = leadSubmissionSchema.parse({
      ...validSubmission(),
      company: "   ",
      existingProductUrl: "https://example.com/product"
    });
    const normalized = normalizeLeadSubmission(parsed);
    expect(normalized.company).toBeNull();
    expect(normalized.existingProductUrl).toBe("https://example.com/product");
  });
});
