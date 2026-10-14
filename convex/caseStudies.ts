import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";

/**
 * Public case-study queries return PUBLISHED content only.
 * Admin queries (admin*) verify identity server-side and may include
 * unpublished content.
 */

const CASE_STUDY_DISPLAY_ORDER = [
  "cmodel-strategic-assistant",
  "musicbreakr",
  "reaccord",
  "audio-plugin-development",
  "nation-rts",
  "reggiesackey-co",
] as const;

const CASE_STUDY_DISPLAY_RANK = new Map(
  CASE_STUDY_DISPLAY_ORDER.map((slug, index) => [slug, index]),
);

export const getPublishedCaseStudies = query({
  args: {},
  handler: async (ctx) => {
    const studies = await ctx.db
      .query("caseStudies")
      .withIndex("by_published", (q) => q.eq("published", true))
      .take(50);

    return studies.sort((a, b) => {
      const rankA = CASE_STUDY_DISPLAY_RANK.get(a.slug) ?? CASE_STUDY_DISPLAY_ORDER.length;
      const rankB = CASE_STUDY_DISPLAY_RANK.get(b.slug) ?? CASE_STUDY_DISPLAY_ORDER.length;
      return rankA - rankB || b.createdAt - a.createdAt;
    });
  },
});

export const getCaseStudyBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const caseStudy = await ctx.db
      .query("caseStudies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    return caseStudy?.published ? caseStudy : null;
  },
});

export const getCaseStudyWithSections = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const caseStudy = await ctx.db
      .query("caseStudies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!caseStudy?.published) {
      return null;
    }
    const sections = await ctx.db
      .query("caseStudySections")
      .withIndex("by_caseStudyId_and_order", (q) =>
        q.eq("caseStudyId", caseStudy._id),
      )
      .order("asc")
      .take(100);
    return { caseStudy, sections };
  },
});

// --- Admin queries -------------------------------------------------

/** Batch query for the public source corpus: published studies + sections. */
export const getCaseStudiesWithSections = query({
  args: {},
  handler: async (ctx) => {
    const caseStudies = await ctx.db
      .query("caseStudies")
      .withIndex("by_published", (q) => q.eq("published", true))
      .take(50);
    return await Promise.all(
      caseStudies.map(async (caseStudy) => ({
        caseStudy,
        sections: await ctx.db
          .query("caseStudySections")
          .withIndex("by_caseStudyId_and_order", (q) =>
            q.eq("caseStudyId", caseStudy._id),
          )
          .order("asc")
          .take(100),
      })),
    );
  },
});

export const adminListCaseStudies = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("caseStudies").order("desc").take(100);
  },
});

export const adminGetCaseStudyWithSections = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const caseStudy = await ctx.db
      .query("caseStudies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!caseStudy) {
      return null;
    }
    const sections = await ctx.db
      .query("caseStudySections")
      .withIndex("by_caseStudyId_and_order", (q) =>
        q.eq("caseStudyId", caseStudy._id),
      )
      .order("asc")
      .take(100);
    return { caseStudy, sections };
  },
});
