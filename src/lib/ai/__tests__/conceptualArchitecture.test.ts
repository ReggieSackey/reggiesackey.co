import { describe, expect, it } from "vitest";
import { CANONICAL_CAPABILITIES } from "../../../../convex/canonicalCapabilities";
import { CASE_STUDIES, PROFILE_DOCUMENTS } from "../../../../convex/seedData";
import { buildSynthesisPlan, mergeSynthesis, proseSchema } from "../synthesisPlan";
import type { Decision, Capability } from "../capabilitySchemas";
import type { SourceSection } from "../corpus";
import { createZaiMatcher } from "../matcher";
import { evaluationJobs } from "./evaluationJobs";
import expectations from "./evaluationExpectations.json";

const capabilityIds = Object.fromEntries(CANONICAL_CAPABILITIES.map((item) => [item.slug, item.slug]));
const capabilities: Capability[] = CANONICAL_CAPABILITIES.map((item) => ({ id: item.slug, ...item }));
const sources: SourceSection[] = [
  ...CASE_STUDIES.flatMap((study) => study.sections.map((section) => ({ sourceType: "caseStudy" as const, sourceId: study.slug, sourceTitle: study.title, sectionId: section.slug, sectionHeading: section.heading, body: section.body }))),
  ...PROFILE_DOCUMENTS.flatMap((document) => document.sections.map((section) => ({ sourceType: "profile" as const, sourceId: document.type, sourceTitle: document.title, sectionId: section.slug, sectionHeading: section.heading, body: section.body }))),
];

function decision(overrides: Partial<Decision> = {}): Decision {
  const requirements = [
    { id: "req_1", requirement: "Turn an ambiguous workflow into a working system", importance: "core" as const, category: "delivery" },
    { id: "req_2", requirement: "Connect customer systems and data", importance: "core" as const, category: "integration" },
    { id: "req_3", requirement: "Design reliable AI-assisted workflows", importance: "important" as const, category: "AI" },
  ];
  return {
    successProfile: {
      mission: "Operationalize useful AI workflows for customers",
      work: [{ id: "work_1", activity: "Connect customer systems into working AI workflows", importance: "core" }],
      successDrivers: [{ id: "driver_1", driver: "Move from ambiguity through implementation across customer and technical boundaries", importance: "core" }],
      hardConstraints: [],
    },
    extractedJob: { jobTitle: "Unfamiliar Emerging Title", company: "Example", requirements },
    matches: [
      { capabilityId: capabilityIds["ambiguous-problem-to-working-system"], requirementIds: ["req_1"], score: 0.95 },
      { capabilityId: capabilityIds["integration-workflow-engineering"], requirementIds: ["req_2"], score: 0.95 },
      { capabilityId: capabilityIds["applied-ai-systems"], requirementIds: ["req_3"], score: 0.95 },
      { capabilityId: capabilityIds["cross-boundary-execution"], requirementIds: ["req_1", "req_2"], score: 0.9 },
    ],
    requirementFits: requirements.map((item) => ({ requirementId: item.id, fit: "direct" as const })),
    capabilityRelevance: ["ambiguous-problem-to-working-system", "integration-workflow-engineering", "applied-ai-systems", "cross-boundary-execution"].map((slug) => ({ capabilityId: capabilityIds[slug], relevance: "central" as const, workIds: ["work_1"], successDriverIds: ["driver_1"] })),
    ...overrides,
  };
}

describe("canonical capability ontology", () => {
  it("contains exactly the approved 12 capabilities and only real canonical references", () => {
    expect(CANONICAL_CAPABILITIES.map((item) => item.slug)).toEqual([
      "ambiguous-problem-to-working-system", "zero-to-one-product-building", "whole-system-reasoning", "integration-workflow-engineering", "applied-ai-systems", "rapid-technical-adaptation", "product-interaction-judgment", "platform-extension-abstraction-escape", "production-problem-solving", "data-state-modeling", "ai-enabled-process-design", "cross-boundary-execution",
    ]);
    const identities = new Set(sources.map((source) => `${source.sourceType}:${source.sourceId}:${source.sectionId}`));
    for (const capability of CANONICAL_CAPABILITIES) for (const evidence of capability.evidence)
      expect(identities.has(`${evidence.sourceType}:${evidence.sourceId}:${evidence.sectionId}`), `${capability.slug}: ${evidence.sourceId}/${evidence.sectionId}`).toBe(true);
  });
});

