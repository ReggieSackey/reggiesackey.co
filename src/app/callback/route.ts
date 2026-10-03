import { handleAuth } from "@workos-inc/authkit-nextjs";

/**
 * WorkOS AuthKit OAuth callback.
 * NEXT_PUBLIC_WORKOS_REDIRECT_URI must point here (e.g.
 * http://localhost:3000/callback) and must match the WorkOS Dashboard.
 */
export const GET = handleAuth();
