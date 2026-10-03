/**
 * Server-side JWT validation for WorkOS AuthKit access tokens.
 *
 * Requires the WORKOS_CLIENT_ID environment variable to be set on the
 * Convex deployment (Dashboard → Settings → Environment Variables, or
 * `npx convex env set WORKOS_CLIENT_ID ...`).
 *
 * After changing this file you must run `npx convex dev` (or `deploy`)
 * to sync the config to the backend.
 */
const clientId = process.env.WORKOS_CLIENT_ID;

if (!clientId) {
  throw new Error(
    "Missing WORKOS_CLIENT_ID. Set it on the Convex deployment " +
      "(Dashboard → Settings → Environment Variables) and re-run `npx convex dev`.",
  );
}

const authConfig = {
  providers: [
    {
      type: "customJwt",
      issuer: `https://api.workos.com/`,
      algorithm: "RS256",
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
      applicationID: clientId,
    },
    {
      type: "customJwt",
      issuer: `https://api.workos.com/user_management/${clientId}`,
      algorithm: "RS256",
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
    },
  ],
};

export default authConfig;
