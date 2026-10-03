import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { env } from "./_generated/server";

/**
 * Test-only: insert a synthetic COMPLETED analysis so the results page
 * can be exercised without spending model tokens. Gated by ALLOW_DEV_SEED
 * like the content seed. Not part of the product surface.
 */
export const insertTestAnalysis = internalMutation({
  args: { rawJobDescription: v.string() },
  handler: async (ctx, args) => {
    if (env.ALLOW_DEV_SEED !== "1") {
      throw new Error('Set ALLOW_DEV_SEED=1 to use test helpers.');
    }
    return await ctx.db.insert("jobAnalyses", {
      inputHash: "test-" + Date.now(),
      jobTitle: "Senior Product Engineer",
      company: "Acme",
      overallFit: "strong",
      overallNarrative:
        "Reg is a product-minded engineer with a strong record of taking ambiguous problems from idea to production. His experience spans marketplace systems, APIs and integrations, production data workflows, full-stack application development, and AI-native product engineering. The main difference to weigh: deep cloud infrastructure work is not his primary background.",
      themes: [
        {
          id: "theme_1",
          title: "AI-native product engineering",
          fit: "strong",
          narrative:
            "The CModel strategic assistant shows direct experience building a production AI feature with tool calling and structured outputs.",
          requirementIds: ["req_1"],
          citations: [
            {
              sourceType: "caseStudy",
              sourceId: "cmodel-strategic-assistant",
              sectionId: "strategic-assistant",
              quote: "I built the assistant as a standalone Next.js application",
            },
          ],
        },
        {
          id: "theme_2",
          title: "Infrastructure depth",
          fit: "gap",
          narrative:
            "The technical profile explicitly lists large-scale distributed infrastructure as a limited area.",
          requirementIds: ["req_2"],
          citations: [
            {
              sourceType: "profile",
              sourceId: "technical",
              sectionId: "limited-experience",
            },
          ],
        },
      ],
      materialGaps: [],
      interviewQuestions: [
        "Ask about the structured-output failure handling at CModel.",
      ],
      rawJobDescription: args.rawJobDescription,
      status: "complete",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Test-only: delete ALL jobAnalyses rows. Exists for one-off dev
 * maintenance — e.g. clearing old-format rows after a breaking schema
 * change (the schema push refuses to deploy while old-shape documents
 * exist). Gated by ALLOW_DEV_SEED. Not part of the product surface.
 */
export const purgeAllAnalyses = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (env.ALLOW_DEV_SEED !== "1") {
      throw new Error('Set ALLOW_DEV_SEED=1 to use test helpers.');
    }
    const all = await ctx.db.query("jobAnalyses").collect();
    for (const doc of all) {
      await ctx.db.delete(doc._id);
    }
    return all.length;
  },
});
