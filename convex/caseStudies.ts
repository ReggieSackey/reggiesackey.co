import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";

/**
 * Public case-study queries return PUBLISHED content only.
 * Admin queries (admin*) verify identity server-side and may include
 * unpublished content.
 */

export const getPublishedCaseStudies = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("caseStudies")
      .withIndex("by_published", (q) => q.eq("published", true))
      .order("desc")
      .take(50);
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
