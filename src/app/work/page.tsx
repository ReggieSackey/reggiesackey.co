import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";

export const metadata: Metadata = {
  title: "Work",
};

// Content is canonical in Convex; reflect publish state immediately
// rather than baking the list at build time.
export const dynamic = "force-dynamic";

export default async function WorkIndexPage() {
  const caseStudies = await fetchQuery(api.caseStudies.getPublishedCaseStudies);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-24 pt-16">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Work
        </h1>

        {caseStudies.length === 0 ? (
          <div className="mt-6 border-t border-neutral-200 pt-6">
            <p className="max-w-xl text-sm leading-6 text-neutral-600">
              Case studies coming soon.
            </p>
          </div>
        ) : (
          <ul className="mt-8 divide-y divide-neutral-200">
            {caseStudies.map((cs) => (
              <li key={cs._id} className="py-7">
                <h2 className="text-[15px] font-semibold text-neutral-900">
                  <Link
                    href={`/work/${cs.slug}`}
                    className="hover:underline hover:underline-offset-4"
                  >
                    {cs.title}
                  </Link>
                </h2>
                <p className="mt-1 text-[13px] text-neutral-500">
                  {cs.companyOrProject}
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                  {cs.summary}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
