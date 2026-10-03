import { mutation, query } from "./_generated/server";
import { env } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Admin authorization + one-time bootstrap.
 *
 * - Identity is ALWAYS derived from ctx.auth.getUserIdentity() (verified
 *   WorkOS AuthKit JWT via convex/auth.config.ts). Never from args.
 * - requireAdmin() is the guard every future admin mutation calls.
 * - bootstrapFirstAdmin() is a one-time escape hatch: it only works
 *   while (a) the ADMIN_BOOTSTRAP_ENABLED env flag is "1" on the
 *   deployment, and (b) zero users with role "admin" exist.
 */

export class AdminAuthError extends Error {}

export async function getViewer(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_authId", (q) => q.eq("authId", identity.subject))
    .unique();

  return user;
}

export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const user = await getViewer(ctx);
  if (user === null) {
    throw new AdminAuthError("Authentication required.");
  }
  if (user.role !== "admin") {
    throw new AdminAuthError("Admin role required.");
  }
  return user;
}

/** Count of admin users — the bootstrap lock. */
async function adminCount(ctx: QueryCtx | MutationCtx): Promise<number> {
  // users is small; take(2) bounds the read.
  const admins = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("role"), "admin"))
    .take(2);
  return admins.length;
}

/**
 * One-time bootstrap: promote the authenticated caller to admin.
 *
 * Requires ALL of:
 *  1. ADMIN_BOOTSTRAP_ENABLED === "1" env var on the deployment
 *  2. Zero existing users with role "admin"
 *  3. Caller is authenticated (WorkOS identity)
 *
 * Identity (authId/email) is derived from the verified token — the
 * client never supplies it. Once any admin exists, or the flag is
 * removed, this always throws.
 */
export const bootstrapFirstAdmin = mutation({
  args: {},
  handler: async (ctx): Promise<{ email: string }> => {
    if (env.ADMIN_BOOTSTRAP_ENABLED !== "1") {
      throw new AdminAuthError(
        "Bootstrap is disabled. Set ADMIN_BOOTSTRAP_ENABLED=1 on the " +
          "deployment only while bootstrapping, then remove it.",
      );
    }

    if ((await adminCount(ctx)) > 0) {
      throw new AdminAuthError(
        "An admin already exists. Bootstrap is permanently closed.",
      );
    }

    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new AdminAuthError(
        "You must be signed in with WorkOS to bootstrap.",
      );
    }

    const email = identity.email ?? `${identity.subject}@no-email`;
    await upsertUserByAuthId(ctx, {
      authId: identity.subject,
      email,
      role: "admin",
    });

    return { email };
  },
});

/** Admin query: current admin count and bootstrap status. */
export const getAdminStatus = query({
  args: {},
  handler: async (ctx) => {
    const count = await adminCount(ctx);
    return {
      adminCount: count,
      bootstrapEnabled: env.ADMIN_BOOTSTRAP_ENABLED === "1",
    };
  },
});

/** Upsert helper used by bootstrap + future admin tooling. */
export async function upsertUserByAuthId(
  ctx: MutationCtx,
  args: { authId: string; email: string; role: "admin" | "viewer" },
): Promise<Id<"users">> {
  const found = await ctx.db
    .query("users")
    .withIndex("by_authId", (q) => q.eq("authId", args.authId))
    .unique();
  if (found) {
    if (found.email !== args.email || found.role !== args.role) {
      await ctx.db.patch(found._id, {
        email: args.email,
        role: args.role,
      });
    }
    return found._id;
  }
  return await ctx.db.insert("users", {
    authId: args.authId,
    email: args.email,
    role: args.role,
  });
}
