import { z } from "zod";

export const recordId = z.string().min(8).max(128);
export const entryText = (max: number) => z.string().trim().min(2).max(max);

export const decisionResponse = z.enum(["APPROVED", "CHANGES_REQUESTED"]);

export function validateDecisionNote(
  status: z.infer<typeof decisionResponse>,
  note: string
): string {
  const clean = note.trim();
  if (clean.length > 2000) throw new Error("Feedback is too long.");
  if (status === "CHANGES_REQUESTED" && clean.length < 10) {
    throw new Error("Describe the changes you need in at least 10 characters.");
  }
  return clean;
}

export function interpretInvoiceTransition(status: string, action: string) {
  if (status !== "ISSUED") throw new Error("Only issued invoices can be updated.");
  if (action !== "PAID" && action !== "VOID") {
    throw new Error("Unsupported invoice status transition.");
  }
  return action as "PAID" | "VOID";
}

export const clientFileTypes = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"]
} as const;

export const MAX_DELIVERY_FILE_BYTES = 10 * 1024 * 1024;

export function validatePrivateFile(input: {
  filename: string;
  contentType: string;
  byteSize: number;
  checksumSha256: string;
}) {
  const name = input.filename.trim().normalize("NFC");
  if (
    name.length < 1 ||
    name.length > 130 ||
    /[\\/\x00-\x1f\x7f]/.test(name) ||
    name === "." ||
    name === ".."
  )
    throw new Error("Invalid filename.");
  const extensions = clientFileTypes[input.contentType as keyof typeof clientFileTypes];
  if (
    !extensions ||
    !extensions.some((ext: string) => name.toLowerCase().endsWith(ext))
  ) {
    throw new Error("Only PDF, JPG, and PNG files are accepted.");
  }
  if (
    !Number.isSafeInteger(input.byteSize) ||
    input.byteSize < 8 ||
    input.byteSize > MAX_DELIVERY_FILE_BYTES
  ) {
    throw new Error("File size must be between 8 bytes and 10 MB.");
  }
  if (!/^[a-f\d]{64}$/i.test(input.checksumSha256)) {
    throw new Error("Invalid file checksum.");
  }
  return {
    filename: name,
    contentType: input.contentType as keyof typeof clientFileTypes,
    byteSize: input.byteSize,
    checksumSha256: input.checksumSha256.toLowerCase()
  };
}

export function matchesPrivateFileSignature(mime: string, bytes: Uint8Array): boolean {
  if (mime === "application/pdf") {
    return (
      bytes.length >= 5 &&
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46 &&
      bytes[4] === 0x2d
    );
  }
  if (mime === "image/png") {
    return (
      bytes.length >= 8 &&
      [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)
    );
  }
  if (mime === "image/jpeg") {
    return (
      bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    );
  }
  return false;
}
