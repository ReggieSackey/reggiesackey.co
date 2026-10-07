import { configuredMatcherId, createZaiMatcher, type CapabilityMatcher } from "./matcher";
import { createJevMatcher } from "./jevMatcher";
import { evaluatePlannedCandidateFit, type CallModel } from "./modelCalls";
import type { Capability } from "./capabilitySchemas";
import type { SourceSection } from "./corpus";
import {
  validateThemeCoverage,
  validateCandidateFit,
  assertGroundedFit,
} from "./validateCitations";
import { Timings } from "./telemetry";
import { buildSynthesisPlan } from "./synthesisPlan";

export function getConfiguredMatcher(): CapabilityMatcher {
  return configuredMatcherId() === "jev-v1" ? createJevMatcher() : createZaiMatcher();
}

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
    (args.matcher ?? getConfiguredMatcher()).interpretAndMatch(
      args.jd,
      args.capabilities,
    ),
  );
  const ids = decision.matches.map((m) => m.capabilityId);
  const sources = await timing.measure("retrieve", () => args.retrieve(ids));
  const capabilities = args.capabilities.filter((c) => ids.includes(c.id));
  const plan = await timing.measure("plan", () =>
    buildSynthesisPlan(decision, capabilities, sources),
  );
  const fit = await timing.measure("synthesis", () =>
    evaluatePlannedCandidateFit(
      { extractedJob: decision.extractedJob, plan },
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
      unmatchedRequirementIds: decision.extractedJob.requirements
        .filter((r) => !decision.matches.some((m) => m.requirementIds.includes(r.id)))
        .map((r) => r.id),
    },
  };
}
