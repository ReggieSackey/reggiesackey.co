"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Minimal auto-refresh for the processing state: polls router.refresh()
 * every few seconds so the page re-fetches the analysis from Convex
 * and flips to the result when it completes. No spinners, no theater.
 */
export function AutoRefresh({
  seconds = 5,
  maxAttempts = 12,
}: {
  seconds?: number;
  maxAttempts?: number;
}) {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (attempts >= maxAttempts) return;
    const timeout = setTimeout(() => {
      router.refresh();
      setAttempts((current) => current + 1);
    }, seconds * 1000);
    return () => clearTimeout(timeout);
  }, [attempts, maxAttempts, router, seconds]);

  if (attempts < maxAttempts) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
      <button
        type="button"
        onClick={() => {
          setAttempts(0);
          router.refresh();
        }}
        className="inline-flex h-10 items-center rounded-sm bg-neutral-900 px-5 font-medium text-white"
      >
        Check again
      </button>
      <Link
        href="/"
        className="font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
      >
        Return to the analyzer
      </Link>
    </div>
  );
}
