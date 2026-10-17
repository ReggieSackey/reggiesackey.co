import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SectionBody } from "@/components/SectionBody";
import { getFitReport } from "@/content/applications";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const report = getFitReport(slug);
  if (!report) {
    return {
      title: "Application",
    };
  }

  const canonicalPath = `/application/${report.slug}`;
  return {
    title: report.metaTitle,
    description: report.metaDescription,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "article",
      title: report.metaTitle,
      description: report.metaDescription,
      url: canonicalPath,
    },
  };
}

export default async function ApplicationPage({
  params,
}: PageProps<"/application/[slug]">) {
  const { slug } = await params;
  const report = getFitReport(slug);

  if (!report) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-24 pt-16">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Application {slug}
          </h1>
          <div className="mt-6 border-t border-neutral-200 pt-6">
            <p className="max-w-xl text-sm leading-6 text-neutral-600">
              Published application page. Once applications are managed in
              admin, a reviewed and published application will render here.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-24 pt-16">
        <p className="text-[13px] font-medium uppercase tracking-wide text-neutral-500">
          Fit report
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">
          {report.role} — {report.company}
        </h1>

        <dl className="mt-6 grid gap-x-10 gap-y-3 border-t border-neutral-200 pt-6 text-sm leading-6 sm:grid-cols-[9rem_1fr]">
          <dt className="text-neutral-500">Role</dt>
          <dd className="text-neutral-700">{report.role}</dd>
          <dt className="text-neutral-500">Company</dt>
          <dd className="text-neutral-700">{report.company}</dd>
          <dt className="text-neutral-500">Location</dt>
          <dd className="text-neutral-700">{report.location}</dd>
          <dt className="text-neutral-500">Compensation</dt>
          <dd className="text-neutral-700">{report.compensation}</dd>
          <dt className="text-neutral-500">Posting</dt>
          <dd className="text-neutral-700">
            <a
              href={report.postingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900"
            >
              Official job posting and application
            </a>
          </dd>
        </dl>

        <div className="mt-8 border-t border-neutral-200 pt-6">
          <SectionBody body={report.intro} />
        </div>

        {report.sections.map((section) => (
          <section key={section.heading} className="mt-10">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
              {section.heading}
            </h2>
            <SectionBody body={section.body} />
          </section>
        ))}

        <div className="mt-12 border-t border-neutral-200 pt-6">
          <a
            href={report.postingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Apply for this role
          </a>
        </div>
      </main>
    </div>
  );
}
