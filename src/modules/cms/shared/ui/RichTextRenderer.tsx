import type { RichTextDocument, RichTextNode } from "../domain/rich-text";

function Node({ node }: { node: RichTextNode }): React.JSX.Element | null {
  const children = node.children?.map((child, index) => (
    <Node key={index} node={child} />
  ));
  if (node.type === "text" || node.type === "code") return <>{node.text}</>;
  if (node.type === "heading")
    return <h2 className="text-lg font-semibold">{children}</h2>;
  if (node.type === "paragraph") return <p>{children}</p>;
  if (node.type === "quote")
    return <blockquote className="border-l-2 pl-4 italic">{children}</blockquote>;
  if (node.type === "list")
    return <ul className="list-disc space-y-1 pl-5">{children}</ul>;
  if (node.type === "listitem") return <li>{children}</li>;
  if (node.type === "link" && node.url) {
    const external = /^https?:\/\//.test(node.url);
    return (
      <a
        href={node.url}
        className="underline"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  return <>{children}</>;
}
export function RichTextRenderer({
  document
}: {
  document: RichTextDocument;
}): React.JSX.Element {
  return (
    <div className="space-y-3 text-sm leading-7">
      <>
        {document.root.children.map((node, index) => (
          <Node key={index} node={node} />
        ))}
      </>
    </div>
  );
}
