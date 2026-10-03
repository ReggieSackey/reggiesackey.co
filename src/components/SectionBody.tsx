/**
 * Minimal markdown-lite renderer for canonical section bodies.
 *
 * Bodies are stored as plain text in Convex (the evaluator's citation
 * quotes are exact substrings of the stored body), but the canonical
 * editorial style is bullet-heavy: blocks whose lines start with "- "
 * render as <ul> bullets; blank-line-separated blocks render as
 * paragraphs. Internal single newlines are preserved via
 * whitespace-pre-line so wrapped bullet lines stay intact.
 *
 * Deliberately not a general markdown parser — the content contract
 * supports exactly two constructs.
 */

type SectionBodyProps = {
  body: string;
  /** Additional classes on the wrapping container. */
  className?: string;
};

export function SectionBody({ body, className = "" }: SectionBodyProps) {
  const blocks = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className={`mt-3 max-w-[65ch] space-y-4 ${className}`}>
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim());
        const isList = lines.length > 0 && lines.every((l) => l.startsWith("- "));

        if (isList) {
          return (
            <ul
              key={i}
              className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-neutral-700"
            >
              {lines.map((line, j) => (
                <li key={j}>{line.slice(2)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={i}
            className="whitespace-pre-line text-[15px] leading-7 text-neutral-700"
          >
            {block}
          </p>
        );
      })}
    </div>
  );
}
