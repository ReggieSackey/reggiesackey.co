import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";

/**
 * Public profile-document queries return PUBLISHED documents only.
 * Document `type` (career, technical, …) is an open string — new types
 * can be added without schema changes.
 */

export const getPublishedProfileDocuments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("profileDocuments")
      .withIndex("by_published", (q) => q.eq("published", true))
      .take(20);
  },
});

export const getPublishedProfileDocumentByType = query({
  args: { type: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("profileDocuments")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .filter((q) => q.eq(q.field("published"), true))
      .first();
    return doc ?? null;
  },
});

export const getProfileDocumentWithSections = query({
  args: { type: v.string() },
  handler: async (ctx, args) => {
    const document = await ctx.db
      .query("profileDocuments")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .filter((q) => q.eq(q.field("published"), true))
      .first();
    if (!document) {
      return null;
    }
    const sections = await ctx.db
      .query("profileSections")
      .withIndex("by_profileDocumentId_and_order", (q) =>
        q.eq("profileDocumentId", document._id),
      )
      .order("asc")
      .take(100);
    return { document, sections };
  },
});

// --- Admin queries -------------------------------------------------

/** Batch query for the public source corpus: published docs + sections. */
export const getProfileDocumentsWithSections = query({
  args: {},
  handler: async (ctx) => {
    const documents = await ctx.db
      .query("profileDocuments")
      .withIndex("by_published", (q) => q.eq("published", true))
      .take(20);
    return await Promise.all(
      documents.map(async (document) => ({
        document,
        sections: await ctx.db
          .query("profileSections")
          .withIndex("by_profileDocumentId_and_order", (q) =>
            q.eq("profileDocumentId", document._id),
          )
          .order("asc")
          .take(100),
      })),
    );
  },
});

export const adminListProfileDocuments = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("profileDocuments").order("desc").take(100);
  },
});

export const adminGetProfileDocumentWithSections = query({
  args: { type: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const document = await ctx.db
      .query("profileDocuments")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();
    if (!document) {
      return null;
    }
    const sections = await ctx.db
      .query("profileSections")
      .withIndex("by_profileDocumentId_and_order", (q) =>
        q.eq("profileDocumentId", document._id),
      )
      .order("asc")
      .take(100);
    return { document, sections };
  },
});
