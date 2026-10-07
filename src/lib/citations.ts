import type { Citation } from "./analysis";

/**
 * Citation → trusted URL resolution.
 *
 * Citations carry only IDs (sourceType + sourceId + sectionId). This
 * helper maps them to application-owned URLs:
 *
 *   caseStudy → /work/{sourceId}#{sectionId}
 *   profile   → /profile/{sourceId}#{sectionId}
 *
 * The model never emits URLs; if a source type is unknown, we return
 * null and the UI renders the citation without a link (better than
 * trusting model output).
 */
export function resolveCitationUrl(citation: Citation): string | null {
  switch (citation.sourceType) {
    case "caseStudy":
      return `/work/${encodeURIComponent(citation.sourceId)}#${encodeURIComponent(citation.sectionId)}`;
    case "profile":
      return `/profile/${encodeURIComponent(citation.sourceId)}#${encodeURIComponent(citation.sectionId)}`;
    default:
      return null;
  }
}
