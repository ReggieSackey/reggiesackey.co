import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Resolve validated citation references into canonical display metadata.
 *
 * The model emits IDs only (sourceType + sourceId + sectionId); display
 * titles and headings come exclusively from published canonical content,
 * never from model output. Reads are deduplicated per source.
 */
export const getCitationSources = query({
  args: {
    citations: v.array(
      v.object({
        sourceType: v.string(),
        sourceId: v.string(),
        sectionId: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    type SourceMeta = { title: string; sections: Map<string, string> };
    const caseStudyCache = new Map<string, SourceMeta | null>();
    const profileCache = new Map<string, SourceMeta | null>();

    const rows: Array<{
      sourceType: string;
      sourceId: string;
      sectionId: string;
      sourceTitle: string;
      sectionHeading: string | null;
    }> = [];

    for (const ref of args.citations.slice(0, 60)) {
      if (ref.sourceType === "caseStudy") {
        if (!caseStudyCache.has(ref.sourceId)) {
          const caseStudy = await ctx.db
            .query("caseStudies")
            .withIndex("by_slug", (q) => q.eq("slug", ref.sourceId))
            .unique();
          if (!caseStudy?.published) {
            caseStudyCache.set(ref.sourceId, null);
          } else {
            const sections = await ctx.db
              .query("caseStudySections")
              .withIndex("by_caseStudyId_and_order", (q) =>
                q.eq("caseStudyId", caseStudy._id),
              )
              .order("asc")
              .take(100);
            caseStudyCache.set(ref.sourceId, {
              title: caseStudy.title,
              sections: new Map(sections.map((s) => [s.slug, s.heading])),
            });
          }
        }
        const meta = caseStudyCache.get(ref.sourceId) ?? null;
        if (!meta) continue;
        rows.push({
          sourceType: ref.sourceType,
          sourceId: ref.sourceId,
          sectionId: ref.sectionId,
          sourceTitle: meta.title,
          sectionHeading: meta.sections.get(ref.sectionId) ?? null,
        });
      } else if (ref.sourceType === "profile") {
        if (!profileCache.has(ref.sourceId)) {
          const document = await ctx.db
            .query("profileDocuments")
            .withIndex("by_type", (q) => q.eq("type", ref.sourceId))
            .filter((q) => q.eq(q.field("published"), true))
            .first();
          if (!document) {
            profileCache.set(ref.sourceId, null);
          } else {
            const sections = await ctx.db
              .query("profileSections")
              .withIndex("by_profileDocumentId_and_order", (q) =>
                q.eq("profileDocumentId", document._id),
              )
              .order("asc")
              .take(100);
            profileCache.set(ref.sourceId, {
              title: document.title,
              sections: new Map(sections.map((s) => [s.slug, s.heading])),
            });
          }
        }
        const meta = profileCache.get(ref.sourceId) ?? null;
        if (!meta) continue;
        rows.push({
          sourceType: ref.sourceType,
          sourceId: ref.sourceId,
          sectionId: ref.sectionId,
          sourceTitle: meta.title,
          sectionHeading: meta.sections.get(ref.sectionId) ?? null,
        });
      }
    }

    return rows;
  },
});
