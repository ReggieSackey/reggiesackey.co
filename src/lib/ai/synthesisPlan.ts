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
  evidence: z.array(evidenceSchema).max(8),
}).strict();
export const synthesisPlanSchema = z.object({
  overallFit: z.enum(["strong", "relevant", "gap"]),
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
  const reqById = new Map(decision.extractedJob.requirements.map((r) => [r.id, r]));
  const assessedFit = new Map(decision.requirementFits?.map((item) => [item.requirementId, item.fit]) ?? []);
  const matchByReq = new Map<string, typeof decision.matches>();
  for (const requirement of decision.extractedJob.requirements) matchByReq.set(requirement.id, decision.matches.filter((m) => m.requirementIds.includes(requirement.id)));
  const buckets = new Map<string, string[]>();
  for (const requirement of decision.extractedJob.requirements) {
    const matches = matchByReq.get(requirement.id)!;
    const key = matches[0]?.capabilityId ?? `gap:${requirement.category.toLowerCase()}`;
    buckets.set(key, [...(buckets.get(key) ?? []), requirement.id]);
  }
  const groups = [...buckets.entries()].map(([key, requirementIds]) => ({ key, requirementIds }));
  while (groups.length > 8) {
    groups.sort((a, b) => a.requirementIds.length - b.requirementIds.length);
    const first = groups.shift()!;
    groups[0].requirementIds.push(...first.requirementIds);
  }
  while (groups.length < 3) {
    const index = groups.findIndex((g) => g.requirementIds.length > 1);
    if (index < 0) break;
    const requirementId = groups[index].requirementIds.pop()!;
    groups.push({ key: `split:${requirementId}`, requirementIds: [requirementId] });
  }
  const sourceMap = new Map(sources.map((source) => [sourceKey(source), source]));
  const capabilityMap = new Map(capabilities.map((capability) => [capability.id, capability]));
  const themes = groups.map((group, index) => {
    const matches = decision.matches.filter((m) => m.requirementIds.some((id) => group.requirementIds.includes(id)));
    const capabilityIds = [...new Set(matches.map((m) => m.capabilityId))];
    const strongest = matches.reduce((value, match) => Math.max(value, match.score), 0);
    const requirementFits = group.requirementIds.map((id) => assessedFit.get(id));
    const fit: Fit = requirementFits.includes("gap") ? "gap" : requirementFits.includes("transferable") ? "relevant" : requirementFits.every((value) => value === "direct") && requirementFits.length > 0 ? "strong" : matches.length === 0 ? "gap" : strongest >= 0.75 ? "strong" : "relevant";
    const lead = capabilityMap.get(capabilityIds[0]);
    const title = lead?.title ?? reqById.get(group.requirementIds[0])?.category ?? "Material difference";
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
      evidence: unique.map((source, i) => ({ id: `ev_${i + 1}`, sourceType: source.sourceType, sourceId: source.sourceId, sectionId: source.sectionId, heading: source.sectionHeading, body: source.body })),
    };
  });
  if (themes.length < 3) throw new Error("Synthesis plan requires at least three themes");
  const core = decision.extractedJob.requirements.filter((r) => r.importance === "core");
  const gapIds = new Set(themes.filter((t) => t.fit === "gap").flatMap((t) => t.requirementIds));
  const coreGapRatio = core.length ? core.filter((r) => gapIds.has(r.id)).length / core.length : 0;
  const overallFit: Fit = coreGapRatio >= 0.5 ? "gap" : themes.every((t) => t.fit === "strong") ? "strong" : "relevant";
  return synthesisPlanSchema.parse({ overallFit, themes, materialGapThemeIds: themes.filter((t) => t.fit === "gap").map((t) => t.id) });
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
