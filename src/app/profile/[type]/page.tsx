import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { SiteHeader } from "@/components/SiteHeader";
import { SectionBody } from "@/components/SectionBody";

type Params = { type: string };

async function getProfileDocument(type: string) {
  return await fetchQuery(api.profileDocuments.getProfileDocumentWithSections, {
    type,
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { type } = await params;
  const data = await getProfileDocument(type);
  if (!data) {
    return { title: "Profile" };
  }
  return { title: data.document.title };
}

export default async function ProfileDocumentPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { type } = await params;
  const data = await getProfileDocument(type);
  if (!data) {
    notFound();
  }

  const { document, sections } = data;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-24 pt-16">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          {document.title}
        </h1>

        <div className="mt-10 border-t border-neutral-200 pt-10">
          <ol className="space-y-10">
            {sections.map((section) => (
              <li key={section._id} id={section.slug} className="scroll-mt-24">
                <h2 className="text-[17px] font-semibold tracking-tight text-neutral-900">
                  {section.heading}
                </h2>
                <SectionBody body={section.body} />
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  );
}
