"use client";
import { useId, useState } from "react";
const starter = JSON.stringify(
  {
    root: {
      type: "root",
      children: [{ type: "paragraph", children: [{ type: "text", text: "" }] }]
    }
  },
  null,
  2
);
export function RichTextEditor({
  name = "bodyJson",
  defaultValue,
  label = "Structured content"
}: {
  name?: string;
  defaultValue?: string;
  label?: string;
}): React.JSX.Element {
  const id = useId();
  const [value, setValue] = useState(defaultValue || starter);
  return (
    <div className="space-y-1.5">
      <label
        className="block text-xs font-semibold text-[var(--admin-text)]"
        htmlFor={id}
      >
        {label}
      </label>
      <p className="text-[11px] text-[var(--admin-text-secondary)]">
        Structured editor state only. Supported content: paragraphs, headings, lists,
        links, quotes, inline code, bold, italic, and underline.
      </p>
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={12}
        spellCheck={false}
        className="w-full rounded-md border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] p-3 font-mono text-xs"
      />
    </div>
  );
}
