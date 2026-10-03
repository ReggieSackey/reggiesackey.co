import type { AnalysisResult } from "./analysis";

/**
 * Development fixture for /analysis/dev-fixture — no AI is involved.
 * Shaped exactly like the pipeline's AnalysisResult contract, citing
 * the seeded content by section ID only.
 */
export const DEV_ANALYSIS: AnalysisResult = {
  jobTitle: "Senior Product Engineer",
  company: "Acme",
  overallAssessment: {
    fit: "strong",
    narrative:
      "Reg is a product-minded engineer with a strong record of taking ambiguous problems from idea to production. His experience spans marketplace systems, APIs and integrations, production data workflows, full-stack application development, and AI-native product engineering. The strongest match for this role is his combination of technical ownership, product judgment, rapid learning, and comfort working across system boundaries. The main difference to weigh: deep cloud infrastructure work is not his primary background.",
  },
  themes: [
    {
      id: "theme_1",
      title: "AI-native product engineering",
      fit: "strong",
      narrative:
        "The CModel strategic assistant is direct evidence: a context-aware assistant with tool calling, web search, and organization-specific context, built with the Vercel AI SDK. Reg didn't just wrap an LLM in chat UI — the work involved schema design, validation, and failure handling so model output could become application state.",
      requirementIds: ["req-1"],
      citations: [
        {
          sourceType: "caseStudy",
          sourceId: "cmodel-strategic-assistant",
          sectionId: "strategic-assistant",
        },
        {
          sourceType: "caseStudy",
          sourceId: "cmodel-strategic-assistant",
          sectionId: "structured-generation",
        },
        {
          sourceType: "profile",
          sourceId: "technical",
          sectionId: "strongest-areas",
        },
      ],
    },
    {
      id: "theme_2",
      title: "End-to-end ownership and shipping",
      fit: "strong",
      narrative:
        "At CModel, Reg owned the implementation path from ambiguous product requirements through architecture and production behavior for the strategic assistant, including how it fit into the existing product rather than behaving like a generic chatbot.",
      requirementIds: ["req-2", "req-3"],
      citations: [
        {
          sourceType: "caseStudy",
          sourceId: "cmodel-strategic-assistant",
          sectionId: "email-signals",
        },
        {
          sourceType: "caseStudy",
          sourceId: "cmodel-strategic-assistant",
          sectionId: "overview",
        },
      ],
    },
    {
      id: "theme_3",
      title: "Application and backend depth",
      fit: "relevant",
      narrative:
        "Reg's backend work is strongest at the application layer: data modeling on Postgres/Supabase, server-side workflows, integrations, and production debugging. Large-scale distributed systems and deep cloud engineering are explicitly limited areas — relevant here, but not the core of his record.",
      requirementIds: ["req-4"],
      citations: [
        {
          sourceType: "profile",
          sourceId: "technical",
          sectionId: "limited-experience",
        },
        {
          sourceType: "profile",
          sourceId: "technical",
          sectionId: "working-experience",
        },
      ],
    },
  ],
  materialGaps: [],
  interviewQuestions: [
    "Walk me through a technically difficult system you owned end to end and the tradeoffs you made.",
    "How do you decide when AI belongs in a product, and how do you make model output reliable enough to become application state?",
  ],
};
