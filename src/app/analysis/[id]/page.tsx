import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { CitationRow } from "@/components/CitationRow";
import { AutoRefresh } from "@/components/AutoRefresh";
import { buildCitationContext } from "@/lib/citationContext";
import { DEV_ANALYSIS } from "@/lib/devAnalysis";
import type { Citation, FitLabel } from "@/lib/analysis";
import { AnalysisToolbar } from "@/components/AnalysisToolbar";

export const metadata: Metadata = {
  title: "Fit analysis",
};

const OVERALL_TEXT: Record<string, string> = {
  strong: "Strong fit",
  relevant: "Promising, but unproven",
  gap: "Significant gap",
};

interface DisplayTheme {
  id: string;
  title: string;
  fit: FitLabel;
  narrative: string;
  citations: Citation[];
}

interface DisplayMaterialGap {
  title: string;
  narrative: string;
  citations: Citation[];
}

interface DisplayAnalysis {
  jobTitle: string | null;
  company: string | null;
  overallFit: string | null;
  overallNarrative: string | null;
  themes: DisplayTheme[];
  materialGaps: DisplayMaterialGap[];
  interviewQuestions: string[];
}

export default async function AnalysisPage({
  params,
}: PageProps<"/analysis/[id]">) {
  const { id } = await params;

  // Development-only visual regression fixture (never in production).
  if (process.env.NODE_ENV === "development" && id === "dev-fixture") {
    return (
      <AnalysisBody
        analysis={{
          jobTitle: DEV_ANALYSIS.jobTitle,
          company: DEV_ANALYSIS.company,
          overallFit: DEV_ANALYSIS.overallAssessment.fit,
          overallNarrative: DEV_ANALYSIS.overallAssessment.narrative,
          themes: DEV_ANALYSIS.themes,
          materialGaps: DEV_ANALYSIS.materialGaps,
          interviewQuestions: DEV_ANALYSIS.interviewQuestions,
        }}
        isFixture
      />
    );
  }

  // Real analysis. Convex ids are 32-char base62 with a checksum;
  // invalid-format ids throw a validator error → treat as not found.
  if (!/^[a-z0-9]{22,32}$/i.test(id)) {
    notFound();
  }

  const analysisId = id as Id<"jobAnalyses">;
  const fetchCompleted = () =>
    fetchQuery(api.jobAnalyses.getCompletedAnalysis, {
      id: analysisId,
    }).catch(() => null);
  const fetchStatus = () =>
    fetchQuery(api.jobAnalyses.getAnalysisStatus, {
      id: analysisId,
    }).catch(() => null);

  const completed = await fetchCompleted();

  if (!completed) {
    const status = await fetchStatus();
    if (status === null) notFound();
    if (status.status === "processing") return <ProcessingState />;
    return <FailedState />; // failed (or unknown status) — generic message
  }

  return (
    <AnalysisBody
      analysis={{
        jobTitle: completed.jobTitle,
        company: completed.company,
        overallFit: completed.overallFit,
        overallNarrative: completed.overallNarrative,
        themes: completed.themes.map((t) => ({
          id: t.id,
          title: t.title,
          fit: t.fit,
          narrative: t.narrative,
          citations: t.citations,
        })),
        materialGaps: completed.materialGaps.map((g) => ({
          title: g.title,
          narrative: g.narrative,
          citations: g.citations,
        })),
        interviewQuestions: completed.interviewQuestions,
      }}
    />
  );
}

// -------------------------------------------------------------------

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="analysis-frame">
      <main className="analysis-card">
        {children}
      </main>
    </div>
  );
}

function ProcessingState() {
  return (
    <Shell>
      <AnalysisToolbar />
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Analyzing…
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-600">
        Evaluating the job description against the source material. This
        usually takes under a minute.
      </p>
      <AutoRefresh seconds={5} />
    </Shell>
  );
}