describe("evaluation fixture coverage", () => {
  it("has a human-authored broad expectation for every requested role", () => {
    expect(evaluationJobs).toHaveLength(15);
    expect(Object.keys(expectations).sort()).toEqual(evaluationJobs.map((job) => job.name).sort());
    for (const expected of Object.values(expectations)) {
      expect(["strong candidate", "plausible candidate", "questionable", "poor fit"]).toContain(expected.broadResult);
    }
  });
});

describe("profession-neutral planning", () => {
  it("allows an unfamiliar title to produce strong value themes with capability combinations", () => {
    const plan = buildSynthesisPlan(decision(), capabilities, sources);
    expect(plan.overallFit).toBe("strong");
    expect(plan.themes.some((theme) => theme.capabilityIds.length > 1)).toBe(true);
    expect(plan.themes[0].title).toBe("Working through ambiguity");
  });

  it("does not let the title drive capability selection", () => {
    const first = decision();
    const second = decision({ extractedJob: { ...first.extractedJob, jobTitle: "Product Engineer" } });
    expect(buildSynthesisPlan(first, capabilities, sources)).toEqual(buildSynthesisPlan(second, capabilities, sources));
  });

  it("treats a named-tool difference as transferable rather than automatically a gap", () => {
    const value = decision({ requirementFits: [{ requirementId: "req_1", fit: "transferable" }, { requirementId: "req_2", fit: "direct" }, { requirementId: "req_3", fit: "direct" }] });
    expect(buildSynthesisPlan(value, capabilities, sources).overallFit).toBe("relevant");
  });

  it("does not let an unmatched preferred item turn a directly supported core work theme into a gap", () => {
    const base = decision();
    const requirements = [...base.extractedJob.requirements, { id: "req_4", requirement: "Prior experience in this exact domain", importance: "preferred" as const, category: "domain" }];
    const value = decision({ extractedJob: { ...base.extractedJob, requirements }, requirementFits: [...base.requirementFits!, { requirementId: "req_4", fit: "gap" }] });
    const plan = buildSynthesisPlan(value, capabilities, sources);
    expect(plan.overallFit).not.toBe("gap");
    expect(plan.themes.find((theme) => theme.requirementIds.includes("req_1"))?.fit).toBe("strong");
  });

  it("keeps specialized depth and credentials as gaps despite rapid adaptation", () => {
    const base = decision();
    const constrained = decision({
      successProfile: { ...base.successProfile!, hardConstraints: [{ id: "constraint_1", constraint: "Active California CPA license", severity: "blocking" }] },
      capabilityRelevance: [{ capabilityId: capabilityIds["rapid-technical-adaptation"], relevance: "useful", workIds: ["work_1"], successDriverIds: ["driver_1"] }],
      matches: [{ capabilityId: capabilityIds["rapid-technical-adaptation"], requirementIds: ["req_1"], score: 0.9 }],
      requirementFits: base.extractedJob.requirements.map((item) => ({ requirementId: item.id, fit: "gap" as const })),
    });
    const plan = buildSynthesisPlan(constrained, capabilities, sources);
    expect(plan.overallFit).toBe("gap");
    expect(plan.roleContext.hardConstraints[0].constraint).toContain("CPA");
    expect(plan.materialGapThemeIds.length).toBeGreaterThan(0);
  });

  it("does not substitute technical ownership for people-management history", () => {
    const base = decision();
    const management = decision({
      successProfile: { ...base.successProfile!, hardConstraints: [{ id: "constraint_1", constraint: "Required history managing managers and a forty-person organization", severity: "blocking" }] },
      requirementFits: base.extractedJob.requirements.map((item) => ({ requirementId: item.id, fit: "gap" as const })),
    });
    expect(buildSynthesisPlan(management, capabilities, sources).overallFit).toBe("gap");
  });

  it("treats product prototypes used to test assumptions as transferable in research work", () => {
    const base = decision();
    const requirements = base.extractedJob.requirements.map((item) =>
      item.id === "req_1" ? { ...item, requirement: "Build prototypes to test assumptions" } : item,
    );
    const plan = buildSynthesisPlan(
      decision({
        extractedJob: { ...base.extractedJob, jobTitle: "Emerging Technology Researcher", requirements },
        requirementFits: requirements.map((item) => ({ requirementId: item.id, fit: item.id === "req_1" ? "gap" as const : "direct" as const })),
        matches: [{ capabilityId: capabilityIds["zero-to-one-product-building"], requirementIds: ["req_1"], score: 0.9 }, ...base.matches.slice(1)],
        capabilityRelevance: [{ capabilityId: capabilityIds["zero-to-one-product-building"], relevance: "central", workIds: ["work_1"], successDriverIds: ["driver_1"] }, ...base.capabilityRelevance!.slice(1)],
      }), capabilities, sources,
    );
    expect(plan.themes.find((theme) => theme.requirementIds.includes("req_1"))?.fit).toBe("relevant");
  });

  it("keeps controlled experimental design as a gap without direct support", () => {
    const base = decision();
    const requirements = base.extractedJob.requirements.map((item) =>
      item.id === "req_1" ? { ...item, requirement: "Design rigorous controlled experiments and statistical research" } : item,
    );
    const plan = buildSynthesisPlan(
      decision({
        extractedJob: { ...base.extractedJob, requirements },
        requirementFits: requirements.map((item) => ({ requirementId: item.id, fit: item.id === "req_1" ? "gap" as const : "direct" as const })),
        matches: [{ capabilityId: capabilityIds["zero-to-one-product-building"], requirementIds: ["req_1"], score: 0.9 }, ...base.matches.slice(1)],
      }), capabilities, sources,
    );
    expect(plan.themes.find((theme) => theme.requirementIds.includes("req_1"))?.fit).toBe("gap");
  });

  it("keeps senior platform engineering and substantial PM management as gaps", () => {
    const base = decision();
    for (const constraint of [
      "Required direct ownership of Kubernetes, Terraform, Kafka, and Linux networking",
      "Required history managing a substantial organization of product managers",
    ]) {
      const plan = buildSynthesisPlan(decision({
        successProfile: { ...base.successProfile!, hardConstraints: [{ id: "constraint_1", constraint, severity: "blocking" }] },
      }), capabilities, sources);
      expect(plan.overallFit).toBe("gap");
    }
  });

  it("uses short application-owned titles rather than full requirements", () => {
    const base = decision();
    const plan = buildSynthesisPlan(base, capabilities, sources);
    expect(plan.themes.every((theme) => !base.extractedJob.requirements.some((requirement) => requirement.requirement === theme.title))).toBe(true);
    expect(new Set(plan.themes.map((theme) => theme.title)).size).toBe(plan.themes.length);
  });

  it("excludes well-supported capabilities when the decision marks them irrelevant", () => {
    const plan = buildSynthesisPlan(decision(), [...capabilities, { id: "irrelevant", slug: "irrelevant", title: "Impressive but irrelevant", description: "Well supported elsewhere", tags: [], evidence: CANONICAL_CAPABILITIES[0].evidence }], sources);
    expect(plan.themes.flatMap((theme) => theme.capabilityIds)).not.toContain("irrelevant");
  });

  it("keeps application ownership of themes and citations", () => {
    const plan = buildSynthesisPlan(decision(), capabilities, sources);
    const prose = { overallNarrative: "Useful toward the mission.", themeNarratives: Object.fromEntries(plan.themes.map((theme) => [theme.id, "Grounded value narrative."])), interviewQuestions: [] };
    const fit = mergeSynthesis(plan, prose);
    expect(fit.themes.map((theme) => theme.id)).toEqual(plan.themes.map((theme) => theme.id));
    expect(fit.themes.every((theme) => theme.fit === "gap" || theme.citations.length > 0)).toBe(true);
    expect(() => mergeSynthesis(plan, { ...prose, themeNarratives: { invented: "Invented" } })).toThrow("Synthesis theme contract mismatch");
  });
});

