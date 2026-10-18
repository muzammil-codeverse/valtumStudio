import type { Prisma } from "@/generated/prisma/client";

import { CmsValidationError } from "../domain/concurrency";
import type { RichTextDocument, RichTextNode } from "../domain/rich-text";

function toPrismaJsonNode(node: RichTextNode): Record<string, Prisma.InputJsonValue> {
  const json: Record<string, Prisma.InputJsonValue> = {
    type: node.type
  };

  if (node.text !== undefined) {
    json["text"] = node.text;
  }

  if (node.url !== undefined) {
    json["url"] = node.url;
  }

  if (node.children !== undefined) {
    json["children"] = node.children.map(toPrismaJsonNode);
  }

  return json;
}

export function toPrismaJson(document: RichTextDocument): Prisma.InputJsonValue {
  return {
    root: {
      type: document.root.type,
      children: document.root.children.map(toPrismaJsonNode)
    }
  };
}

function isPlainJsonObject(value: object): value is Record<string, unknown> {
  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function toPrismaJsonValue(value: unknown): Prisma.InputJsonValue {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(toPrismaJsonValue);
  }

  if (value === null || typeof value !== "object" || !isPlainJsonObject(value)) {
    throw new CmsValidationError("Structured content must be JSON-compatible.");
  }

  const json: Record<string, Prisma.InputJsonValue> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    json[key] = toPrismaJsonValue(nestedValue);
  }

  return json;
}

export function toPrismaStructuredJson(value: unknown): Prisma.InputJsonValue {
  return toPrismaJsonValue(value);
}
