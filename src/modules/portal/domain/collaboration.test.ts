import { describe, expect, it } from "vitest";

import {
  interpretInvoiceTransition,
  matchesPrivateFileSignature,
  validateDecisionNote,
  validatePrivateFile
} from "./collaboration";

describe("customer delivery safeguards", () => {
  it("requires meaningful feedback for requested changes", () => {
    expect(() => validateDecisionNote("CHANGES_REQUESTED", "no")).toThrow();
    expect(validateDecisionNote("APPROVED", "")).toBe("");
    expect(validateDecisionNote("CHANGES_REQUESTED", "Please revise the copy")).toBe(
      "Please revise the copy"
    );
  });
  it("cannot mark a draft invoice as paid or reopen a void invoice", () => {
    expect(() => interpretInvoiceTransition("DRAFT", "PAID")).toThrow();
    expect(() => interpretInvoiceTransition("VOID", "PAID")).toThrow();
    expect(interpretInvoiceTransition("ISSUED", "PAID")).toBe("PAID");
  });
  it("rejects malicious filenames and unsupported content types", () => {
    const sha = "a".repeat(64);
    expect(() =>
      validatePrivateFile({
        filename: "../../secret.png",
        contentType: "image/png",
        byteSize: 128,
        checksumSha256: sha
      })
    ).toThrow();
    expect(() =>
      validatePrivateFile({
        filename: "shell.html",
        contentType: "text/html",
        byteSize: 128,
        checksumSha256: sha
      })
    ).toThrow();
    expect(
      validatePrivateFile({
        filename: "Design proof.PDF",
        contentType: "application/pdf",
        byteSize: 128,
        checksumSha256: sha
      }).filename
    ).toBe("Design proof.PDF");
  });
  it("validates file signatures separately from declared MIME", () => {
    expect(
      matchesPrivateFileSignature(
        "application/pdf",
        new Uint8Array([37, 80, 68, 70, 45, 49])
      )
    ).toBe(true);
    expect(
      matchesPrivateFileSignature("image/png", new Uint8Array([37, 80, 68, 70, 45, 49]))
    ).toBe(false);
    expect(
      matchesPrivateFileSignature(
        "image/png",
        new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
      )
    ).toBe(true);
  });
});
