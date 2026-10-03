import type { Metadata } from "next";
import { api } from "@convex/_generated/api";
import { adminFetchQuery } from "@/lib/adminFetch";

export const metadata: Metadata = {
  title: "Admin · Profile documents",
};

export default async function AdminProfilePage() {
  const documents = await adminFetchQuery(
    api.profileDocuments.adminListProfileDocuments,
    {},
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Profile documents
      </h1>
      {documents.length === 0 ? (
        <div className="mt-6 border-t border-neutral-200 pt-6">
          <p className="max-w-xl text-sm leading-6 text-neutral-600">
            No profile documents yet. In development, the Technical Profile is
            created by the dev seed.
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200 border-t border-neutral-200">
          {documents.map((doc) => (
            <li
              key={doc._id}
              className="flex items-baseline justify-between gap-4 py-5"
            >
              <div>
                <p className="text-[15px] font-medium text-neutral-900">
                  {doc.title}
                </p>
                <p className="mt-0.5 text-[13px] text-neutral-500">
                  type: {doc.type} · /profile/{doc.type}
                </p>
              </div>
              <span
                className={
                  doc.published
                    ? "text-[12px] font-medium text-neutral-900"
                    : "text-[12px] font-medium text-neutral-400"
                }
              >
                {doc.published ? "Published" : "Draft"}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-8 text-[13px] text-neutral-400">
        Editing is not built yet — content is managed via Convex (see README).
      </p>
    </div>
  );
}
