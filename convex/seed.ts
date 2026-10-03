import { internalMutation } from "./_generated/server";
import { env } from "./_generated/server";
import { CASE_STUDIES, PROFILE_DOCUMENTS } from "./seedData";

/**
 * Development-only content seed: the CModel case study and the
 * Technical Profile document.
 *
 * Gate: run `npx convex env set ALLOW_DEV_SEED 1` on the dev deployment
 * first. Never set this on production.
 *
 * Run with:
 *   npx convex run seed:seedDevContent
 *
 * The seed upserts by slug/type. Section handling: for the seeded case
 * study (by slug) and the seeded profile document (by type), existing
 * sections are replaced wholesale — this makes the seed idempotent AND
 * prunes obsolete seeded sections so no duplicate/contradictory source
 * material survives an update. Unrelated case studies / profile docs
 * (anything not named here) are never touched.
 *
 * To remove the content, delete rows by slug in the dashboard; nothing
 * else depends on this file.
 */

export const seedDevContent = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (env.ALLOW_DEV_SEED !== "1") {
      throw new Error(
        'ALLOW_DEV_SEED is not "1". Dev seed is development-only: run ' +
          "`npx convex env set ALLOW_DEV_SEED 1` on the dev deployment and " +
          "keep it off production.",
      );
    }

    const now = Date.now();
    const results: { caseStudies: number; profileDocuments: number } = {
      caseStudies: 0,
      profileDocuments: 0,
    };

    for (const cs of CASE_STUDIES) {
      // Upsert the case study by slug.
      let caseStudyId = (
        await ctx.db
          .query("caseStudies")
          .withIndex("by_slug", (q) => q.eq("slug", cs.slug))
          .unique()
      )?._id;

      if (caseStudyId === undefined) {
        caseStudyId = await ctx.db.insert("caseStudies", {
          slug: cs.slug,
          title: cs.title,
          companyOrProject: cs.companyOrProject,
          summary: cs.summary,
          published: true,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        await ctx.db.patch(caseStudyId, {
          title: cs.title,
          companyOrProject: cs.companyOrProject,
          summary: cs.summary,
          published: true,
          updatedAt: now,
        });
      }

      // Replace sections of this seeded case study: delete existing
      // (prunes obsolete seeded sections), insert canonical sections.
      // Scoped to this case study only — unrelated data is untouched.
      const existingSections = await ctx.db
        .query("caseStudySections")
        .withIndex("by_caseStudyId_and_order", (q) =>
          q.eq("caseStudyId", caseStudyId),
        )
        .take(200);
      for (const s of existingSections) {
        await ctx.db.delete(s._id);
      }
      for (const section of cs.sections) {
        await ctx.db.insert("caseStudySections", {
          caseStudyId,
          slug: section.slug,
          heading: section.heading,
          body: section.body,
          order: section.order,
          ...(section.summary !== undefined ? { summary: section.summary } : {}),
          ...(section.tags !== undefined ? { tags: section.tags } : {}),
        });
      }
      results.caseStudies += 1;
    }

    for (const pd of PROFILE_DOCUMENTS) {
      // Upsert the profile document by type.
      let profileDocumentId = (
        await ctx.db
          .query("profileDocuments")
          .withIndex("by_type", (q) => q.eq("type", pd.type))
          .first()
      )?._id;

      if (profileDocumentId === undefined) {
        profileDocumentId = await ctx.db.insert("profileDocuments", {
          type: pd.type,
          title: pd.title,
          published: true,
        });
      } else {
        await ctx.db.patch(profileDocumentId, { title: pd.title, published: true });
      }

      // Replace sections of this seeded profile document.
      const existingSections = await ctx.db
        .query("profileSections")
        .withIndex("by_profileDocumentId_and_order", (q) =>
          q.eq("profileDocumentId", profileDocumentId),
        )
        .take(200);
      for (const s of existingSections) {
        await ctx.db.delete(s._id);
      }
      for (const section of pd.sections) {
        await ctx.db.insert("profileSections", {
          profileDocumentId,
          slug: section.slug,
          heading: section.heading,
          body: section.body,
          order: section.order,
        });
      }
      results.profileDocuments += 1;
    }

    return results;
  },
});
