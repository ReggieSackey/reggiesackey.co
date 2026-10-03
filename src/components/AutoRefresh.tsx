"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Minimal auto-refresh for the processing state: polls router.refresh()
 * every few seconds so the page re-fetches the analysis from Convex
 * and flips to the result when it completes. No spinners, no theater.
 */
export function AutoRefresh({ seconds = 5 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(interval);
  }, [router, seconds]);

  return null;
}
