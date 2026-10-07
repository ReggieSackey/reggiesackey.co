import { afterEach, describe, expect, it, vi } from "vitest";
import { createJevMatcher, unmatchedRequirementIds } from "../jevMatcher";
import { buildSynthesisPlan, mergeSynthesis } from "../synthesisPlan";

const source = { sourceType: "caseStudy" as const, sourceId: "project", sourceTitle: "Project", sectionId: "delivery", sectionHeading: "Delivery", body: "Built and shipped a production application with customers." };
const capabilities = [{ id: "cap_delivery", slug: "delivery", title: "Product delivery", description: "Owns products through production delivery", tags: ["product"], evidence: [{ sourceType: source.sourceType, sourceId: source.sourceId, sectionId: source.sectionId, note: "Production delivery" }] }];

afterEach(() => vi.unstubAllEnvs());

describe("jev-v1", () => {
  it("maps typed answers into the validated Decision contract and preserves unmatched requirements", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "test-key");
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { questions: Record<string, unknown> };
      expect(Object.keys(body.questions)).toHaveLength(18);
      return new Response(JSON.stringify({
        model: "jev-latest",
        answers: {
          keep_0: { type: "noul", noul: 0.99 }, importance_0: { type: "choice", choice: "core", confidence: 0.9 }, category_0: { type: "choice", choice: "product", confidence: 0.9 }, primary_0: { type: "choice", choice: "cap_delivery", confidence: 0.88 }, secondary_0: { type: "choice", choice: "none", confidence: 0.9 },
          keep_1: { type: "noul", noul: 0.99 }, importance_1: { type: "choice", choice: "important", confidence: 0.9 }, category_1: { type: "choice", choice: "collaboration", confidence: 0.9 }, primary_1: { type: "choice", choice: "none", confidence: 0.8 }, secondary_1: { type: "choice", choice: "none", confidence: 0.8 },
          keep_2: { type: "noul", noul: 0.99 }, importance_2: { type: "choice", choice: "preferred", confidence: 0.9 }, category_2: { type: "choice", choice: "domain", confidence: 0.9 }, primary_2: { type: "choice", choice: "none", confidence: 0.8 }, secondary_2: { type: "choice", choice: "none", confidence: 0.8 },
        }, usage: { input_tokens: 100, output_tokens: 15 },
      }), { status: 200, headers: { "content-type": "application/json" } });
    });
    const decision = await createJevMatcher(fetcher as typeof fetch).interpretAndMatch(
      "Own product delivery from idea through production. Collaborate closely with design and customers. Experience in the healthcare domain is preferred.",
      capabilities,
    );
    expect(decision.extractedJob.requirements).toHaveLength(3);
    expect(decision.matches).toEqual([{ capabilityId: "cap_delivery", requirementIds: ["req_1"], score: 0.88 }]);
    expect(unmatchedRequirementIds(decision)).toEqual(["req_2", "req_3"]);
  });
});

describe("typed synthesis plan", () => {
  it("allocates every requirement once and rejects prose outside the planned theme set", () => {
    const decision = {
      extractedJob: { jobTitle: null, company: null, requirements: [1, 2, 3].map((n) => ({ id: `req_${n}`, requirement: `Requirement ${n}`, importance: "core" as const, category: "product" })) },
      matches: [{ capabilityId: "cap_delivery", requirementIds: ["req_1"], score: 0.9 }],
    };
    const plan = buildSynthesisPlan(decision, capabilities, [source]);
    expect(plan.themes.flatMap((theme) => theme.requirementIds).sort()).toEqual(["req_1", "req_2", "req_3"]);
    expect(new Set(plan.themes.flatMap((theme) => theme.requirementIds)).size).toBe(3);
    expect(() => mergeSynthesis(plan, {
      overallNarrative: "Assessment",
      themeNarratives: { theme_999: "Narrative" },
      interviewQuestions: [],
    })).toThrow("Synthesis theme contract mismatch");
  });
});
