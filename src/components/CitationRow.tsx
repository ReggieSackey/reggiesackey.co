"use client";

import type { Citation } from "@/lib/analysis";
import { resolveCitationUrl } from "@/lib/citations";
import {
  sourceKey,
  sectionKey,
  type CitationDisplayContext,
} from "@/lib/citationContext";

/**
 * Compact source citation: source mark, source title, section, link.
 * URL comes exclusively from resolveCitationUrl — never from the
 * citation payload itself. Titles/headings come from the canonical
 * content (hydration), never from the citation payload.
 *
 * onInternalNavigate: when provided, plain left-clicks are routed
 * through SPA navigation; modified clicks (Cmd/Ctrl/Shift/Alt) and
 * middle clicks keep native browser link semantics.
 */
export function CitationRow({
  citation,
  context,
  onInternalNavigate,
}: {
  citation: Citation;
  context: CitationDisplayContext;
  onInternalNavigate?: (href: string, citation: Citation) => void;
}) {
  const href = resolveCitationUrl(citation);
  const sourceTitle = context.sourceTitles.get(
    sourceKey(citation.sourceType, citation.sourceId),
  );
  const sectionHeading = context.sectionHeadings.get(sectionKey(citation));
  const sourceLabel = (sourceTitle ?? citation.sourceId).split(/\s+[—-]\s+/)[0];

  return (
    <div className="text-[13px] text-neutral-500">
      {href ? (
        <a
          href={href}
          onClick={(event) => {
            if (
              onInternalNavigate &&
              event.button === 0 &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.shiftKey &&
              !event.altKey
            ) {
              event.preventDefault();
              onInternalNavigate(href, citation);
            }
          }}
          className="font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-4 hover:text-neutral-900 hover:decoration-neutral-900"
        >
          {sourceLabel}
          {sectionHeading ? ` · ${sectionHeading}` : ""} →
        </a>
      ) : (
        <span>
          {sourceLabel}
          {sectionHeading ? ` · ${sectionHeading}` : ""}
        </span>
      )}
    </div>
  );
}
