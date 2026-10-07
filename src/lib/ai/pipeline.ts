import { createZaiMatcher, type CapabilityMatcher } from "./matcher";
import { evaluateCandidateFit, type CallModel } from "./modelCalls";
import type { Capability } from "./capabilitySchemas";
import type { SourceSection } from "./corpus";
import {
  validateThemeCoverage,
  validateCandidateFit,
  assertGroundedFit,
} from "./validateCitations";
import { Timings } from "./telemetry";

export async function runTargeted(args: {
  jd: string;
  capabilities: Capability[];
  retrieve: (ids: string[]) => Promise<SourceSection[]>;
  matcher?: CapabilityMatcher;
  caller?: CallModel;
  timing?: Timings;
}) {
  const timing = args.timing ?? new Timings();
  const decision = await timing.measure("match", () =>
    (args.matcher ?? createZaiMatcher()).interpretAndMatch(
      args.jd,
      args.capabilities,
    ),
  );
  const ids = decision.matches.map((m) => m.capabilityId);
  const sources = await timing.measure("retrieve", () => args.retrieve(ids));
  const capabilities = args.capabilities.filter((c) => ids.includes(c.id));
  const fit = await timing.measure("synthesis", () =>
    evaluateCandidateFit(
      { extractedJob: decision.extractedJob, sources, capabilities },
      args.caller,
    ),
  );
  await timing.measure("coverage", () =>
    validateThemeCoverage(fit, decision.extractedJob.requirements),
  );
  const validated = await timing.measure("citations", () => {
    assertGroundedFit(fit, sources);
    return validateCandidateFit(fit, sources);
  });
  return {
    extractedJob: decision.extractedJob,
    validated,
    selection: {
      capabilityIds: ids,
      evidenceSections: sources.length,
      evidenceCharacters: sources.reduce((n, s) => n + s.body.length, 0),
    },
  };
}
