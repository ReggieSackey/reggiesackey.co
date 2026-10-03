import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { SiteHeader } from "@/components/SiteHeader";
import { SectionBody } from "@/components/SectionBody";

type Params = { slug: string };

async function getCaseStudy(slug: string) {
  return await fetchQuery(api.caseStudies.getCaseStudyWithSections, { slug });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCaseStudy(slug);
  if (!data) {
    return { title: "Case study" };
  }
  return { title: data.caseStudy.title, description: data.caseStudy.summary };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const data = await getCaseStudy(slug);
  if (!data) {
    notFound();
  }

  const { caseStudy, sections } = data;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-24 pt-16">
        <p className="text-[13px] text-neutral-500">
          {caseStudy.companyOrProject}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">
          {caseStudy.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
          {caseStudy.summary}
        </p>

        <div className="mt-10 border-t border-neutral-200 pt-10">
          <ol className="space-y-10">
            {sections.map((section) => (
              <li key={section._id} id={section.slug} className="scroll-mt-24">
                <h2 className="text-[17px] font-semibold tracking-tight text-neutral-900">
                  {section.heading}
                </h2>
                <SectionBody body={section.body} />
                {section.summary ? (
                  <p className="mt-3 text-[13px] text-neutral-500">
                    {section.summary}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  );
}
