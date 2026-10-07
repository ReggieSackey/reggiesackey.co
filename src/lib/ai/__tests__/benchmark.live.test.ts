import { test } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { runBaseline } from "../baseline";
import { getPublicSourceCorpus } from "../corpus";
import { modelRun, newMetrics, Timings } from "../telemetry";

import { benchmarkJobs } from "./benchmarkJobs";

test.skipIf(process.env.LIVE_BASELINE !== "1")(
  "live baseline (explicit opt-in)",
  async () => {
    process.loadEnvFile(".env.local");
    const results: unknown[] = [];
    for (const job of benchmarkJobs) {
      await modelRun.run(newMetrics(), async () => {
        const timing = new Timings();
        let outcome = "complete";
        try {
          const sources = await timing.measure("corpus", getPublicSourceCorpus);
          await runBaseline(job.text, sources, timing);
        } catch {
          outcome = "failed";
        }
        results.push({ name: job.name, ...timing.finish(outcome) });
      });
      mkdirSync("docs/benchmarks", { recursive: true });
      writeFileSync(
        "docs/benchmarks/baseline.json",
        JSON.stringify(
          {
            measuredAt: new Date().toISOString(),
            scope:
              "Live model + corpus + validation; excludes HTTP and persistence",
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
