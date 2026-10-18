import { validateSafeRichTextLink } from "./urls";

export type RichTextNode = Readonly<{
  type: string;
  text?: string;
  url?: string;
  children?: RichTextNode[];
}>;

export type RichTextDocument = Readonly<{
  root: Readonly<{
    type: "root";
    children: RichTextNode[];
  }>;
}>;

const supported = new Set([
  "paragraph",
  "heading",
  "list",
  "listitem",
  "quote",
  "link",
  "text",
  "code",
  "root"
]);

export function validateRichTextDocument(value: unknown): RichTextDocument | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const root = (value as { root?: unknown }).root;
  if (
    !root ||
    typeof root !== "object" ||
    (root as { type?: unknown }).type !== "root"
  ) {
    return null;
  }

  const visit = (node: unknown): node is RichTextNode => {
    if (!node || typeof node !== "object") {
      return false;
    }

    const item = node as { type?: unknown; url?: unknown; children?: unknown };

    if (typeof item.type !== "string" || !supported.has(item.type)) {
      return false;
    }

    if (
      item.type === "link" &&
      (typeof item.url !== "string" || !validateSafeRichTextLink(item.url))
    ) {
      return false;
    }

    return !Array.isArray(item.children) || item.children.every(visit);
  };

  const children = (root as { children?: unknown }).children;

  return Array.isArray(children) && children.every(visit)
    ? (value as RichTextDocument)
    : null;
}

export function richTextToPlainText(document: RichTextDocument): string {
  const visit = (node: RichTextNode): string => {
    return [node.text ?? "", ...(node.children ?? []).map(visit)].join(" ");
  };

  return document.root.children.map(visit).join(" ").replace(/\s+/g, " ").trim();
}
