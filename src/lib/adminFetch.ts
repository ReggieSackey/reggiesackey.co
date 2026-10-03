import "server-only";
import { fetchQuery, type NextjsOptions } from "convex/nextjs";
import { withAuth } from "@workos-inc/authkit-nextjs";
import type { FunctionArgs, FunctionReference } from "convex/server";

/**
 * fetchQuery with the caller's WorkOS access token attached, so admin
 * Convex queries (requireAdmin) authenticate as the signed-in admin.
 * For use in Server Components under /admin.
 */
export async function adminFetchQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query>,
  options?: NextjsOptions,
): Promise<Awaited<ReturnType<typeof fetchQuery<Query>>>> {
  const { accessToken } = await withAuth({ ensureSignedIn: true });
  const mergedOptions: NextjsOptions = { ...options, token: accessToken };
  return await fetchQuery(query, args, mergedOptions);
}
