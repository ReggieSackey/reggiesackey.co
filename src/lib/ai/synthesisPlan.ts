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
    work: z.array(z.object({ id: z.string(), activity: z.string(), importance: z.enum(["core", "important", "secondary"]) }).strict()),
    successDrivers: z.array(z.object({ id: z.string(), driver: z.string(), importance: z.enum(["core", "important", "secondary"]) }).strict()),
    hardConstraints: z.array(z.object({ id: z.string(), constraint: z.string(), severity: z.enum(["blocking", "material"]) }).strict()),
  }).strict(),
  themes: z.array(plannedThemeSchema).min(3).max(8),
  materialGapThemeIds: z.array(z.string()),
}).strict();
export type SynthesisPlan = z.infer<typeof synthesisPlanSchema>;

const proseShape = z.object({
  overallNarrative: z.string().min(1).max(2000),
  themeNarratives: z.record(z.string(), z.string().min(1).max(2000)),
  interviewQuestions: z.array(z.string().min(1).max(500)).max(1),
}).strict();
const forbiddenPublicStructure = /https?:\/\/|www\.|\b(?:req|theme|ev|work|driver|constraint)_\d+\b/i;
export function publicStyleIssues(value: z.infer<typeof proseShape>): string[] {
  const narratives = [value.overallNarrative, ...Object.values(value.themeNarratives)];
  const issues = new Set<string>();
  if (narratives.some((text) => /\bReg(?: Sackey(?:-Addo)?)?(?:'s)?\b|\bthe (?:candidate|applicant)\b/i.test(text)))
    issues.add("third_person_candidate_wording");
  if (narratives.some((text) => text.includes("—"))) issues.add("em_dash");
  if (narratives.some((text) => !/\b(?:I|me|my|I've|I'm)\b/i.test(text)))
    issues.add("missing_first_person");
  if (new Set(narratives.map((text) => text.trim())).size !== narratives.length)
    issues.add("duplicate_narrative");
  return [...issues];
}
function validatePublicStructure(
  value: z.infer<typeof proseShape>,
  ctx: z.RefinementCtx,
  capabilityIds: string[] = [],
) {
  const entries = [
    ["overallNarrative", value.overallNarrative] as const,
    ...Object.entries(value.themeNarratives),
    ...value.interviewQuestions.map((question, index) => [`interviewQuestions.${index}`, question] as const),
  ];
  for (const [key, text] of entries) {
    if (forbiddenPublicStructure.test(text) || capabilityIds.some((id) => id && text.includes(id)))
      ctx.addIssue({ code: "custom", path: [key], message: "Public prose contains a URL or internal ID" });
  }
}
const proseSchema = proseShape.superRefine((value, ctx) => validatePublicStructure(value, ctx));
export const proseSchemaForPlan = (plan: SynthesisPlan) =>
  proseShape.superRefine((value, ctx) =>
    validatePublicStructure(value, ctx, plan.themes.flatMap((theme) => theme.capabilityIds)),
  );
export type SynthesisProse = z.infer<typeof proseSchema>;
export { proseSchema };

const sourceKey = (value: { sourceType: string; sourceId: string; sectionId: string }) => `${value.sourceType}:${value.sourceId}:${value.sectionId}`;

const CAPABILITY_TITLES: Record<string, string> = {
  "ambiguous-problem-to-working-system": "Working through ambiguity",
  "zero-to-one-product-building": "Building from scratch",
  "whole-system-reasoning": "Working across a whole system",
  "integration-workflow-engineering": "Connecting systems",
  "applied-ai-systems": "Building AI into real workflows",
  "rapid-technical-adaptation": "Learning unfamiliar systems",
  "product-interaction-judgment": "Shaping how products work",
  "platform-extension-abstraction-escape": "Extending platforms",
  "production-problem-solving": "Solving production problems",
  "data-state-modeling": "Modeling data and state",
  "ai-enabled-process-design": "Designing work with AI",
  "cross-boundary-execution": "Working across technical areas",
};
function requiresSpecializedDirectExperience(text: string) {
  return /controlled experiment|statistical research|formal research method|set (?:an |the )?research agenda|manage(?:d|ment)? (?:managers|an organization|a team)|direct reports|SRE|Kubernetes|Terraform|Kafka|Linux networking|active .{0,30}(?:license|certification)|CPA/i.test(text);
}
function titleForGroup(
  group: { capabilityIds: string[]; requirementIds: string[]; hardConstraintIds: string[] },
  capabilityMap: Map<string, Capability>,
  reqById: Map<string, Decision["extractedJob"]["requirements"][number]>,
) {
  const capability = group.capabilityIds.map((id) => capabilityMap.get(id)).find(Boolean);
  if (capability && !group.hardConstraintIds.length)
    return CAPABILITY_TITLES[capability.slug] ?? capability.title.slice(0, 60);
  const text = group.requirementIds.map((id) => reqById.get(id)?.requirement ?? "").join(" ");
  if (/controlled experiment|statistical|research method|research agenda/i.test(text)) return "Formal research methods";
  if (/manage|management|manager|organization of|direct reports/i.test(text)) return "People management at scale";
  if (/SRE|Kubernetes|Terraform|Kafka|infrastructure|Linux networking/i.test(text)) return "Infrastructure specialization";
  if (/license|certification|credential|CPA/i.test(text)) return "Required credentials";
  const category = reqById.get(group.requirementIds[0])?.category;
  return category ? `${category[0].toUpperCase()}${category.slice(1)} experience`.slice(0, 60) : "A less proven area";
}

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
  const unsupportedGapRequirements = decision.extractedJob.requirements.filter((requirement) =>
    assessedFit.get(requirement.id) === "gap" &&
    (!decision.matches.some((match) => match.requirementIds.includes(requirement.id)) ||
      requiresSpecializedDirectExperience(requirement.requirement)),
  );
  if (unsupportedGapRequirements.length && groups.length < 6) {
    groups.push({
      title: "A less proven area",
      workIds: [], successDriverIds: [], hardConstraintIds: [], capabilityIds: [], requirementIds: unsupportedGapRequirements.map((item) => item.id),
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
  const usedTitles = new Set<string>();
  const themes = groups.slice(0, 6).map((group, index) => {
    const matches = decision.matches.filter((m) => m.requirementIds.some((id) => group.requirementIds.includes(id)));
    const capabilityIds = [...new Set([...group.capabilityIds, ...matches.map((m) => m.capabilityId)])].filter((id) => relevance.some((item) => item.capabilityId === id));
    const strongest = matches.reduce((value, match) => Math.max(value, match.score), 0);
    const requirementFits = group.requirementIds.map((id) => assessedFit.get(id));
    const specializedGap = group.requirementIds.some((id) => assessedFit.get(id) === "gap" && requiresSpecializedDirectExperience(reqById.get(id)?.requirement ?? ""));
    const unsupportedGap = requirementFits.includes("gap") && capabilityIds.length === 0;
    const fit: Fit = group.hardConstraintIds.length || specializedGap || unsupportedGap ? "gap" : requirementFits.includes("gap") || requirementFits.includes("transferable") ? "relevant" : requirementFits.every((value) => value === "direct") && capabilityIds.length > 0 ? "strong" : matches.length === 0 ? "gap" : strongest >= 0.75 ? "strong" : "relevant";
    let title = titleForGroup(group, capabilityMap, reqById);
    if (usedTitles.has(title)) {
      const alternative = group.capabilityIds
        .map((id) => capabilityMap.get(id))
        .map((capability) => capability && (CAPABILITY_TITLES[capability.slug] ?? capability.title.slice(0, 60)))
        .find((candidate): candidate is string => Boolean(candidate && !usedTitles.has(candidate)));
      title = alternative ?? `${reqById.get(group.requirementIds[0])?.category ?? "Related"} work`;
      title = `${title[0].toUpperCase()}${title.slice(1)}`.slice(0, 60);
    }
    usedTitles.add(title);
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
  const blocking = decision.successProfile.hardConstraints.some((item) => item.severity === "blocking");
  const coreWorkIds = new Set(decision.successProfile.work.filter((item) => item.importance === "core").map((item) => item.id));
  const coreDriverIds = new Set(decision.successProfile.successDrivers.filter((item) => item.importance === "core").map((item) => item.id));
  const centralThemes = themes.filter((theme) => theme.workIds.some((id) => coreWorkIds.has(id)) || theme.successDriverIds.some((id) => coreDriverIds.has(id)));
  const centralGapRatio = centralThemes.length ? centralThemes.filter((theme) => theme.fit === "gap").length / centralThemes.length : 0;
  const centralSupported = centralThemes.filter((theme) => theme.fit !== "gap");
  const overallFit: Fit = blocking || centralGapRatio >= 0.5
    ? "gap"
    : centralThemes.length > 0 && centralSupported.length === centralThemes.length && centralSupported.every((theme) => theme.fit === "strong")
      ? "strong"
      : "relevant";
  return synthesisPlanSchema.parse({
    overallFit,
    roleContext: {
      mission: decision.successProfile.mission,
      work: decision.successProfile.work,
      successDrivers: decision.successProfile.successDrivers,
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
    interviewQuestions: prose.interviewQuestions.slice(0, 1),
  };
}
