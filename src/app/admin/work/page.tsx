import type { Metadata } from "next";
import { api } from "@convex/_generated/api";
import { adminFetchQuery } from "@/lib/adminFetch";

export const metadata: Metadata = {
  title: "Admin · Work",
};

export default async function AdminWorkPage() {
  const caseStudies = await adminFetchQuery(
    api.caseStudies.adminListCaseStudies,
    {},
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Case studies
      </h1>
      {caseStudies.length === 0 ? (
        <div className="mt-6 border-t border-neutral-200 pt-6">
          <p className="max-w-xl text-sm leading-6 text-neutral-600">
            No case studies yet. In development, seed content with{" "}
            <code className="rounded-sm bg-neutral-100 px-1 py-0.5 text-[13px]">
              npx convex run seed:seedDevContent
            </code>
            .
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200 border-t border-neutral-200">
          {caseStudies.map((cs) => (
            <li key={cs._id} className="flex items-baseline justify-between gap-4 py-5">
              <div>
                <p className="text-[15px] font-medium text-neutral-900">
                  {cs.title}
                </p>
                <p className="mt-0.5 text-[13px] text-neutral-500">
                  {cs.companyOrProject} · /work/{cs.slug}
                </p>
              </div>
              <span
                className={
                  cs.published
                    ? "text-[12px] font-medium text-neutral-900"
                    : "text-[12px] font-medium text-neutral-400"
                }
              >
                {cs.published ? "Published" : "Draft"}
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