function FailedState() {
  return (
    <Shell>
      <AnalysisToolbar />
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Analysis failed
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-600">
        Something went wrong while analyzing this job description. The failure
        has been logged.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-sm bg-neutral-900 px-5 text-sm font-medium text-white"
      >
        Try again
      </Link>
    </Shell>
  );
}

async function AnalysisBody({
  analysis,
  isFixture = false,
}: {
  analysis: DisplayAnalysis;
  isFixture?: boolean;
}) {
  const context = await buildCitationContext([
    ...analysis.themes.flatMap((t) => t.citations),
    ...analysis.materialGaps.flatMap((g) => g.citations),
  ]);
  const positiveThemes = analysis.themes.filter((theme) => theme.fit !== "gap").slice(0, 5);

  return (
    <Shell>
      <AnalysisToolbar />
      <div id="analysis-content">
      <h1 className="analysis-title text-3xl font-semibold tracking-tight text-neutral-900">
        {analysis.jobTitle ?? "Role"}
      </h1>
      {analysis.company ? <p className="mt-2 text-[13px] text-neutral-500">{analysis.company}</p> : null}
      {isFixture ? (
        <p className="mt-2 text-[12px] text-neutral-400">
          Development fixture — not model output.
        </p>
      ) : null}

      <section className="mt-8 border-t border-neutral-200 pt-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-neutral-500">
          Overall assessment
        </h2>
        <p className="mt-2 text-xl font-semibold text-neutral-900">
          {OVERALL_TEXT[analysis.overallFit ?? "relevant"]}
        </p>
        {analysis.overallNarrative ? (
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-neutral-600">
            {analysis.overallNarrative}
          </p>
        ) : null}
      </section>

      {positiveThemes.length > 0 ? (
        <div className="mt-12 border-t border-neutral-200">
          <h2 className="pt-6 text-[13px] font-semibold uppercase tracking-wide text-neutral-500">
            Where I fit
          </h2>
          <div className="divide-y divide-neutral-200">
            {positiveThemes.map((theme) => (
              <article key={theme.id} className="py-10">
                <div>
                  <h3 className="text-[17px] font-semibold tracking-tight text-neutral-900">
                    {theme.title}
                  </h3>
                </div>

                <div className="mt-3 max-w-[65ch]">
                  <p className="text-[15px] leading-7 text-neutral-700">
                    {theme.narrative}
                  </p>

                  {theme.citations.length > 0 ? (
                    <div className="mt-4 space-y-4">
                      {theme.citations.map((citation, i) => (
                        <CitationRow
                          key={`${theme.id}:${citation.sourceType}:${citation.sourceId}:${citation.sectionId}:${i}`}
                          citation={citation}
                          context={context}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {analysis.materialGaps.length > 0 ? (
        <section className="mt-12 border-t border-neutral-200 pt-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-neutral-500">
            Where I&rsquo;m less proven
          </h2>
          <div className="mt-4 space-y-8">
            {analysis.materialGaps.map((gap, i) => (
              <div key={`gap:${i}`}>
                <h3 className="text-[17px] font-semibold tracking-tight text-neutral-900">
                  {gap.title}
                </h3>
                <p className="mt-2 max-w-[65ch] text-[15px] leading-7 text-neutral-700">
                  {gap.narrative}
                </p>
                {gap.citations.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {gap.citations.map((citation, j) => (
                      <CitationRow
                        key={`gap:${i}:${citation.sourceType}:${citation.sourceId}:${citation.sectionId}:${j}`}
                        citation={citation}
                        context={context}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {analysis.interviewQuestions.length > 0 ? (
        <section className="mt-12 border-t border-neutral-200 pt-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-neutral-500">
            One thing I&rsquo;d want to discuss
          </h2>
          <p className="mt-3 max-w-[65ch] text-[15px] leading-7 text-neutral-700">
            {analysis.interviewQuestions[0]}
          </p>
        </section>
      ) : null}
      </div>
    </Shell>
  );
}
