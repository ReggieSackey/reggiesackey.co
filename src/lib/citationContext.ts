import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type { Citation } from "./analysis";

/**
 * Server-side hydration of citation IDs into trusted titles/headings.
 *
 * Mirrors what the future pipeline's "validate citations" step will do:
 * every citation must resolve to real, published canonical content, and
 * the renderer — not the model — owns display data and URLs.
 */

export interface CitationDisplayContext {
  /** key: `${sourceType}:${sourceId}` */
  sourceTitles: Map<string, string>;
  /** key: `${sourceType}:${sourceId}:${sectionId}` */
  sectionHeadings: Map<string, string>;
}

function sourceKey(sourceType: string, sourceId: string) {
  return `${sourceType}:${sourceId}`;
}

function sectionKey(c: Citation) {
  return `${c.sourceType}:${c.sourceId}:${c.sectionId}`;
}

export async function buildCitationContext(
  citations: Citation[],
): Promise<CitationDisplayContext> {
  const sourceTitles = new Map<string, string>();
  const sectionHeadings = new Map<string, string>();

  const seen = new Set<string>();
  for (const c of citations) {
    seen.add(sourceKey(c.sourceType, c.sourceId));
  }

  for (const key of seen) {
    const [sourceType, sourceId] = key.split(":");
    if (sourceType === "caseStudy") {
      const data = await fetchQuery(
        api.caseStudies.getCaseStudyWithSections,
        { slug: sourceId },
      );
      if (!data) continue;
      sourceTitles.set(key, data.caseStudy.title);
      for (const s of data.sections) {
        sectionHeadings.set(`${key}:${s.slug}`, s.heading);
      }
    } else if (sourceType === "profile") {
      const data = await fetchQuery(
        api.profileDocuments.getProfileDocumentWithSections,
        { type: sourceId },
      );
      if (!data) continue;
      sourceTitles.set(key, data.document.title);
      for (const s of data.sections) {
        sectionHeadings.set(`${key}:${s.slug}`, s.heading);
      }
    }
  }

  return { sourceTitles, sectionHeadings };
}

export { sourceKey, sectionKey };
