import type { Citation } from "@/lib/analysis";
import { resolveCitationUrl } from "@/lib/citations";
import {
  sourceKey,
  sectionKey,
  type CitationDisplayContext,
} from "@/lib/citationContext";

const SOURCE_MARK: Record<Citation["sourceType"], string> = {
  caseStudy: "Case study",
  profile: "Profile",
};

/**
 * Compact source citation: source mark, source title, section, link.
 * URL comes exclusively from resolveCitationUrl — never from the
 * citation payload itself. Titles/headings come from the canonical
 * content (hydration), never from the citation payload.
 */
export function CitationRow({
  citation,
  context,
}: {
  citation: Citation;
  context: CitationDisplayContext;
}) {
  const href = resolveCitationUrl(citation);
  const sourceTitle = context.sourceTitles.get(
    sourceKey(citation.sourceType, citation.sourceId),
  );
  const sectionHeading = context.sectionHeadings.get(sectionKey(citation));

  return (
    <div className="text-[13px] text-neutral-500">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-medium text-neutral-700">
          {SOURCE_MARK[citation.sourceType]}
        </span>
        <span aria-hidden="true">·</span>
        <span>{sourceTitle ?? citation.sourceId}</span>
        <span aria-hidden="true">·</span>
        <span>{sectionHeading ?? citation.sectionId}</span>
        {href ? (
          <a
            href={href}
            className="ml-1 whitespace-nowrap font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
          >
            View source →
          </a>
        ) : null}
      </div>
      {citation.quote ? (
        <blockquote className="mt-1.5 border-l border-neutral-300 pl-3 text-[13px] italic leading-6 text-neutral-500">
          &ldquo;{citation.quote}&rdquo;
        </blockquote>
      ) : null}
    </div>
  );
}
