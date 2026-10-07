import { mutation, query } from "./_generated/server";
import { requireAnalysisServer } from "./serverAuth";
import { v } from "convex/values";

/**
 * jobAnalyses lifecycle. Create → processing; mark complete with the
 * validated result; or mark failed. Public reads are completed-only.
 *
 * Result shape: theme-based advocacy analysis — an overall fit +
 * narrative, synthesized themes (each covering extracted requirement
 * ids), optional material gaps, and at most 3 interview questions.
 *
 * Writes require the Next.js service credential. New raw JDs are not retained.
 * Long-term retention/purge remains an operational decision.
 */

const citationValidator = v.object({
  sourceType: v.union(v.literal("caseStudy"), v.literal("profile")),
  sourceId: v.string(),
  sectionId: v.string(),
  quote: v.optional(v.string()),
});

const themeValidator = v.object({
  id: v.string(),
  title: v.string(),
  fit: v.union(v.literal("strong"), v.literal("relevant"), v.literal("gap")),
  narrative: v.string(),
  requirementIds: v.array(v.string()),
  citations: v.array(citationValidator),
});

export const markAnalysisComplete = mutation({
  returns: v.null(),
  args: {
    secret: v.string(),
    id: v.id("jobAnalyses"),
    jobTitle: v.optional(v.string()),
    company: v.optional(v.string()),
    overallFit: v.optional(
      v.union(v.literal("strong"), v.literal("relevant"), v.literal("gap")),
    ),
    overallNarrative: v.optional(v.string()),
    themes: v.optional(v.array(themeValidator)),
    materialGaps: v.optional(
      v.array(
        v.object({
          title: v.string(),
          narrative: v.string(),
          citations: v.array(citationValidator),
        }),
      ),
    ),
    interviewQuestions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    requireAnalysisServer(args.secret);
    const { id, secret: _secret, ...rest } = args;
    void _secret;
    const current = await ctx.db.get(id);
    if (
      current?.status !== "processing" ||
      current.createdAt < Date.now() - 300_000
    )
      throw new Error("Analysis lease expired");
    await ctx.db.patch(id, {
      ...rest,
      status: "complete",
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const markAnalysisFailed = mutation({
  returns: v.null(),
  args: {
    secret: v.string(),
    id: v.id("jobAnalyses"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    requireAnalysisServer(args.secret);
    const current = await ctx.db.get(args.id);
    if (current?.status !== "processing") return null;
    await ctx.db.patch(args.id, {
      status: "failed",
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Public read: completed analyses only, and only the fields the results
 * page needs — rawJobDescription/errorMessage are withheld.
 */
export const getCompletedAnalysis = query({
  args: { id: v.id("jobAnalyses") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.status !== "complete") {
      return null;
    }
    return {
      _id: doc._id,
      jobTitle: doc.jobTitle ?? null,
      company: doc.company ?? null,
      overallFit: doc.overallFit ?? null,
      overallNarrative: doc.overallNarrative ?? null,
      themes: doc.themes ?? [],
      materialGaps: doc.materialGaps ?? [],
      interviewQuestions: doc.interviewQuestions ?? [],
      createdAt: doc.createdAt,
    };
  },
});

/** Lightweight status probe used by the processing state UI. */
export const getAnalysisStatus = query({
  args: { id: v.id("jobAnalyses") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) return null;
    return { status: doc.status };
  },
});
