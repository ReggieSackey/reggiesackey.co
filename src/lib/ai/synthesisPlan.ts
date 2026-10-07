import { z } from "zod";
import type { Capability, Decision } from "./capabilitySchemas";
import type { SourceSection } from "./corpus";
import type { CandidateFit, Fit, ModelCitation } from "./schemas";

const evidenceSchema = z.object({
  id: z.string().regex(/^ev_\d+$/),
  sourceType: z.enum(["caseStudy", "profile"]),
  sourceId: z.string().min(1),
  sectionId: z.string().min(1),
  heading: z.string().min(1),
  body: z.string().min(1),
}).strict();
const plannedThemeSchema = z.object({
  id: z.string().regex(/^theme_\d+$/),
  title: z.string().min(1).max(120),
  fit: z.enum(["strong", "relevant", "gap"]),
  requirementIds: z.array(z.string()).min(1),
  capabilityIds: z.array(z.string()),
  workIds: z.array(z.string()),
  successDriverIds: z.array(z.string()),
  hardConstraintIds: z.array(z.string()),
  evidence: z.array(evidenceSchema).max(8),
}).strict();
export const synthesisPlanSchema = z.object({
  overallFit: z.enum(["strong", "relevant", "gap"]),
  roleContext: z.object({
    mission: z.string(),
    work: z.array(z.object({ id: z.string(), activity: z.string() }).strict()),
    successDrivers: z.array(z.object({ id: z.string(), driver: z.string() }).strict()),
    hardConstraints: z.array(z.object({ id: z.string(), constraint: z.string(), severity: z.enum(["blocking", "material"]) }).strict()),
  }).strict(),
  themes: z.array(plannedThemeSchema).min(3).max(8),
  materialGapThemeIds: z.array(z.string()),
}).strict();
export type SynthesisPlan = z.infer<typeof synthesisPlanSchema>;

const proseSchema = z.object({
  overallNarrative: z.string().min(1).max(2000),
  themeNarratives: z.record(z.string(), z.string().min(1).max(2000)),
  interviewQuestions: z.array(z.string().min(1).max(500)).max(3),
}).strict();
export type SynthesisProse = z.infer<typeof proseSchema>;
export { proseSchema };

const sourceKey = (value: { sourceType: string; sourceId: string; sectionId: string }) => `${value.sourceType}:${value.sourceId}:${value.sectionId}`;

