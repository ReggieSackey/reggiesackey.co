import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { AdminBootstrap } from "./AdminBootstrap";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminHomePage() {
  const { user } = await withAuth();
  const status = await fetchQuery(api.admin.getAdminStatus);
  const needsBootstrap = status.adminCount === 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Admin
      </h1>
      <div className="mt-6 border-t border-neutral-200 pt-6">
        <p className="max-w-xl text-sm leading-6 text-neutral-600">
          Signed in as {user?.email}. Case study and application management
          live under the links above.
        </p>
      </div>

      {needsBootstrap ? (
        <AdminBootstrap />
      ) : (
        <p className="mt-6 text-[13px] text-neutral-400">
          {status.adminCount} admin{status.adminCount === 1 ? "" : "s"} on this
          deployment.
        </p>
      )}
    </div>
  );
}
