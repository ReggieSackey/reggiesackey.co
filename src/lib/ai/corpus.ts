import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";

/**
 * The canonical public source corpus: every PUBLISHED section of every
 * published case study and profile document. This is the complete set
 * of facts the evaluation model may cite — nothing else.
 */

export type SourceType = "caseStudy" | "profile";

export interface SourceSection {
  sourceType: SourceType;
  /** Stable case-study slug or profile document type. */
  sourceId: string;
  sourceTitle: string;
  /** Stable section slug — the citation anchor. */
  sectionId: string;
  sectionHeading: string;
  body: string;
}

export async function getPublicSourceCorpus(): Promise<SourceSection[]> {
  const [caseStudies, profileDocuments] = await Promise.all([
    fetchQuery(api.caseStudies.getCaseStudiesWithSections, {}),
    fetchQuery(api.profileDocuments.getProfileDocumentsWithSections, {}),
  ]);

  const sources: SourceSection[] = [];

  for (const { caseStudy, sections } of caseStudies) {
    for (const s of sections) {
      sources.push({
        sourceType: "caseStudy",
        sourceId: caseStudy.slug,
        sourceTitle: caseStudy.title,
        sectionId: s.slug,
        sectionHeading: s.heading,
        body: s.body,
      });
    }
  }

  for (const { document, sections } of profileDocuments) {
    for (const s of sections) {
      sources.push({
        sourceType: "profile",
        sourceId: document.type,
        sourceTitle: document.title,
        sectionId: s.slug,
        sectionHeading: s.heading,
        body: s.body,
      });
    }
  }

  return sources;
}

/**
 * Renders the corpus as clearly delimited SOURCE records for the model.
 * IDs and headings are included so citations can reference them
 * exactly; no database internals (no _id, no timestamps, no admin
 * metadata) are exposed.
 */
export function renderCorpusForModel(sources: SourceSection[]): string {
  return sources
    .map(
      (s) =>
        `SOURCE\n` +
        `type: ${s.sourceType}\n` +
        `sourceId: ${s.sourceId}\n` +
        `sectionId: ${s.sectionId}\n` +
        `title: ${s.sourceTitle}\n` +
        `section: ${s.sectionHeading}\n` +
        `body:\n${s.body}`,
    )
    .join("\n\n");
}
