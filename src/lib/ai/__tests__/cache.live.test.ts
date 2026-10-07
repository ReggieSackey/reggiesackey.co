import { test, expect } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { candidateFitSchema, extractedJobSchema } from "../schemas";
import { assertGroundedFit, validateThemeCoverage } from "../validateCitations";
import { getPublicSourceCorpus } from "../corpus";
import { analysisSecret } from "../request";

test.skipIf(process.env.LIVE_CACHE !== "1")(
  "live cache reuse of a validated synthetic benchmark result (dev only)",
  async () => {
    process.loadEnvFile(".env.local");
    if (!process.env.CONVEX_DEPLOYMENT?.startsWith("dev:"))
      throw new Error("Development deployment required");
    const saved = JSON.parse(
      readFileSync("docs/benchmarks/analysis-product.json", "utf8"),
    );
    const fit = candidateFitSchema.parse({
      overallAssessment: saved.validated.overallAssessment,
      themes: saved.validated.themes,
      materialGaps: saved.validated.materialGaps,
      interviewQuestions: saved.validated.interviewQuestions,
    });
    const job = extractedJobSchema.parse(saved.extractedJob);
    assertGroundedFit(fit, await getPublicSourceCorpus());
    validateThemeCoverage(fit, job.requirements);
    const secret = analysisSecret(),
      cacheKey = `benchmark:${randomUUID()}`;
    const r = await fetchMutation(api.analysisGuards.reserve, {
      secret,
      cacheKey,
      inputHash: "synthetic-benchmark",
    });
    if (r.status !== "reserved" || !r.id || !r.lease)
      throw new Error("Benchmark reservation unavailable");
    let failed = true;
    try {
      await fetchMutation(api.jobAnalyses.markAnalysisComplete, {
        secret,
        id: r.id,
        jobTitle: job.jobTitle ?? undefined,
        company: job.company ?? undefined,
        overallFit: fit.overallAssessment.fit,
        overallNarrative: fit.overallAssessment.narrative,
        themes: fit.themes,
        materialGaps: fit.materialGaps,
        interviewQuestions: fit.interviewQuestions,
      });
      const samples = [];
      for (let n = 0; n < 5; n++) {
        const start = performance.now();
        expect(
          await fetchQuery(api.analysisGuards.cached, { secret, cacheKey }),
        ).toBe(r.id);
        samples.push(Math.round(performance.now() - start));
      }
      const sorted = [...samples].sort((a, b) => a - b);
      writeFileSync(
        "docs/benchmarks/cache.json",
        JSON.stringify(
          {
            measuredAt: new Date().toISOString(),
            scope:
              "Live HTTPS completed-cache lookup only; excludes route admission, fingerprint snapshot, hashing and rendering. One isolated benchmark-prefixed result retained on development; no raw JD stored.",
            samplesMs: samples,
            medianMs: sorted[2],
            modelCalls: 0,
            repairs: 0,
          },
          null,
          2,
        ),
      );
      failed = false;
    } finally {
      await fetchMutation(api.analysisGuards.release, {
        secret,
        lease: r.lease,
        failed,
      });
    }
  },
  60_000,
);
