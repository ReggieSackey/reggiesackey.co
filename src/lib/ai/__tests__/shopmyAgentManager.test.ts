import { describe, expect, it } from "vitest";
import { evaluateCandidateFit } from "@/lib/ai/modelCalls";
import { PUBLIC_SYNTHESIS_PROMPT } from "@/lib/ai/synthesisPrompt";
import type { ExtractedJob } from "@/lib/ai/schemas";

// Regression tests for the ShopMy Agent Manager fit report.
//
// The first published report manufactured false gaps: it downgraded
// CModel's managed agent fleet and evaluations to "just a development
// process", implied the creator economy was adjacency rather than
// experience, and added a gratuitous formal-PM-title caveat. These
// tests lock in the corrected behavior: evidence combines across roles
// (CModel proves agent-fleet/eval management, MusicBreakr proves
// creator-economy product experience), and neither the saved evidence
// nor the saved report may resurrect the false gaps.


const MINIMAL_JOB: ExtractedJob = {
  jobTitle: "Agent Manager",
  company: "ShopMy",
  requirements: [
    {
      id: "req_1",
      requirement: "Manage a fleet of AI agents for creators and brands",
      importance: "core",
      category: "AI product",
    },
  ],
};

async function captureEvaluateSystem(): Promise<string> {
  let seenSystem = "";
  await evaluateCandidateFit(
    { extractedJob: MINIMAL_JOB, sources: [] },
    async ({ system }) => {
      seenSystem = system;
      return JSON.stringify({
        overallAssessment: { fit: "strong", narrative: "ok" },
        themes: [
          {
            id: "theme_1",
            title: "Agent fleet management",
            fit: "strong",
            narrative: "ok",
            requirementIds: ["req_1"],
            citations: [],
          },
          {
            id: "theme_2",
            title: "Creator economy",
            fit: "strong",
            narrative: "ok",
            requirementIds: ["req_2"],
            citations: [],
          },
          {
            id: "theme_3",
            title: "Product ownership",
            fit: "strong",
            narrative: "ok",
            requirementIds: ["req_3"],
            citations: [],
          },
        ],
        materialGaps: [],
        interviewQuestions: [],
      });
    },
  );
  return seenSystem;
}

// --- Saved candidate evidence ---------------------------------------

describe("ShopMy regression: saved evidence", () => {
  it("CModel evidence explicitly captures managed in-product agentic flows and production ownership", async () => {
    const { CASE_STUDIES } = await import("@convex/seedData");
    const cs = CASE_STUDIES.find((c) => c.slug === "cmodel-strategic-assistant")!;
    const resp = cs.sections.find((s) => s.slug === "responsibilities")!;
    const lower = resp.body.toLowerCase();
    expect(lower).toContain("owned the strategic assistant in production");
    expect(lower).toContain("agentic flows");
    expect(lower).toContain("evals");
  });

  it("CModel evidence explicitly captures managed agent fleet and evaluation, not downgraded to a development process", async () => {
    const { CASE_STUDIES } = await import("@convex/seedData");
    const cs = CASE_STUDIES.find((c) => c.slug === "cmodel-strategic-assistant")!;
    const agentic = cs.sections.find((s) => s.slug === "agentic-engineering")!;
    expect(agentic.body).toContain("initiated and ran");
    expect(agentic.body).toContain(
      "Managing this agent fleet was my direct responsibility",
    );
    expect(agentic.body).toContain(
      "evaluation of AI behavior where deterministic tests are insufficient",
    );
    // the old downgrade framing must not return
    expect(agentic.body).not.toContain("I helped move");
    expect(agentic.body).not.toContain("I also helped establish");
  });

  it("CModel evidence captures product outcome ownership", async () => {
    const { CASE_STUDIES } = await import("@convex/seedData");
    const cs = CASE_STUDIES.find((c) => c.slug === "cmodel-strategic-assistant")!;
    const resp = cs.sections.find((s) => s.slug === "responsibilities")!;
    expect(resp.body).toContain(
      "Owned an email-to-decision-intelligence workflow from product definition through production",
    );
    const impact = cs.sections.find((s) => s.slug === "impact")!;
    expect(impact.body).toContain(
      "Shipped CModel's strategic assistant as production functionality",
    );
  });

  it("MusicBreakr evidence states creator-economy product/marketplace experience with major record labels", async () => {
    const { CASE_STUDIES } = await import("@convex/seedData");
    const mb = CASE_STUDIES.find((c) => c.slug === "musicbreakr")!;
    const allText = [
      mb.summary,
      ...mb.sections.flatMap((s) => [s.heading, s.body, ...(s.tags ?? [])]),
    ]
      .join("\n")
      .toLowerCase();
    expect(allText).toContain("creator-economy");
    expect(allText).toContain("major record labels");
    // no specific client names
    expect(allText).not.toContain("mass appeal");
    expect(allText).not.toContain("appliedcax");
  });
});
