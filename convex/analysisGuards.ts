import { mutation, query, env } from "./_generated/server";
import { v } from "convex/values";
import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";
import { requireAnalysisServer } from "./serverAuth";

export function positiveInt(
  value: string | undefined,
  fallback: number,
  max: number,
) {
  if (value === undefined) return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > max)
    throw new Error("Invalid safety configuration");
  return n;
}
const limits = () =>
  new RateLimiter(components.rateLimiter, {
    burst: {
      kind: "token bucket",
      rate: positiveInt(env.ANALYSIS_BURST, 3, 100),
      period: MINUTE,
      capacity: positiveInt(env.ANALYSIS_BURST, 3, 100),
    },
    hourly: {
      kind: "token bucket",
      rate: positiveInt(env.ANALYSIS_HOURLY, 12, 1000),
      period: HOUR,
      capacity: positiveInt(env.ANALYSIS_HOURLY, 12, 1000),
    },
  });
export const admitRequest = mutation({
  args: { secret: v.string(), clientKey: v.string() },
  returns: v.object({ ok: v.boolean(), retryAfter: v.number() }),
  handler: async (ctx, args) => {
    requireAnalysisServer(args.secret);
    if (!/^[a-f0-9]{64}$/.test(args.clientKey))
      throw new Error("Invalid client key");
    const limiter = limits();
    const burst = await limiter.limit(ctx, "burst", { key: args.clientKey });
    if (!burst.ok) return { ok: false, retryAfter: burst.retryAfter };
    const hour = await limiter.limit(ctx, "hourly", { key: args.clientKey });
    return { ok: hour.ok, retryAfter: hour.ok ? 0 : hour.retryAfter };
  },
});
export const cached = query({
  args: { secret: v.string(), cacheKey: v.string() },
  returns: v.union(v.id("jobAnalyses"), v.null()),
  handler: async (ctx, args) => {
    requireAnalysisServer(args.secret);
    return (
      (
        await ctx.db
          .query("jobAnalyses")
          .withIndex("by_cache_status", (q) =>
            q.eq("cacheKey", args.cacheKey).eq("status", "complete"),
          )
          .order("desc")
          .first()
      )?._id ?? null
    );
  },
});
const reservation = v.object({
  status: v.union(
    v.literal("reserved"),
    v.literal("cached"),
    v.literal("processing"),
    v.literal("budget"),
    v.literal("busy"),
    v.literal("circuit"),
  ),
  id: v.optional(v.id("jobAnalyses")),
  lease: v.optional(v.id("analysisLeases")),
  retryAfter: v.number(),
});
export const reserve = mutation({
  args: {
    secret: v.string(),
    cacheKey: v.optional(v.string()),
    inputHash: v.optional(v.string()),
  },
  returns: reservation,
  handler: async (ctx, args) => {
    requireAnalysisServer(args.secret);
    const now = Date.now(),
      day = new Date(now).toISOString().slice(0, 10);
    if (args.cacheKey) {
      const complete = await ctx.db
        .query("jobAnalyses")
        .withIndex("by_cache_status", (q) =>
          q.eq("cacheKey", args.cacheKey).eq("status", "complete"),
        )
        .order("desc")
        .first();
      if (complete)
        return { status: "cached" as const, id: complete._id, retryAfter: 0 };
      const running = await ctx.db
        .query("jobAnalyses")
        .withIndex("by_cache_status", (q) =>
          q.eq("cacheKey", args.cacheKey).eq("status", "processing"),
        )
        .order("desc")
        .first();
      if (running && running.createdAt > now - 300_000)
        return {
          status: "processing" as const,
          id: running._id,
          retryAfter: 5_000,
        };
    }
    const budget = await ctx.db
      .query("analysisBudget")
      .withIndex("by_day", (q) => q.eq("day", day))
      .unique();
    if (budget && budget.circuitUntil > now)
      return {
        status: "circuit" as const,
        retryAfter: budget.circuitUntil - now,
      };
    const daily = positiveInt(env.ANALYSIS_DAILY_CALLS, 300, 100000);
    if ((budget?.reservedCalls ?? 0) + 3 > daily)
      return {
        status: "budget" as const,
        retryAfter: 86_400_000 - (now % 86_400_000),
      };
    const concurrency = positiveInt(env.ANALYSIS_CONCURRENCY, 4, 50);
    const active = await ctx.db
      .query("analysisLeases")
      .withIndex("by_expiry", (q) => q.gt("expiresAt", now))
      .take(concurrency);
    if (active.length >= concurrency)
      return { status: "busy" as const, retryAfter: 10_000 };
    const expired = await ctx.db
      .query("analysisLeases")
      .withIndex("by_expiry", (q) => q.lte("expiresAt", now))
      .take(50);
    for (const lease of expired) {
      if (lease.analysisId) {
        const analysis = await ctx.db.get(lease.analysisId);
        if (analysis?.status === "processing")
          await ctx.db.patch(analysis._id, {
            status: "failed",
            errorMessage: "lease_expired",
            updatedAt: now,
          });
      }
      await ctx.db.delete(lease._id);
    }
    if (budget)
      await ctx.db.patch(budget._id, {
        reservedCalls: budget.reservedCalls + 3,
      });
    else
      await ctx.db.insert("analysisBudget", {
        day,
        reservedCalls: 3,
        failures: 0,
        circuitUntil: 0,
      });
    const id = args.cacheKey
      ? await ctx.db.insert("jobAnalyses", {
          cacheKey: args.cacheKey,
          inputHash: args.inputHash ?? "",
          rawJobDescription: "",
          status: "processing",
          createdAt: now,
        })
      : undefined;
    const lease = await ctx.db.insert("analysisLeases", {
      analysisId: id,
      expiresAt: now + 300_000,
    });
    return { status: "reserved" as const, id, lease, retryAfter: 0 };
  },
});
export const release = mutation({
  args: {
    secret: v.string(),
    lease: v.id("analysisLeases"),
    failed: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireAnalysisServer(args.secret);
    const lease = await ctx.db.get(args.lease);
    if (!lease) return null;
    // Keep failure cleanup in the same transaction as lease release. If the
    // route's best-effort markAnalysisFailed call is interrupted, releasing
    // the lease must still make an identical request immediately retryable.
    if (args.failed && lease.analysisId) {
      const analysis = await ctx.db.get(lease.analysisId);
      if (analysis?.status === "processing")
        await ctx.db.patch(analysis._id, {
          status: "failed",
          errorMessage: "analysis_failed",
          updatedAt: Date.now(),
        });
    }
    await ctx.db.delete(lease._id);
    const day = new Date(Date.now()).toISOString().slice(0, 10);
    const budget = await ctx.db
      .query("analysisBudget")
      .withIndex("by_day", (q) => q.eq("day", day))
      .unique();
    if (budget) {
      const failures = args.failed ? budget.failures + 1 : 0;
      await ctx.db.patch(budget._id, {
        failures,
        circuitUntil:
          failures >= positiveInt(env.ANALYSIS_FAILURE_LIMIT, 5, 100)
            ? Date.now() + 300_000
            : budget.circuitUntil,
      });
    }
    return null;
  },
});
