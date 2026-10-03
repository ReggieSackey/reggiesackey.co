"use client";

import { ReactNode, useCallback, useState } from "react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import {
  AuthKitProvider,
  useAuth,
  useAccessToken,
} from "@workos-inc/authkit-nextjs/components";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error(
    "Missing NEXT_PUBLIC_CONVEX_URL. Add it to .env.local (see .env.example).",
  );
}

/**
 * Bridges WorkOS AuthKit session state to the Convex client so that
 * authenticated Convex queries/mutations send the WorkOS access token,
 * which the backend verifies via convex/auth.config.ts.
 *
 * Public pages stay usable while signed out: fetchAccessToken simply
 * returns null and Convex calls run unauthenticated.
 */
function useAuthForConvex() {
  const { user, loading: isLoading } = useAuth();
  const { getAccessToken, refresh } = useAccessToken();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken?: boolean } = {}): Promise<string | null> => {
      if (!user) {
        return null;
      }
      try {
        if (forceRefreshToken) {
          return (await refresh()) ?? null;
        }
        return (await getAccessToken()) ?? null;
      } catch {
        return null;
      }
    },
    [user, refresh, getAccessToken],
  );

  return { isLoading, isAuthenticated: !!user, fetchAccessToken };
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [convex] = useState(
    () => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!),
  );

  return (
    <AuthKitProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useAuthForConvex}>
        {children}
      </ConvexProviderWithAuth>
    </AuthKitProvider>
  );
}
