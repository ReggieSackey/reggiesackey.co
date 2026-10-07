import type { CaseStudySeed } from "./seedData";

/** Candidate content. Keep claims aligned with shipped code; no unmeasured latency claims. */
export const portfolioCaseStudy: CaseStudySeed = {
  slug: "reggiesackey-co",
  title: "reggiesackey.co — Evidence-grounded AI job-fit analysis",
  companyOrProject: "reggiesackey.co",
  summary:
    "A portfolio that turns a job description into an evidence-backed hiring narrative, with reviewed capability relationships, targeted retrieval, deterministic validation, and shared abuse controls.",
  sections: [
    {
      slug: "context",
      heading: "Context",
      order: 0,
      body: "A portfolio and application system where a hiring manager can paste a job description and receive an evidence-backed explanation of how my demonstrated experience maps to the role. The product makes the strongest truthful case for the candidate while keeping factual claims anchored to published case-study and profile sections.",
    },
    {
      slug: "responsibilities",
      heading: "Responsibilities",
      order: 1,
      body: `- Built the Next.js application and Convex-backed evidence corpus with stable source and section identities.
- Designed the structured AI evaluation pipeline, deterministic requirement coverage checks, and canonical citation and quote verification.
- Introduced reviewed capability interpretations and capability-to-evidence relationships without copying source bodies.
- Reworked request-time evaluation around a combined structured job/matching decision and synthesis over a compact evidence package.
- Added compatible-result caching, shared rate limits, daily call reservations, expiring concurrency leases, and a provider-failure circuit breaker.
- Separated candidate configuration from application infrastructure and added setup, security, and benchmark documentation.`,
    },
    {
      slug: "evidence-architecture",
      heading: "Canonical facts and reviewed capabilities",
      order: 2,
      body: `Case-study and profile sections remain the factual source of truth. Capabilities describe durable professional abilities; relationship rows point to exact canonical section identities and hold short interpretations, not duplicated source bodies.

An administrator generates proposals from published material, edits their descriptions and references, and explicitly approves, rejects, or merges them. Approval validates the references against current published sections and rejects proposals generated from stale content.`,
    },
    {
      slug: "targeted-analysis",
      heading: "Targeted analysis and cache compatibility",
      order: 3,
      body: `The original path extracted requirements with one GLM call and sent the entire published corpus to a second call. The new path combines structured extraction and capability matching in a small decision call, resolves evidence in application code, and performs one hiring-narrative synthesis call. Both use the existing Z.AI provider; no vector database is required.

Completed results are reused only when the normalized JD, published content, active capability relationships, model settings, candidate configuration, and analysis contract match. Content fingerprints cover section bodies directly, so a profile edit invalidates stale analyses without depending on manually updated timestamps.`,
    },
    {
      slug: "ai-trust-boundaries",
      heading: "AI trust boundaries",
      order: 4,
      body: `Raw job descriptions are untrusted. The final evaluator receives bounded structured requirements and server-selected evidence, with no shell, browsing, tools, or application mutations. Model responses pass JSON parsing, Zod validation, exact requirement coverage, citation identity checks, and quote verification before publication.

New analyses fail closed when citations are forged, quotes cannot be verified, or a non-gap theme lacks grounding. Citation URLs are constructed and encoded in application code; generated narrative text is escaped by React. These checks establish source identity and coverage, not a mathematical guarantee that every interpretation is correct.`,
    },
    {
      slug: "public-endpoint-controls",
      heading: "Public endpoint controls",
      order: 5,
      body: `- Convex-backed token buckets apply burst and hourly quotas across serverless instances, using server-derived HMAC client keys and trusted Vercel request metadata.
- Atomic reservations enforce daily model-call and concurrent-analysis limits before model execution. Failed requests retain their reserved allowance; expired leases recover capacity after interrupted functions.
- Each analysis allows two primary calls and at most one shared structured-output repair. SDK retries are disabled, inputs and outputs are bounded, and consecutive failures open a temporary circuit breaker.
- Telemetry records stage durations, call counts, repair frequency, token counts, and outcome categories without storing request bodies or provider responses in application logs.
- Adversarial tests exercise authorization, citation forgery, malformed requests, stale evidence, cache reuse, rate limits, budgets, and safe rendering. Security does not depend on repository secrecy.`,
    },
    {
      slug: "forkable-engine",
      heading: "A forkable application engine",
      order: 6,
      body: "Candidate name, headline, contact details, and prompt identity live in a shared configuration module. Canonical portfolio content remains separate in Convex and seed modules. Another job seeker can replace that content and rebuild the reviewed capability map without redesigning the evaluation pipeline; the application remains single-candidate rather than becoming a multi-tenant service.",
    },
    {
      slug: "tools",
      heading: "Tools and technologies",
      order: 7,
      body: "Next.js, React, and TypeScript for the application; Convex for canonical evidence, reviewed capabilities, and analysis persistence; WorkOS AuthKit for administration; Vercel AI SDK, Z.AI / GLM, and Zod for structured generation; Convex Rate Limiter for shared quotas; Vitest and convex-test for validation and authorization tests; Vercel for hosting.",
    },
  ],
};
