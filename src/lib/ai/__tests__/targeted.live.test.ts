import { safeFailureCode } from "../failures";
import { test } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { getPublicSourceCorpus } from "../corpus";
import { runTargeted } from "../pipeline";
import { modelRun, newMetrics, Timings } from "../telemetry";
import {
  validateRefs,
  sourceKey,
  corpusVersion,
} from "../../../../convex/evidence";
import { benchmarkJobs } from "./benchmarkJobs";
import { evaluationJobs } from "./evaluationJobs";
import { CANONICAL_CAPABILITIES } from "../../../../convex/canonicalCapabilities";
import { StructuredOutputParseError } from "../json";

test.skipIf(process.env.LIVE_TARGETED !== "1")(
  "live targeted benchmark with a reviewable proposal registry",
  async () => {
    process.loadEnvFile(".env.local");
    mkdirSync("docs/benchmarks", { recursive: true });
    const sources = await getPublicSourceCorpus();
    const version = corpusVersion(sources);
    for (const capability of CANONICAL_CAPABILITIES) {
      try { validateRefs(capability.evidence, sources); }
      catch { throw new Error(`Invalid canonical references for ${capability.slug}: ${capability.evidence.map(sourceKey).filter((key) => !new Set(sources.map(sourceKey)).has(key)).join(", ")}`); }
    }
    const caps = CANONICAL_CAPABILITIES.map((capability) => ({ ...capability, id: capability.slug }));
    const selectedJobs = process.env.BROAD_EVALUATION === "1"
      ? evaluationJobs.filter((job) => ["forward-deployed-technical", "technical-product-manager", "automation-systems", "deep-infrastructure", "credentialed-profession", "emerging-role"].includes(job.name))
      : benchmarkJobs;
    const jobs = process.env.BENCHMARK_JOB ? selectedJobs.filter((job) => job.name === process.env.BENCHMARK_JOB) : selectedJobs;
    const results: unknown[] = [];
    for (const job of jobs) {
      await modelRun.run(newMetrics(), async () => {
        const timing = new Timings();
        let outcome = "complete",
          selection: unknown = null,
          failureStage = "";
        try {
          const result = await runTargeted({
            jd: job.text,
            capabilities: caps,
            timing,
            retrieve: async (ids) => {
              const keys = new Set(
                caps
                  .filter((c) => ids.includes(c.id))
                  .flatMap((c) => c.evidence.map(sourceKey)),
              );
              const selected = sources.filter(
                (s) =>
                  keys.has(sourceKey(s)) ||
                  (s.sourceType === "profile" &&
                    /chronolog|career|limitation|limited-experience/.test(
                      s.sectionId,
                    )),
              );
              if (
                !selected.length ||
                selected.length > 30 ||
                selected.reduce((n, s) => n + s.body.length, 0) > 65000
              )
                throw new Error("package_limit");
              return selected;
            },
          });
          writeFileSync(
            `docs/benchmarks/${process.env.ANALYSIS_OUTPUT_PREFIX ?? "analysis"}-${job.name}.json`,
            JSON.stringify({ job: job.name, ...result }, null, 2),
          );
          selection = {
            ...result.selection,
            capabilities: result.selection.capabilityIds.map(
              (id) => caps.find((c) => c.id === id)?.title,
            ),
          };
        } catch (error) {
          outcome = "failed";
          failureStage = safeFailureCode(error);
          const issues = error instanceof StructuredOutputParseError && Array.isArray(error.issues)
            ? (error.issues as Array<{ code: string; path: PropertyKey[]; message: string }>).slice(0, 3)
            : [];
          const failureDetail = error instanceof StructuredOutputParseError
            ? { stage: error.failureStage, issues: issues.map((issue) => ({ code: issue.code, path: issue.path.join("."), message: issue.message })) }
            : { code: failureStage };
          writeFileSync(
            `docs/benchmarks/${process.env.ANALYSIS_OUTPUT_PREFIX ?? "analysis"}-${job.name}.json`,
            JSON.stringify({ job: job.name, outcome, failureStage, failureDetail }, null, 2),
          );
        }
        results.push({
          name: job.name,
          ...timing.finish(outcome),
          selection,
          failureStage,
        });
      });
      writeFileSync(
        process.env.BENCHMARK_OUTPUT ?? "docs/benchmarks/targeted.json",
        JSON.stringify(
          {
            measuredAt: new Date().toISOString(),
            scope:
              "Live model + validation; fixed canonical capability registry and canonical evidence, excludes HTTP/persistence/Convex targeted query. No registry approval performed.",
            corpusVersion: version,
            results,
          },
          null,
          2,
        ),
      );
    }
  },
  800_000,
);
