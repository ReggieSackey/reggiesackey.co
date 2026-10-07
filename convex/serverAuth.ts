import { env } from "./_generated/server";

/** Server-to-server credential, never a browser token or a Convex deploy key. */
export function requireAnalysisServer(secret: string) {
  const expected = env.ANALYSIS_SERVER_SECRET;
  if (!expected || expected.length < 32 || secret.length !== expected.length)
    throw new Error("Unauthorized");
  let difference = 0;
  for (let i = 0; i < expected.length; i++)
    difference |= expected.charCodeAt(i) ^ secret.charCodeAt(i);
  if (difference !== 0) throw new Error("Unauthorized");
}