export function buildSynthesisPlan(decision: Decision, capabilities: Capability[], sources: SourceSection[]): SynthesisPlan {
  if (!decision.successProfile || !decision.capabilityRelevance) throw new Error("Incomplete success profile decision");
  const reqById = new Map(decision.extractedJob.requirements.map((r) => [r.id, r]));
  const assessedFit = new Map(decision.requirementFits?.map((item) => [item.requirementId, item.fit]) ?? []);
  const relevance = decision.capabilityRelevance.filter((item) => item.relevance !== "incidental");
  const selectedWork = decision.successProfile.work.filter((item) => item.importance !== "secondary").slice(0, 5);
  const work = selectedWork.length ? selectedWork : decision.successProfile.work.slice(0, 3);
  type Group = { title: string; workIds: string[]; successDriverIds: string[]; hardConstraintIds: string[]; capabilityIds: string[]; requirementIds: string[] };
  const groups: Group[] = work.map((item) => {
    const related = relevance.filter((entry) => entry.workIds.includes(item.id));
    return {
      title: item.activity.slice(0, 120),
      workIds: [item.id],
      successDriverIds: [...new Set(related.flatMap((entry) => entry.successDriverIds))],
      hardConstraintIds: [],
      capabilityIds: [...new Set(related.map((entry) => entry.capabilityId))],
      requirementIds: [],
    };
  });
  if (decision.successProfile.hardConstraints.length && groups.length < 6) {
    const constraints = decision.successProfile.hardConstraints;
    groups.push({
      title: constraints.map((item) => item.constraint).join("; ").slice(0, 120),
      workIds: [], successDriverIds: [], hardConstraintIds: constraints.map((item) => item.id), capabilityIds: [], requirementIds: [],
    });
  }
  const softGapRequirements = decision.extractedJob.requirements.filter((requirement) =>
    assessedFit.get(requirement.id) === "gap" &&
    requirement.importance !== "core" &&
    !decision.matches.some((match) => match.requirementIds.includes(requirement.id)),
  );
  if (softGapRequirements.length && groups.length < 6) {
    groups.push({
      title: softGapRequirements.map((item) => item.requirement).join("; ").slice(0, 120),
      workIds: [], successDriverIds: [], hardConstraintIds: [], capabilityIds: [], requirementIds: softGapRequirements.map((item) => item.id),
    });
  }
  for (const requirement of decision.extractedJob.requirements) {
    if (groups.some((group) => group.requirementIds.includes(requirement.id))) continue;
    const matchedCapabilities = decision.matches.filter((match) => match.requirementIds.includes(requirement.id)).map((match) => match.capabilityId);
    const isGap = assessedFit.get(requirement.id) === "gap";
    let best = 0, bestScore = -1;
    groups.forEach((group, index) => {
      const overlap = group.capabilityIds.filter((id) => matchedCapabilities.includes(id)).length;
      const score = overlap * 10 + (isGap && group.hardConstraintIds.length ? 5 : 0) - group.requirementIds.length;
      if (score > bestScore) { best = index; bestScore = score; }
    });
    groups[best].requirementIds.push(requirement.id);
  }
  for (let index = groups.length - 1; index >= 0; index--) if (!groups[index].requirementIds.length) groups.splice(index, 1);
  while (groups.length < 3) {
    const index = groups.findIndex((group) => group.requirementIds.length > 1);
    if (index < 0) break;
    const requirementId = groups[index].requirementIds.pop()!;
    groups.push({ title: reqById.get(requirementId)?.requirement.slice(0, 120) ?? "Additional role need", workIds: [...groups[index].workIds], successDriverIds: [...groups[index].successDriverIds], hardConstraintIds: [], capabilityIds: [...groups[index].capabilityIds], requirementIds: [requirementId] });
  }
  const sourceMap = new Map(sources.map((source) => [sourceKey(source), source]));
  const capabilityMap = new Map(capabilities.map((capability) => [capability.id, capability]));
  const themes = groups.slice(0, 6).map((group, index) => {
    const matches = decision.matches.filter((m) => m.requirementIds.some((id) => group.requirementIds.includes(id)));
    const capabilityIds = [...new Set([...group.capabilityIds, ...matches.map((m) => m.capabilityId)])].filter((id) => relevance.some((item) => item.capabilityId === id));
    const strongest = matches.reduce((value, match) => Math.max(value, match.score), 0);
    const requirementFits = group.requirementIds.map((id) => assessedFit.get(id));
    const fit: Fit = group.hardConstraintIds.length || requirementFits.includes("gap") ? "gap" : requirementFits.includes("transferable") ? "relevant" : requirementFits.every((value) => value === "direct") && capabilityIds.length > 0 ? "strong" : matches.length === 0 ? "gap" : strongest >= 0.75 ? "strong" : "relevant";
    const title = group.title;
    const refs = capabilityIds.flatMap((id) => capabilityMap.get(id)?.evidence ?? []);
    const allowed = refs.map((ref) => sourceMap.get(sourceKey(ref))).filter((x): x is SourceSection => Boolean(x));
    const gapContext = fit === "gap" ? sources.filter((s) => s.sourceType === "profile" && /limitation|limited-experience|career|chronolog/.test(s.sectionId)) : [];
    const unique = [...new Map([...allowed, ...gapContext].map((s) => [sourceKey(s), s])).values()].slice(0, 8);
    return {
      id: `theme_${index + 1}`,
      title,
      fit,
      requirementIds: group.requirementIds,
      capabilityIds,
      workIds: group.workIds,
      successDriverIds: group.successDriverIds,
      hardConstraintIds: group.hardConstraintIds,
      evidence: unique.map((source, i) => ({ id: `ev_${i + 1}`, sourceType: source.sourceType, sourceId: source.sourceId, sectionId: source.sectionId, heading: source.sectionHeading, body: source.body })),
    };
  });
  if (themes.length < 3) throw new Error("Synthesis plan requires at least three themes");
  const core = decision.extractedJob.requirements.filter((r) => r.importance === "core");
  const gapIds = new Set(themes.filter((t) => t.fit === "gap").flatMap((t) => t.requirementIds));
  const coreGapRatio = core.length ? core.filter((r) => gapIds.has(r.id)).length / core.length : 0;
  const blocking = decision.successProfile.hardConstraints.some((item) => item.severity === "blocking");
  const overallFit: Fit = blocking || coreGapRatio >= 0.5 ? "gap" : themes.every((t) => t.fit === "strong") ? "strong" : "relevant";
  return synthesisPlanSchema.parse({
    overallFit,
    roleContext: {
      mission: decision.successProfile.mission,
      work: decision.successProfile.work.map(({ id, activity }) => ({ id, activity })),
      successDrivers: decision.successProfile.successDrivers.map(({ id, driver }) => ({ id, driver })),
      hardConstraints: decision.successProfile.hardConstraints,
    },
    themes,
    materialGapThemeIds: themes.filter((t) => t.fit === "gap" || t.hardConstraintIds.length).map((t) => t.id),
  });
}

export function mergeSynthesis(plan: SynthesisPlan, prose: SynthesisProse): CandidateFit {
  const themeIds = plan.themes.map((theme) => theme.id);
  if (Object.keys(prose.themeNarratives).sort().join() !== [...themeIds].sort().join()) throw new Error("Synthesis theme contract mismatch");
  const citation = (theme: SynthesisPlan["themes"][number]): ModelCitation[] => {
    return theme.evidence.slice(0, theme.fit === "gap" ? 1 : 2).map((item) => {
      return { sourceType: item.sourceType, sourceId: item.sourceId, sectionId: item.sectionId };
    });
  };
  const themes = plan.themes.map((theme) => {
    return { id: theme.id, title: theme.title, fit: theme.fit, narrative: prose.themeNarratives[theme.id], requirementIds: theme.requirementIds, citations: citation(theme) };
  });
  return {
    overallAssessment: { fit: plan.overallFit, narrative: prose.overallNarrative },
    themes,
    materialGaps: plan.materialGapThemeIds.map((id) => {
      const theme = plan.themes.find((item) => item.id === id)!;
      return { title: theme.title, narrative: prose.themeNarratives[id], citations: citation(theme) };
    }),
    interviewQuestions: prose.interviewQuestions,
  };
}
