import { NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import {
  normalizeJobDescription,
  hashJobDescription,
  MAX_JD_LENGTH,
  MIN_JD_LENGTH,
} from "@/lib/ai/jd";
import { getPublicSourceCorpus } from "@/lib/ai/corpus";
import {
  extractJobRequirements,
  evaluateCandidateFit,
} from "@/lib/ai/modelCalls";
import { validateCandidateFit, validateThemeCoverage } from "@/lib/ai/validateCitations";

export const runtime = "nodejs";
export const maxDuration = 300; // two sequential model calls

type Body = { jobDescription?: unknown };

export async function POST(request: Request) {
  // ---- Input validation ------------------------------------------
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const raw = typeof body.jobDescription === "string" ? body.jobDescription : "";
  const jd = normalizeJobDescription(raw);

  if (jd.length < MIN_JD_LENGTH) {
    return NextResponse.json(
      {
        error: `That looks too short to analyze. Paste at least ${MIN_JD_LENGTH} characters of the job description.`,
      },
      { status: 400 },
    );
  }
  if (jd.length > MAX_JD_LENGTH) {
    return NextResponse.json(
      {
        error: `Job descriptions are limited to ${MAX_JD_LENGTH.toLocaleString()} characters. Paste the most relevant portion.`,
      },
      { status: 400 },
    );
  }

  // TODO(next pass, before model execution):
  //   - per-IP/anonymized rate limiting
  //   - JD-hash cache reuse (return existing complete analysis for inputHash)
  //   - global daily spend ceiling check

  // ---- Persist processing row ------------------------------------
  const inputHash = await hashJobDescription(jd);
  const id = await fetchMutation(api.jobAnalyses.createProcessingAnalysis, {
    inputHash,
    rawJobDescription: jd,
  });

  try {
    // ---- Stage A: extraction (JD only) ---------------------------
    const extractedJob = await extractJobRequirements(jd);

    // ---- Corpus: published sources only --------------------------
    const sources = await getPublicSourceCorpus();

    // ---- Stage B: advocacy evaluation ----------------------------
    const fit = await evaluateCandidateFit({ extractedJob, sources });

    // ---- Deterministic theme coverage ----------------------------
    // Every extracted requirement must be covered by exactly one theme
    // — enforced in code, not trusted to the prompt (matters especially
    // when a malformed evaluation went through the JSON-repair pass).
    validateThemeCoverage(fit, extractedJob.requirements);

    // ---- Server-side citation validation -------------------------
    const validated = validateCandidateFit(fit, sources);

    // ---- Persist completed analysis ------------------------------
    await fetchMutation(api.jobAnalyses.markAnalysisComplete, {
      id,
      jobTitle: extractedJob.jobTitle ?? undefined,
      company: extractedJob.company ?? undefined,
      overallFit: validated.overallAssessment.fit,
      overallNarrative: validated.overallAssessment.narrative,
      themes: validated.themes.map((t) => ({
        id: t.id,
        title: t.title,
        fit: t.fit,
        narrative: t.narrative,
        requirementIds: t.requirementIds,
        citations: t.citations,
      })),
      materialGaps: validated.materialGaps.map((g) => ({
        title: g.title,
        narrative: g.narrative,
        citations: g.citations,
      })),
      interviewQuestions: validated.interviewQuestions,
    });

    return NextResponse.json({ id });
  } catch (error) {
    // Log useful detail server-side; expose nothing sensitive.
    // JSON.stringify inline so Next's dev log formatter can't drop it.
    console.error(
      "[analyze] analysis failed:",
      JSON.stringify({
        analysisId: id,
        inputHash,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    await fetchMutation(api.jobAnalyses.markAnalysisFailed, {
      id,
      errorMessage:
        error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
    }).catch((e) => console.error("[analyze] failed to mark failed", e));

    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 },
    );
  }
}
