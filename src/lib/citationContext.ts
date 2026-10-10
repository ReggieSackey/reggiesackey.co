import type { Citation } from "./analysis";

/**
 * Hydration of citation IDs into trusted titles/headings.
 *
 * The renderer — not the model — owns display data and URLs. The maps
 * can be built server-side (fetchQuery) or client-side (useQuery +
 * buildCitationContextFromRows) from the canonical Convex query.
 */

export interface CitationDisplayContext {
  /** key: `${sourceType}:${sourceId}` */
  sourceTitles: Map<string, string>;
  /** key: `${sourceType}:${sourceId}:${sectionId}` */
  sectionHeadings: Map<string, string>;
}

export interface CitationSourceRow {
  sourceType: string;
  sourceId: string;
  sectionId: string;
  sourceTitle: string;
  sectionHeading: string | null;
}

function sourceKey(sourceType: string, sourceId: string) {
  return `${sourceType}:${sourceId}`;
}

function sectionKey(c: Citation) {
  return `${c.sourceType}:${c.sourceId}:${c.sectionId}`;
}

/** Client-side hydration from the getCitationSources query result. */
export function buildCitationContextFromRows(
  rows: CitationSourceRow[],
): CitationDisplayContext {
  const sourceTitles = new Map<string, string>();
  const sectionHeadings = new Map<string, string>();
  for (const row of rows) {
    sourceTitles.set(sourceKey(row.sourceType, row.sourceId), row.sourceTitle);
    if (row.sectionHeading) {
      sectionHeadings.set(
        `${row.sourceType}:${row.sourceId}:${row.sectionId}`,
        row.sectionHeading,
      );
    }
  }
  return { sourceTitles, sectionHeadings };
}

/** Collect the deduplicated citation refs used by an analysis. */
export function collectCitationRefs(
  citations: Citation[],
): Array<{ sourceType: string; sourceId: string; sectionId: string }> {
  const seen = new Set<string>();
  const refs: Array<{ sourceType: string; sourceId: string; sectionId: string }> = [];
  for (const c of citations) {
    const key = `${c.sourceType}:${c.sourceId}:${c.sectionId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push({ sourceType: c.sourceType, sourceId: c.sourceId, sectionId: c.sectionId });
  }
  return refs;
}

export { sourceKey, sectionKey };
