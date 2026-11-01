export function RevealText({
  text,
  as: Tag = "h2",
  className
}: {
  text: string;
  as?: "h2" | "p";
  className?: string;
}): React.JSX.Element {
  return (
    <Tag data-word-reveal aria-label={text} className={className}>
      {text.split(/(\s+)/).map((word, i) =>
        /\s/.test(word) ? (
          word
        ) : (
          <span className="x-word" aria-hidden="true" key={i}>
            {word}
          </span>
        )
      )}
    </Tag>
  );
}