describe("public prose contract", () => {
  const valid = {
    overallNarrative: "I've done much of this work in product settings.",
    themeNarratives: { theme_1: "I built a working version to test what mattered." },
    interviewQuestions: [] as string[],
  };
  it("accepts first person prose with zero or one question", () => {
    expect(proseSchema.safeParse(valid).success).toBe(true);
    expect(proseSchema.safeParse({ ...valid, interviewQuestions: ["Can I use my product-building approach in this setting?"] }).success).toBe(true);
  });
  it("rejects third person, em dashes, URLs, internal IDs, duplicates, and multiple questions", () => {
    for (const text of ["Reg built this.", "He built this.", "I built this — quickly.", "I used https://example.test.", "I handled req_1."])
      expect(proseSchema.safeParse({ ...valid, overallNarrative: text }).success).toBe(false);
    expect(proseSchema.safeParse({ ...valid, themeNarratives: { theme_1: valid.overallNarrative } }).success).toBe(false);
    expect(proseSchema.safeParse({ ...valid, interviewQuestions: ["Can I do this?", "Can I do that?"] }).success).toBe(false);
  });
});

describe("decision normalization", () => {
  it("drops stated preferences from hard constraints and caps prominent capabilities", async () => {
    const base = decision();
    const extraRelevance = CANONICAL_CAPABILITIES.slice(0, 10).map((item) => ({ capabilityId: item.slug, relevance: "useful" as const, workIds: ["work_1"], successDriverIds: ["driver_1"] }));
    const raw = { ...base, successProfile: { ...base.successProfile!, hardConstraints: [{ id: "constraint_1", constraint: "Five years in this exact title is preferred, not mandatory", severity: "material" as const }] }, capabilityRelevance: extraRelevance, matches: [] };
    const parsed = await createZaiMatcher(async () => JSON.stringify(raw)).interpretAndMatch("Five years in this exact title is preferred, not mandatory.", capabilities);
    expect(parsed.successProfile?.hardConstraints).toEqual([]);
    expect(parsed.capabilityRelevance).toHaveLength(8);
  });

  it("preserves an explicitly required professional credential", async () => {
    const base = decision();
    const raw = { ...base, successProfile: { ...base.successProfile!, hardConstraints: [{ id: "constraint_1", constraint: "Active California CPA license", severity: "blocking" as const }] } };
    const parsed = await createZaiMatcher(async () => JSON.stringify(raw)).interpretAndMatch("An active California CPA license is legally required.", capabilities);
    expect(parsed.successProfile?.hardConstraints).toHaveLength(1);
  });

  it("removes a skill the employer explicitly says is not required", async () => {
    const base = decision();
    const requirements = [...base.extractedJob.requirements, { id: "req_4", requirement: "Machine learning model training", importance: "preferred" as const, category: "ML" }];
    const raw = { ...base, extractedJob: { ...base.extractedJob, requirements }, requirementFits: [...base.requirementFits!, { requirementId: "req_4", fit: "gap" as const }] };
    const parsed = await createZaiMatcher(async () => JSON.stringify(raw)).interpretAndMatch("Build applied AI systems. Machine learning model training is not required.", capabilities);
    expect(parsed.extractedJob.requirements.map((item) => item.id)).not.toContain("req_4");
  });
});
