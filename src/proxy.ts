import { authkit, handleAuthkitProxy } from "@workos-inc/authkit-nextjs";
import type { NextRequest } from "next/server";

/**
 * WorkOS AuthKit proxy (Next.js 16 renamed middleware → proxy).
 *
 * Protects exactly `/admin` and everything underneath it. All public
 * routes stay public; any future route is public by default unless it
 * is added to PROTECTED_PREFIXES.
 *
 * This is the route/UX layer only. Admin Convex functions independently
 * verify identity server-side (see convex/adminAuth.ts).
 */
const PROTECTED_PREFIXES = ["/admin"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { session, headers, authorizationUrl } = await authkit(request);
  if (!session.user && isProtected(request.nextUrl.pathname)) {
    return handleAuthkitProxy(request, headers, {
      redirect: authorizationUrl,
    });
  }
  return handleAuthkitProxy(request, headers);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
