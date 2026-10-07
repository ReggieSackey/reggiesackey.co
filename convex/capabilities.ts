import { internalMutation, mutation, query, env } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import schema, { capabilityFields, evidenceRef } from "./schema";
import { requireAdmin } from "./admin";
import { requireAnalysisServer } from "./serverAuth";
import {
  publishedSources,
  corpusVersion,
  fingerprint,
  validateRefs,
  sourceKey,
  sourceValidator,
} from "./evidence";
import { CANONICAL_CAPABILITIES } from "./canonicalCapabilities";
import type { Doc, Id } from "./_generated/dataModel";

const proposal = v.object({
  ...capabilityFields,
  evidence: v.array(evidenceRef),
});
function validateProposal(p: {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  evidence: unknown[];
}) {
  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) ||
    p.slug.length > 80 ||
    !p.title.trim() ||
    p.title.length > 120 ||
    !p.description.trim() ||
    p.description.length > 800 ||
    p.tags.length > 8 ||
    p.tags.some((t) => t.length > 50)
  )
    throw new Error("Invalid capability");
}
async function registry(ctx: Pick<QueryCtx, "db">) {
  const caps = await ctx.db
    .query("capabilities")
    .withIndex("by_active", (q) => q.eq("active", true))
    .take(61);
  if (caps.length > 60) throw new Error("Registry capacity exceeded");
  return await Promise.all(
    caps.map(async (c) => ({
      id: c._id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      tags: c.tags,
      evidence: (
        await ctx.db
          .query("capabilityEvidence")
          .withIndex("by_capability", (q) => q.eq("capabilityId", c._id))
          .take(31)
      )
        .map((e) => ({
          sourceType: e.sourceType,
          sourceId: e.sourceId,
          sectionId: e.sectionId,
          note: e.note,
        }))
        .sort((a, b) => sourceKey(a).localeCompare(sourceKey(b))),
    })),
  );
}
const registryValidator = v.array(
  v.object({
    id: v.id("capabilities"),
    ...capabilityFields,
    evidence: v.array(evidenceRef),
  }),
);
async function snapshot(ctx: Pick<QueryCtx, "db">) {
  const sources = await publishedSources(ctx);
  const capabilities = (await registry(ctx)).sort((a, b) =>
    a.slug.localeCompare(b.slug),
  );
  // Missing/unpublished links are excluded from retrieval; fingerprint still changes.
  const version = fingerprint({ sources, capabilities });
  return { sources, capabilities, version };
}
export const getSnapshot = query({
  args: { secret: v.string() },
  returns: v.object({ version: v.string(), capabilities: registryValidator }),
  handler: async (ctx, { secret }) => {
    requireAnalysisServer(secret);
    const s = await snapshot(ctx);
    return { version: s.version, capabilities: s.capabilities };
  },
});
export const retrieve = query({
  args: {
    secret: v.string(),
    version: v.string(),
    capabilityIds: v.array(v.id("capabilities")),
  },
  returns: v.array(sourceValidator),
  handler: async (ctx, args) => {
    requireAnalysisServer(args.secret);
    if (args.capabilityIds.length > 12)
      throw new Error("Too many capabilities");
    const s = await snapshot(ctx);
    if (s.version !== args.version)
      throw new Error("Evidence changed; start a new analysis");
    const chosen = new Set(args.capabilityIds);
    const caps = s.capabilities.filter((c) => chosen.has(c.id));
    if (caps.length !== chosen.size) throw new Error("Unknown capability");
    const keys = new Set(caps.flatMap((c) => c.evidence.map(sourceKey)));
    // Small explicit profile context preserves chronology and limitations even if matcher misses them.
    const context = s.sources.filter(
      (x) =>
        x.sourceType === "profile" &&
        /chronolog|career|limitation|limited-experience/.test(x.sectionId),
    );
    const selected = [
      ...context,
      ...s.sources.filter((x) => keys.has(sourceKey(x))),
    ];
    const unique = [
      ...new Map(selected.map((x) => [sourceKey(x), x])).values(),
    ];
    if (!unique.length) throw new Error("No published evidence");
    if (
      unique.length > 30 ||
      unique.reduce((n, x) => n + x.body.length, 0) > 65_000
    )
      throw new Error(
        "Evidence package too large; narrow registry relationships",
      );
    return unique;
  },
});
export const adminCorpus = query({
  args: {},
  returns: v.object({ sources: v.array(sourceValidator), version: v.string() }),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const sources = await publishedSources(ctx);
    return { sources, version: corpusVersion(sources) };
  },
});
export const adminList = query({
  args: {},
  returns: v.object({
    proposals: v.array(schema.doc("capabilityProposals")),
    capabilities: registryValidator,
  }),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return {
      proposals: await ctx.db
        .query("capabilityProposals")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .take(100),
      capabilities: await registry(ctx),
    };
  },
});
export const saveProposals = mutation({
  args: { corpusVersion: v.string(), proposals: v.array(proposal) },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!args.proposals.length || args.proposals.length > 40)
      throw new Error("Expect 1–40 proposals");
    const sources = await publishedSources(ctx);
    if (corpusVersion(sources) !== args.corpusVersion)
      throw new Error("Corpus changed; regenerate proposals");
    const pending = await ctx.db
      .query("capabilityProposals")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(101);
    if (pending.length + args.proposals.length > 100)
      throw new Error("Review pending proposals first");
    const names = new Set(pending.map((p) => p.slug));
    for (const p of args.proposals) {
      validateProposal(p);
      validateRefs(p.evidence, sources);
      if (p.evidence.some((e) => e.note.length > 500) || names.has(p.slug))
        throw new Error("Duplicate or invalid proposal");
      names.add(p.slug);
      await ctx.db.insert("capabilityProposals", {
        ...p,
        corpusVersion: args.corpusVersion,
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});
const canonicalSyncResult = v.object({
  inserted: v.number(),
  updated: v.number(),
  unchanged: v.number(),
  deactivated: v.number(),
  activeCount: v.number(),
  activeSlugs: v.array(v.string()),
});
function sameStrings(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
async function syncCanonical(ctx: MutationCtx) {
  const sources = await publishedSources(ctx);
  const canonicalSlugs = new Set<string>();

  // Validate the complete source-controlled registry before performing writes.
  for (const capability of CANONICAL_CAPABILITIES) {
    validateProposal(capability);
    validateRefs(capability.evidence, sources);
    if (canonicalSlugs.has(capability.slug))
      throw new Error("Duplicate canonical capability slug");
    canonicalSlugs.add(capability.slug);
  }
  if (canonicalSlugs.size !== 12)
    throw new Error("Canonical registry must contain exactly 12 capabilities");

  const existingBySlug = new Map<string, Doc<"capabilities">>();
  for (const capability of CANONICAL_CAPABILITIES) {
    const matches = await ctx.db
      .query("capabilities")
      .withIndex("by_slug", (q) => q.eq("slug", capability.slug))
      .take(2);
    if (matches.length > 1)
      throw new Error(`Duplicate capability slug: ${capability.slug}`);
    if (matches[0]) existingBySlug.set(capability.slug, matches[0]);
  }

  const active = await ctx.db
    .query("capabilities")
    .withIndex("by_active", (q) => q.eq("active", true))
    .take(61);
  if (active.length > 60) throw new Error("Registry capacity exceeded");

  let inserted = 0,
    updated = 0,
    unchanged = 0,
    deactivated = 0;
  const now = Date.now();
  for (const record of active) {
    if (!canonicalSlugs.has(record.slug)) {
      await ctx.db.patch(record._id, { active: false, updatedAt: now });
      deactivated++;
    }
  }

  for (const capability of CANONICAL_CAPABILITIES) {
    const { evidence, ...fields } = capability;
    const existing = existingBySlug.get(capability.slug);
    let id: Id<"capabilities">;
    if (!existing) {
      id = await ctx.db.insert("capabilities", {
        ...fields,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      inserted++;
    } else {
      id = existing._id;
      const currentEvidence = await ctx.db
        .query("capabilityEvidence")
        .withIndex("by_capability", (q) => q.eq("capabilityId", id))
        .take(31);
      const currentRefs = currentEvidence
        .map(({ sourceType, sourceId, sectionId, note }) => ({
          sourceType,
          sourceId,
          sectionId,
          note,
        }))
        .sort((a, b) => sourceKey(a).localeCompare(sourceKey(b)));
      const canonicalRefs = [...evidence].sort((a, b) =>
        sourceKey(a).localeCompare(sourceKey(b)),
      );
      const fieldsChanged =
        existing.title !== fields.title ||
        existing.description !== fields.description ||
        !sameStrings(existing.tags, fields.tags) ||
        !existing.active;
      const evidenceChanged =
        JSON.stringify(currentRefs) !== JSON.stringify(canonicalRefs);
      if (!fieldsChanged && !evidenceChanged) {
        unchanged++;
        continue;
      }
      if (fieldsChanged)
        await ctx.db.patch(id, { ...fields, active: true, updatedAt: now });
      if (evidenceChanged) {
        for (const ref of currentEvidence) await ctx.db.delete(ref._id);
        for (const ref of evidence)
          await ctx.db.insert("capabilityEvidence", {
            ...ref,
            capabilityId: id,
          });
      }
      updated++;
      continue;
    }
    for (const ref of evidence)
      await ctx.db.insert("capabilityEvidence", { ...ref, capabilityId: id });
  }

  return {
    inserted,
    updated,
    unchanged,
    deactivated,
    activeCount: CANONICAL_CAPABILITIES.length,
    activeSlugs: CANONICAL_CAPABILITIES.map(({ slug }) => slug).sort(),
  };
}
export const syncCanonicalRegistry = mutation({
  args: {},
  returns: canonicalSyncResult,
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await syncCanonical(ctx);
  },
});
export const syncCanonicalRegistryDev = internalMutation({
  args: {},
  returns: canonicalSyncResult,
  handler: async (ctx) => {
    if (env.ALLOW_DEV_SEED !== "1")
      throw new Error("Set ALLOW_DEV_SEED=1 to synchronize development data");
    return await syncCanonical(ctx);
  },
});
export const review = mutation({
  args: {
    id: v.id("capabilityProposals"),
    decision: v.union(v.literal("approve"), v.literal("reject")),
    edited: proposal,
    mergeInto: v.optional(v.id("capabilities")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const p = await ctx.db.get(args.id);
    if (!p || p.status !== "pending")
      throw new Error("Proposal is not pending");
    if (args.decision === "reject") {
      await ctx.db.patch(p._id, { status: "rejected", updatedAt: Date.now() });
      return null;
    }
    const sources = await publishedSources(ctx);
    if (corpusVersion(sources) !== p.corpusVersion)
      throw new Error("Corpus changed; regenerate before approval");
    validateProposal(args.edited);
    validateRefs(args.edited.evidence, sources);
    if (args.edited.evidence.some((e) => e.note.length > 500))
      throw new Error("Evidence note too long");
    const { evidence, ...fields } = args.edited;
    const duplicate = await ctx.db
      .query("capabilities")
      .withIndex("by_slug", (q) => q.eq("slug", fields.slug))
      .unique();
    if (duplicate && duplicate._id !== args.mergeInto)
      throw new Error("Slug already exists; merge explicitly");
    let id = args.mergeInto;
    if (id) {
      if (!(await ctx.db.get(id))) throw new Error("Merge target missing");
      const old = await ctx.db
        .query("capabilityEvidence")
        .withIndex("by_capability", (q) => q.eq("capabilityId", id!))
        .take(31);
      // Edited evidence is the explicit replacement set; UI preloads union on merge.
      for (const e of old) await ctx.db.delete(e._id);
      await ctx.db.patch(id, {
        ...fields,
        active: true,
        updatedAt: Date.now(),
      });
    } else {
      const active = await ctx.db
        .query("capabilities")
        .withIndex("by_active", (q) => q.eq("active", true))
        .take(60);
      if (active.length >= 60)
        throw new Error("Compact registry limit reached");
      id = await ctx.db.insert("capabilities", {
        ...fields,
        active: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    for (const e of evidence)
      await ctx.db.insert("capabilityEvidence", { ...e, capabilityId: id });
    await ctx.db.patch(p._id, {
      ...args.edited,
      status: "approved",
      updatedAt: Date.now(),
    });
    return null;
  },
});
export const deactivate = mutation({
  args: { id: v.id("capabilities") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { active: false, updatedAt: Date.now() });
    return null;
  },
});
