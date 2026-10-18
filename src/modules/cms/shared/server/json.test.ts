import { describe, expect, it } from "vitest";

import { toPrismaJson } from "./json";

describe("toPrismaJson", () => {
  it("creates a mutable JSON-compatible rich-text value", () => {
    const json = toPrismaJson({
      root: {
        type: "root",
        children: [{ type: "paragraph", children: [{ type: "text", text: "Hello" }] }]
      }
    });

    expect(json).toEqual({
      root: {
        type: "root",
        children: [{ type: "paragraph", children: [{ type: "text", text: "Hello" }] }]
      }
    });
  });
});
