"use client";

import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useState } from "react";

/**
 * One-time first-admin bootstrap. Visible only when the deployment's
 * ADMIN_BOOTSTRAP_ENABLED flag is "1" (checked via getAdminStatus) and
 * no admin exists yet. Identity comes from the WorkOS session — the
 * button just triggers the server-side derivation.
 */
export function AdminBootstrap() {
  const { user, loading } = useAuth();
  const bootstrap = useMutation(api.admin.bootstrapFirstAdmin);
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  if (loading) {
    return null;
  }

  if (!user) {
    return null; // Proxy already redirects anonymous visitors away.
  }

  return (
    <div className="mt-8 border-t border-neutral-200 pt-6">
      <h2 className="text-[15px] font-semibold text-neutral-900">
        First admin
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">
        {state === "done"
          ? `Bootstrap complete — ${message} is an admin. Remove ADMIN_BOOTSTRAP_ENABLED from the deployment now.`
          : "No admin exists yet. Claim the first admin role for this WorkOS account."}
      </p>
      {state === "idle" ? (
        <button
          type="button"
          onClick={async () => {
            try {
              const result = await bootstrap({});
              setMessage(result.email);
              setState("done");
            } catch (err) {
              setMessage(
                err instanceof Error ? err.message : "Bootstrap failed.",
              );
              setState("error");
            }
          }}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-sm bg-neutral-900 px-5 text-sm font-medium text-white"
        >
          Become admin
        </button>
      ) : null}
      {state === "error" ? (
        <p className="mt-3 text-sm text-neutral-600">{message}</p>
      ) : null}
    </div>
  );
}
