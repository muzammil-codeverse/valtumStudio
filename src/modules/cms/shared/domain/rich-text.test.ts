import { describe, expect, it } from "vitest";

import { richTextToPlainText, validateRichTextDocument } from "./rich-text";
describe("rich text validation", () => {
  it("accepts supported structured content", () => {
    const doc = validateRichTextDocument({
      root: {
        type: "root",
        children: [{ type: "paragraph", children: [{ type: "text", text: "Hello" }] }]
      }
    });
    expect(doc).not.toBeNull();

    if (!doc) {
      throw new Error("Expected valid rich text document.");
    }

    expect(richTextToPlainText(doc)).toBe("Hello");
  });
  it("rejects arbitrary nodes", () =>
    expect(
      validateRichTextDocument({
        root: { type: "root", children: [{ type: "script" }] }
      })
    ).toBeNull());

  it("rejects unsafe link protocols", () => {
    const document = validateRichTextDocument({
      root: {
        type: "root",
        children: [
          {
            type: "link",
            url: "javascript:alert(1)",
            children: [{ type: "text", text: "Unsafe" }]
          }
        ]
      }
    });

    expect(document).toBeNull();
  });

  it("accepts approved rich-text link protocols", () => {
    const document = validateRichTextDocument({
      root: {
        type: "root",
        children: [
          {
            type: "link",
            url: "mailto:hello@example.com",
            children: [{ type: "text", text: "Email us" }]
          }
        ]
      }
    });

    expect(document).not.toBeNull();
  });
});
