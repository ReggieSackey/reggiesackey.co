import { extractJobRequirements, evaluateCandidateFit } from "./modelCalls";
import {
  validateCandidateFit,
  validateThemeCoverage,
} from "./validateCitations";
import { Timings } from "./telemetry";
import type { SourceSection } from "./corpus";

/** Preserved two-stage/full-corpus comparison; not exposed by the public route. */
export async function runBaseline(
  jd: string,
  sources: SourceSection[],
  timing = new Timings(),
) {
  const extractedJob = await timing.measure("extract", () =>
    extractJobRequirements(jd),
  );
  const fit = await timing.measure("evaluate", () =>
    evaluateCandidateFit({ extractedJob, sources }),
  );
  await timing.measure("coverage", () =>
    validateThemeCoverage(fit, extractedJob.requirements),
  );
  const validated = await timing.measure("citations", () =>
    validateCandidateFit(fit, sources),
  );
  return { extractedJob, validated };
}
