import type { QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

export const sourceValidator = v.object({
  sourceType: v.union(v.literal("caseStudy"), v.literal("profile")),
  sourceId: v.string(),
  sourceTitle: v.string(),
  sectionId: v.string(),
  sectionHeading: v.string(),
  body: v.string(),
});
export type Source = {
  sourceType: "caseStudy" | "profile";
  sourceId: string;
  sourceTitle: string;
  sectionId: string;
  sectionHeading: string;
  body: string;
};
export function sourceKey(
  s: Pick<Source, "sourceType" | "sourceId" | "sectionId">,
) {
  return JSON.stringify([s.sourceType, s.sourceId, s.sectionId]);
}
export function fingerprint(value: unknown): string {
  return bytesToHex(sha256(new TextEncoder().encode(JSON.stringify(value))));
}

/** A single consistent snapshot. Fail on capacity overflow; never silently omit evidence. */
export async function publishedSources(
  ctx: Pick<QueryCtx, "db">,
): Promise<Source[]> {
  const studies = await ctx.db
    .query("caseStudies")
    .withIndex("by_published", (q) => q.eq("published", true))
    .take(51);
  const profiles = await ctx.db
    .query("profileDocuments")
    .withIndex("by_published", (q) => q.eq("published", true))
    .take(21);
  if (studies.length > 50 || profiles.length > 20)
    throw new Error("Corpus capacity exceeded");
  const result: Source[] = [];
  for (const study of studies) {
    const sections = await ctx.db
      .query("caseStudySections")
      .withIndex("by_caseStudyId_and_order", (q) =>
        q.eq("caseStudyId", study._id),
      )
      .take(101);
    if (sections.length > 100) throw new Error("Section capacity exceeded");
    for (const s of sections)
      result.push({
        sourceType: "caseStudy",
        sourceId: study.slug,
        sourceTitle: study.title,
        sectionId: s.slug,
        sectionHeading: s.heading,
        body: s.body,
      });
  }
  for (const doc of profiles) {
    const sections = await ctx.db
      .query("profileSections")
      .withIndex("by_profileDocumentId_and_order", (q) =>
        q.eq("profileDocumentId", doc._id),
      )
      .take(101);
    if (sections.length > 100) throw new Error("Section capacity exceeded");
    for (const s of sections)
      result.push({
        sourceType: "profile",
        sourceId: doc.type,
        sourceTitle: doc.title,
        sectionId: s.slug,
        sectionHeading: s.heading,
        body: s.body,
      });
  }
  result.sort((a, b) => sourceKey(a).localeCompare(sourceKey(b)));
  if (JSON.stringify(result).length > 350_000)
    throw new Error("Corpus capacity exceeded");
  return result;
}
export function corpusVersion(sources: Source[]) {
  return fingerprint(sources);
}
export function validateRefs(
  refs: {
    sourceType: "caseStudy" | "profile";
    sourceId: string;
    sectionId: string;
  }[],
  sources: Source[],
) {
  const keys = new Set(sources.map(sourceKey));
  if (
    !refs.length ||
    refs.length > 30 ||
    refs.some((r) => !keys.has(sourceKey(r)))
  )
    throw new Error("Invalid published evidence reference");
  if (new Set(refs.map(sourceKey)).size !== refs.length)
    throw new Error("Duplicate evidence reference");
}
