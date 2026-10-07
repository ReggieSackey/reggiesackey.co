import { safeFailureCode } from "../failures";
import { test } from "vitest";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { getPublicSourceCorpus } from "../corpus";
import { generateCapabilities } from "../generateCapabilities";
import { runTargeted } from "../pipeline";
import { modelRun, newMetrics, Timings } from "../telemetry";
import {
  validateRefs,
  sourceKey,
  corpusVersion,
} from "../../../../convex/evidence";
import { benchmarkJobs } from "./benchmarkJobs";
import { proposalsSchema } from "../capabilitySchemas";

test.skipIf(process.env.LIVE_TARGETED !== "1")(
  "live targeted benchmark with a reviewable proposal registry",
  async () => {
    process.loadEnvFile(".env.local");
    mkdirSync("docs/benchmarks", { recursive: true });
    const sources = await getPublicSourceCorpus();
    const version = corpusVersion(sources);
    let generated;
    try {
      const saved = JSON.parse(
        readFileSync("docs/benchmarks/capability-proposals.json", "utf8"),
      );
      if (saved.corpusVersion !== version) throw new Error("stale");
      generated = proposalsSchema.parse({ proposals: saved.proposals });
    } catch {
      generated = await modelRun.run(newMetrics(), () =>
        generateCapabilities(sources, []),
      );
      for (const p of generated.proposals) validateRefs(p.evidence, sources);
      writeFileSync(
        "docs/benchmarks/capability-proposals.json",
        JSON.stringify({ ...generated, corpusVersion: version }, null, 2),
      );
    }
    const caps = generated.proposals.map((p, n) => ({
      ...p,
      id: `benchmark-${n + 1}`,
    }));
    const results: unknown[] = [];
    for (const job of benchmarkJobs) {
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
            `docs/benchmarks/analysis-${job.name}.json`,
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
              "Live model + validation; in-memory proposed registry and canonical evidence, excludes HTTP/persistence/Convex targeted query. No registry approval performed.",
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
