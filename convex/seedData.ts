import { portfolioCaseStudy } from "./portfolioCaseStudy";
/**
 * Canonical dev-seed content: the CModel case study, the MusicBreakr case
 * study, and the Technical Profile. Plain module — no convex runtime
 * imports — so it can be unit tested directly and consumed by
 * convex/seed.ts.
 *
 * IMPORTANT: case study slug and section slugs are STABLE CONTRACTS.
 * The AI evaluator cites them (sourceId/sectionId), the /work and
 * /profile pages render them, and existing analyses reference them.
 * Rename nothing here without a migration.
 *
 * EDITORIAL MODEL — CASE STUDIES ARE ENGINEERING EVIDENCE, NOT
 * BUSINESS CASES. Each project is organized conceptually around
 * Context → Responsibilities → Engineering & Product Work → Tools &
 * Technologies → Impact, represented through the existing section
 * model (no new DB fields). Bodies are bullet-heavy: blocks of lines
 * starting with "- " render as lists (see SectionBody.tsx); paragraphs
 * remain supported. For future projects:
 *   1. Give enough context to understand the product.
 *   2. State responsibilities as technically dense, scannable bullets.
 *   3. Organize deeper content around systems/problems actually built.
 *   4. Name verified technical mechanisms and technologies.
 *   5. Explain constraints and tradeoffs.
 *   6. Show product judgment where it changed implementation.
 *   7. Include tools explicitly.
 *   8. Separate impact from responsibilities.
 *   9. Prefer direct evidence over self-assessment.
 *  10. Do not hide technically meaningful details behind generic
 *      language ("integrated systems", "worked with APIs").
 *  11. Do not inflate abstraction-level experience into unsupported
 *      lower-level technology claims.
 *  12. Give prominence based on engineering complexity/judgment, not
 *      how impressive a technology name sounds.
 * Bullets should combine OWNERSHIP + ENGINEERING CHALLENGE + TECHNICAL
 * MECHANISM + CONSTRAINT/DECISION + PRODUCT PURPOSE.
 *
 * Bubble-relevant work specifically: do not hide Bubble, do not
 * apologize for it, do not defensively insist it "counts". Explain
 * what was built, what the abstraction enabled, the constraints
 * encountered, the engineering reasoning those constraints required,
 * and when JavaScript/APIs/plugins/external services/other
 * architectures became necessary. Never imply a "graduated to real
 * code" progression. Never equate platform-runtime exposure (e.g.
 * Bubble's Node.js-backed server environment) with independently
 * building that technology. Do NOT mechanically add a Bubble section
 * to every future case study — only where it materially affected the
 * story.
 */

export type SectionSeed = {
  slug: string;
  heading: string;
  body: string;
  order: number;
  summary?: string;
  tags?: string[];
};

export type CaseStudySeed = {
  slug: string;
  title: string;
  companyOrProject: string;
  summary: string;
  sections: SectionSeed[];
};

export type ProfileDocumentSeed = {
  type: string;
  title: string;
  sections: SectionSeed[];
};

export const CASE_STUDIES: CaseStudySeed[] = [
  portfolioCaseStudy,
  // ==================================================================
  // CMODEL
  // ==================================================================
  {
    slug: "cmodel-strategic-assistant",
    title: "CModel — AI application engineering and decision intelligence",
    companyOrProject: "CModel",
    summary:
      "CModel builds decision-intelligence software for economic development organizations. I have worked across the product from its early prototypes through production, with primary responsibility for AI features, external integrations, and workflows spanning application logic, data, and third-party systems. My recent work includes a standalone AI assistant built with Next.js and the Vercel AI SDK, an email-to-decision-intelligence pipeline, integrations across Microsoft 365 and other business systems, and an agentic development process designed to let a small team build and review software effectively with coding agents.",
    sections: [
      {
        slug: "overview",
        heading: "Context: decision-intelligence software at CModel",
        order: 1,
        body: `CModel builds decision-intelligence software for economic development organizations. I have worked across the product from its early prototypes through production, with primary responsibility for AI features, external integrations, and workflows spanning application logic, data, and third-party systems.

My recent work includes a standalone AI assistant built with Next.js and the Vercel AI SDK, an email-to-decision-intelligence pipeline, integrations across Microsoft 365 and other business systems, and an agentic development process designed to let a small team build and review software effectively with coding agents.`,
        summary:
          "Decision-intelligence product; worked from early prototypes through production with primary responsibility for AI features, integrations, and cross-system workflows.",
        tags: ["cmodel", "decision-intelligence", "product-engineering", "ai"],
      },
      {
        slug: "responsibilities",
        heading: "Responsibilities",
        order: 2,
        body: `- Built CModel's strategic assistant as a standalone TypeScript/Next.js application using the Vercel AI SDK.

- Implemented tool calling against application data and external information sources.

- Designed page-level and organization-level context supplied to models at runtime.

- Implemented schema-constrained generation for model output consumed as application state.

- Built validation and failure handling around non-conforming model output.

- Owned an email-to-decision-intelligence workflow from product definition through production.

- Implemented and maintained OAuth/API integrations across Microsoft 365 and other third-party systems.

- Worked across successive application architectures as the product moved from Bubble prototypes to a conventional TypeScript/Supabase stack.

- Initiated an agentic development process combining shared technical context, team-wide AI-assisted feature development, engineer review, automated testing, and CI/CD controls.`,
        summary:
          "Standalone Next.js assistant on the Vercel AI SDK; tool calling, context design, schema-constrained generation, email pipeline ownership, OAuth integrations, agentic development process.",
        tags: [
          "ownership",
          "ai",
          "nextjs",
          "vercel-ai-sdk",
          "integrations",
          "agentic-development",
          "product-engineering",
        ],
      },
      {
        slug: "strategic-assistant",
        heading: "Strategic assistant",
        order: 3,
        body: `CModel contains substantial information about an organization's strategy, operations, and current work. The assistant needed access to that context without placing the entire application state into every prompt.

I built the assistant as a standalone Next.js application connected to CModel's existing product environment.

Its runtime context has two main sources:

- Provided context: organization and page state relevant to the current interaction.
- Tool calls: application data or external information retrieved when needed.

This keeps immediately relevant state in context while allowing the model to retrieve additional data selectively. Web search is available for questions requiring information outside CModel.`,
        summary:
          "Standalone Next.js assistant with provided organization/page context and selective tool calls rather than prompt-stuffing application state.",
        tags: ["strategic-assistant", "tool-calling", "context", "ai", "vercel-ai-sdk"],
      },
      {
        slug: "structured-generation",
        heading: "Structured generation",
        order: 4,
        body: `Some model output needs to become application state rather than remain conversational text.

For these workflows, I use schema-constrained generation:

- Define the application data structure.
- Generate against that structure.
- Validate the result.
- Accept, retry, repair, or reject based on validation.

Strategic-plan generation uses this pattern. The model returns structured data that the application can render and manipulate directly.

This creates an explicit boundary between probabilistic model output and deterministic application state.`,
        summary:
          "Schema-constrained generation with explicit validation and failure handling — model output becomes deterministic application state.",
        tags: ["structured-outputs", "schema", "validation", "generation"],
      },
      {
        slug: "email-signals",
        heading: "Email signals",
        order: 5,
        body: `I owned a workflow that converts information from authorized organizational email into strategic context.

The system extracts relevant signals from permitted email data, represents them as application context, and passes that context into AI workflows that generate strategic information, scenarios, and recommendations.

The main design problem is signal selection. Email contains far more information than is useful for a strategic decision, so the system must identify relevant context without treating raw inbox contents as model context.`,
        summary:
          "Owned email-to-decision-intelligence end to end; the hard problem was signal selection, not raw data movement.",
        tags: ["ownership", "ai-workflow", "email", "signal-selection"],
      },
      {
        slug: "integrations",
        heading: "Integrations",
        order: 6,
        body: `I have implemented and maintained integrations with:

- Microsoft 365 and Outlook through Microsoft Graph;
- SharePoint;
- Teams;
- DocuSign;
- HubSpot;
- Monday;
- Harvest;
- Freshdesk;
- Google services.

This work includes OAuth flows, token lifecycle, REST APIs, pagination, external data models, error handling, and mapping third-party state into CModel's application model.

Integration failures often occur at system boundaries: expired authorization, unexpected external state, API behavior that differs from documentation, or disagreement between local and remote data. Debugging requires reasoning across both systems rather than treating the API call as an isolated unit.`,
        summary:
          "Production integrations across nine external systems: OAuth, token lifecycle, pagination, external data models, boundary debugging.",
        tags: ["integrations", "oauth", "apis", "microsoft-graph"],
      },
      {
        slug: "architecture-evolution",
        heading: "Architecture evolution",
        order: 7,
        body: `CModel's first prototypes were built in Bubble. That was useful while the product was changing quickly and the objective was to test product behavior with minimal implementation cost.

As the product matured, we moved away from Bubble. The current application uses a conventional TypeScript stack with Supabase as part of the backend environment.

I worked across that transition. It required separating product behavior from implementation details, deciding what should be preserved or redesigned, and moving functionality into systems with greater control over application logic, data, integrations, and AI behavior.

The strategic assistant followed the same pattern of choosing an implementation boundary based on the requirements: it became a standalone Next.js application while remaining connected to the broader CModel product and data environment.`,
        summary:
          "Worked across the move from Bubble prototypes to a TypeScript/Supabase stack, choosing implementation boundaries by requirement.",
        tags: [
          "bubble",
          "typescript",
          "supabase",
          "architecture",
          "technical-evolution",
        ],
      },
      {
        slug: "agentic-engineering",
        heading: "Agentic engineering and development process",
        order: 8,
        body: `I helped move CModel toward an agentic development model in which implementation was no longer restricted to engineers writing code directly.

I initiated a process of documenting product behavior, architecture, conventions, and technical decisions in shared technical documents. These reduce context loss between people and provide coding agents with persistent context about the systems they modify.

I also helped establish a workflow in which people across the company can contribute to feature development using coding agents, with engineers responsible for technical review and production quality. Product knowledge and feature ideas can originate anywhere on the team; implementation can be explored with agents; engineers control architecture, validation, and release.

Supporting this model required stronger engineering controls. I contributed to:

- CI/CD pipelines and automated validation;
- code-review practices for human- and agent-generated changes;
- testing strategy and regression protection;
- technical documentation designed for both human and agent consumption;
- task decomposition, prompting, and context design for coding agents;
- model and reasoning-effort selection based on task complexity and cost;
- evals for AI behavior where deterministic tests are insufficient.

The objective is not to remove engineers from development. It is to move more engineering effort toward specification, architecture, review, and verification while allowing more of the organization to participate in implementation.

In my own development workflow, I use the same model: define the problem and constraints, provide the necessary context, make acceptance criteria executable where possible, inspect failures, and adjust the task, context, or model rather than treating repeated generation as progress.`,
        summary:
          "Initiated agentic development: shared technical context, team-wide agent-assisted implementation, engineer-controlled review, testing, CI/CD, and evals.",
        tags: [
          "agentic-development",
          "coding-agents",
          "ci-cd",
          "testing",
          "evals",
          "process",
        ],
      },
      {
        slug: "tools",
        heading: "Stack",
        order: 9,
        body: `- Application: TypeScript, JavaScript, React, Next.js.

- AI: Vercel AI SDK, tool calling, structured generation, web search, context design, evals.

- Backend and data: Supabase, REST APIs, OAuth.

- Integrations: Microsoft Graph, SharePoint, Teams, DocuSign, HubSpot, Monday, Harvest, Freshdesk, Google services.

- Engineering workflow: coding agents, CI/CD, automated tests, static analysis, code review, evals, structured task specifications.`,
        summary:
          "TypeScript/Next.js + Vercel AI SDK + Supabase + nine integrations + agent-native engineering workflow.",
        tags: [
          "typescript",
          "nextjs",
          "react",
          "vercel-ai-sdk",
          "supabase",
          "oauth",
          "integrations",
          "coding-agents",
        ],
      },
      {
        slug: "impact",
        heading: "Impact",
        order: 10,
        body: `- Shipped CModel's strategic assistant as production functionality.

- Built an email-to-decision-intelligence pipeline from initial product definition through production.

- Helped establish AI as a core application capability rather than an isolated interface feature.

- Implemented and maintained integrations across roughly nine external systems.

- Helped move the product from rapid Bubble prototypes to a conventional application architecture as its technical requirements matured.

- Helped expand software development beyond the engineering team while strengthening the documentation, review, testing, and delivery controls around AI-generated changes.`,
        summary:
          "Assistant shipped to production; email pipeline shipped; nine-system integration surface; agentic development model with strengthened controls.",
        tags: ["impact", "production", "ai", "integrations", "process"],
      },
    ],
  },
  // ==================================================================
  // MUSICBREAKR
  // ==================================================================
  {
    slug: "musicbreakr",
    title: "MusicBreakr — Marketplace and social attribution systems",
    companyOrProject: "MusicBreakr",
    summary:
      "MusicBreakr was a two-sided marketplace where artists and music companies hired creators to promote music on social platforms. I worked across the production application, with primary responsibility for social attribution, payments, permissions, external integrations, and backend workflows. The product served thousands of users, processed hundreds of thousands of dollars in marketplace transactions, and was used by customers including Mass Appeal.",
    sections: [
      {
        slug: "overview",
        heading: "Context: a two-sided music marketplace",
        order: 1,
        body: `MusicBreakr was a two-sided marketplace where artists and music companies hired creators to promote music on social platforms. I worked across the production application, with primary responsibility for social attribution, payments, permissions, external integrations, and backend workflows.

The product served thousands of users, processed hundreds of thousands of dollars in marketplace transactions, and was used by customers including Mass Appeal.`,
        summary:
          "Two-sided marketplace, thousands of users, hundreds of thousands of dollars in transactions, customers including Mass Appeal; primary responsibility for attribution, payments, permissions, integrations, and backend workflows.",
        tags: [
          "marketplace",
          "product-engineering",
          "production",
          "music",
          "social-platforms",
        ],
      },
      {
        slug: "responsibilities",
        heading: "Responsibilities",
        order: 2,
        body: `- Built and operated social attribution across Instagram, TikTok, YouTube, and Twitter/X.

- Designed recurring ingestion workflows subject to third-party API quotas, execution limits, scheduling constraints, and compute cost.

- Mapped heterogeneous external API data onto MusicBreakr's internal creator, promotion, and campaign models.

- Designed data structures and access patterns for campaign reporting as ingestion volume increased.

- Implemented Stripe Connect for connected-account onboarding, marketplace transactions, and payouts.

- Implemented delegated account access for managers, labels, and collaborators.

- Extended Bubble with JavaScript and external services where platform constraints required a different implementation boundary.

- Debugged production failures across application state, backend workflows, payment systems, and third-party APIs.`,
        summary:
          "Attribution ownership, recurring ingestion under API/platform constraints, Stripe Connect, delegated access, production debugging.",
        tags: [
          "ownership",
          "attribution",
          "integrations",
          "marketplace",
          "payments",
          "authorization",
          "production",
        ],
      },
      {
        slug: "social-attribution",
        heading: "Social attribution",
        order: 3,
        body: `MusicBreakr needed to determine whether contracted promotions occurred and report their performance over time.

I worked on the system that ingested activity from Instagram, TikTok, YouTube, and Twitter/X and associated external records with internal creators, promotions, and campaigns.

The platforms exposed different identifiers, response schemas, access models, and rate limits. Ingestion therefore required a normalization layer between external platform data and MusicBreakr's application model. The resulting records supported campaign views, creator views, and performance rollups.

Because campaign metrics changed after publication, ingestion ran on recurring server-side workflows rather than request-time fetches.`,
        summary:
          "Ingesting activity from four social platforms, normalizing it onto the internal model, and keeping campaign performance current.",
        tags: [
          "attribution",
          "social-platforms",
          "apis",
          "data-ingestion",
          "external-data",
          "normalization",
        ],
      },
      {
        slug: "data-ingestion",
        heading: "Ingestion and performance",
        order: 4,
        body: `Recurring ingestion was constrained by API quotas and Bubble's server-side execution model. Refresh frequency, batch size, scheduling, and query patterns affected both data freshness and operating cost.

As volume increased, I reworked workflows and data structures that had become inefficient at production scale. This included:

- splitting work across scheduled workflows;
- adjusting refresh frequency and ingestion volume;
- restructuring data around application access patterns;
- moving selected logic into JavaScript or external services;
- changing client/server boundaries where appropriate.

Bubble provided the application runtime and server-side workflow system. Its abstractions reduced implementation overhead, while its execution and data-access constraints still required explicit decisions about scheduling, computation, storage, and system boundaries.`,
        summary:
          "Recurring Bubble server-side workflows under API quotas, execution limits, scheduling, and compute cost — reworked as volume grew.",
        tags: [
          "background-processing",
          "server-side",
          "scheduling",
          "rate-limits",
          "ingestion",
          "bubble",
          "performance",
          "data-modeling",
        ],
      },
      {
        slug: "stripe-connect",
        heading: "Marketplace payments",
        order: 5,
        body: `I implemented MusicBreakr's Stripe Connect integration for marketplace payments.

The application tracked connected-account onboarding, payout eligibility, and transaction state while coordinating that state with Stripe. Payment behavior had to remain correct when a connected account was incomplete, a payout was unavailable, or Stripe and the application disagreed about transaction state.

This supported the marketplace flow from campaign funding through creator payment.`,
        summary:
          "Connected-account onboarding, payout eligibility, and application/Stripe transaction-state coordination for marketplace payments.",
        tags: ["stripe", "stripe-connect", "payments", "marketplace-payments", "integrations"],
      },
      {
        slug: "delegated-access",
        heading: "Authorization",
        order: 6,
        body: `I implemented delegated account access for managers, labels, and collaborators.

The authorization model allowed one user to act on behalf of another account without sharing credentials. Permissions controlled which account resources and operations were available to a delegate, with corresponding application behavior for each role.`,
        summary:
          "Delegated account access: acting on behalf of another account without shared credentials, with role-scoped permissions.",
        tags: ["authorization", "permissions", "delegated-access", "account-management"],
      },
      {
        slug: "production-ownership",
        heading: "Production engineering",
        order: 7,
        body: `Production failures frequently crossed system boundaries. Debugging required comparing application state, backend workflow state, and the state held by external services such as Stripe or social APIs.

I worked on these systems while they were serving active customers, so changes had to preserve existing marketplace, payment, and ingestion behavior.`,
        summary:
          "Debugging across application state, backend workflows, and external systems without breaking live customer behavior.",
        tags: ["debugging", "production", "ownership", "third-party-integrations"],
      },
      {
        slug: "tools",
        heading: "Stack",
        order: 8,
        body: `- Application: Bubble, JavaScript.

- Backend processing: Bubble server-side workflows on its Node.js-backed runtime.

- Payments: Stripe Connect.

- Integrations: Instagram, TikTok, YouTube, and Twitter/X APIs.

- Architecture: recurring jobs, third-party API integration, data modeling, authorization, marketplace payments.`,
        summary:
          "Bubble + JavaScript + Stripe Connect + four social-platform APIs; backend processing on Bubble's Node.js-backed platform runtime.",
        tags: ["bubble", "javascript", "nodejs", "stripe-connect", "social-apis"],
      },
      {
        slug: "impact",
        heading: "Impact",
        order: 9,
        body: `- Served thousands of marketplace users.

- Processed hundreds of thousands of dollars in transactions.

- Supported customers including Mass Appeal.

- Provided recurring campaign attribution across four social platforms.

- Operated marketplace payments, delegated access, and social-data ingestion in production.`,
        summary:
          "Thousands of users, hundreds of thousands of dollars in transactions, customers including Mass Appeal, recurring attribution across four platforms.",
        tags: ["marketplace", "production", "users", "transactions", "customers"],
      },
    ],
  },
  // ==================================================================
  // REACCORD
  // ==================================================================
  {
    slug: "reaccord",
    title: "Reaccord — Building an adaptive consumer application",
    companyOrProject: "Reaccord",
    summary:
      "Reaccord is an independent consumer application I built for behavior change. It turns personal goals into plans, repeatable actions, reflection, and feedback over time. I designed and built the product end to end: separate Next.js web and Expo/React Native mobile applications over a shared Convex backend, a personalized daily interface derived from each user's state, and AI-assisted planning and coaching workflows built model-independently around persistent user context.",
    sections: [
      {
        slug: "overview",
        heading: "Context: an independent consumer product",
        order: 1,
        body: `Reaccord is an independent consumer application I built for behavior change. It turns personal goals into plans, repeatable actions, reflection, and feedback over time.

I designed and built the product end to end. The system runs as separate web and native mobile applications over a shared backend, with a personalized interface that changes from day to day based on each user's state.`,
        summary:
          "Independent consumer application for behavior change; designed and built end to end across web, mobile, and backend.",
        tags: [
          "consumer-product",
          "behavior-change",
          "independent",
          "product-engineering",
          "end-to-end",
        ],
      },
      {
        slug: "responsibilities",
        heading: "Responsibilities",
        order: 2,
        body: `- Architected a cross-platform product with separate Next.js web and Expo/React Native mobile applications.

- Structured the codebase as a Turborepo monorepo with shared TypeScript contracts across clients.

- Built the backend on Convex for application state, queries, mutations, and scheduled work.

- Designed a personalized daily interface derived from goals, plans, actions, history, and generated content.

- Built AI-assisted planning, coaching, and recommendation workflows around persistent user context.

- Built model selection and bring-your-own-AI support so inference is not coupled to one provider or model.

- Designed flexible persistence for evolving application and AI-generated data.

- Built product analytics around PostHog across web, server, and native mobile surfaces.

- Designed and implemented the product's interaction model, visual system, onboarding, and daily-use workflows.`,
        summary:
          "Cross-platform architecture, monorepo structure, Convex backend, adaptive interface, model-independent AI workflows, flexible persistence, analytics, product design.",
        tags: [
          "architecture",
          "monorepo",
          "convex",
          "ai",
          "personalization",
          "analytics",
          "product-design",
        ],
      },
      {
        slug: "cross-platform-architecture",
        heading: "Cross-platform architecture",
        order: 3,
        body: `Reaccord is organized as a Turborepo monorepo using npm workspaces:

- apps/web — Next.js and React.
- apps/mobile — Expo, React Native, and Expo Router, with native integrations for notifications, secure storage, file access, image selection, and deep linking.
- packages/shared — shared TypeScript and Zod contracts used across application surfaces.
- convex — shared backend state and server behavior.

Web and mobile are separate presentation layers over the same product model. Goals, plans, actions, history, and AI-generated state belong to the user's account rather than either client.

Turborepo coordinates development, builds, and linting across the workspace. Shared packages reduce contract drift between clients, while the mobile project includes explicit parity checks for maintaining behavioral consistency with the web product.

This lets the interfaces diverge where the platforms require it without creating two independent products.`,
        summary:
          "Turborepo monorepo: Next.js web + Expo/React Native mobile over shared TypeScript/Zod contracts and a shared Convex backend.",
        tags: [
          "turborepo",
          "monorepo",
          "nextjs",
          "expo",
          "react-native",
          "typescript",
          "zod",
        ],
      },
      {
        slug: "adaptive-interface",
        heading: "Adaptive daily interface",
        order: 4,
        body: `Reaccord does not use a fixed dashboard.

The primary interface is derived from the user's current state and rebuilt around what is relevant that day. Current goals, scheduled actions, completion state, recent activity, generated recommendations, and other context determine what the user sees.

Persistent state and presentation are separate concerns. The backend stores the user's evolving system; the application derives today's interface from it.

The result is a UI that changes as the user changes rather than requiring the user to repeatedly configure a static dashboard.

That architecture introduces state-management problems around temporal logic, recurring actions, synchronization between clients, derived state, conditional rendering, and maintaining predictable behavior as personalization increases.`,
        summary:
          "Daily interface derived from user state rather than a fixed dashboard; temporal logic, derived state, and cross-client synchronization.",
        tags: [
          "personalization",
          "state-management",
          "derived-state",
          "temporal-logic",
          "ui",
        ],
      },
      {
        slug: "flexible-backend",
        heading: "Flexible backend",
        order: 5,
        body: `Reaccord uses Convex as the shared backend for web and mobile.

The product contains both stable domain concepts and rapidly changing AI-generated structures. Goals, actions, users, and history need durable relationships; generated plans, recommendations, and experimental product state need more flexibility.

I designed the persistence layer around that distinction rather than forcing every piece of generated state into a rigid relational representation.

Flexibility in storage moves responsibility toward the application boundary. Data consumed by deterministic application code is validated against the contracts that code expects, including shared Zod schemas where appropriate.

This makes it possible to change AI outputs and product structures quickly without giving up explicit contracts at the points where correctness matters.`,
        summary:
          "Convex persistence designed around stable domain relationships vs. flexible AI-generated state, validated at the application boundary.",
        tags: [
          "convex",
          "data-modeling",
          "persistence",
          "validation",
          "schema-design",
        ],
      },
      {
        slug: "model-independent-ai",
        heading: "Model-independent AI",
        order: 6,
        body: `Reaccord's AI features are designed around application capabilities rather than one model.

The system supports model switching and bring-your-own-AI configuration, allowing inference to change independently of the product workflows that consume it.

The application separates provider and model configuration from:

- prompt and context construction;
- application state;
- expected output shape;
- validation;
- persistence;
- downstream UI behavior.

A planning workflow remains a planning workflow when the underlying model changes.

This matters in a consumer AI product because model quality, latency, cost, and availability change quickly. Model choice is treated as configuration rather than application architecture.`,
        summary:
          "Model switching and bring-your-own-AI: provider configuration decoupled from prompts, state, output shape, validation, and UI.",
        tags: [
          "ai",
          "model-selection",
          "bring-your-own-ai",
          "provider-independence",
          "configuration",
        ],
      },
      {
        slug: "personalized-context",
        heading: "Personalized AI context",
        order: 7,
        body: `AI interactions operate against persistent product state rather than an isolated chat history.

Reaccord can draw from goals, plans, recurring actions, previous activity, reflections, and other user state when constructing a model request.

Context is assembled for the operation being performed rather than indiscriminately loading the user's history into every request.

The application therefore owns context selection. The model receives the information necessary for the current task; the complete longitudinal record remains in the application.`,
        summary:
          "Task-scoped context assembled from persistent user state; the application owns context selection rather than stuffing history.",
        tags: ["ai", "context-design", "personalization", "prompting"],
      },
      {
        slug: "behavior-model",
        heading: "Behavior model",
        order: 8,
        body: `At the product level, Reaccord connects:

goals → plans → recurring actions → completion → reflection → adjustment

Those objects retain their relationships over time.

A completion event belongs to an action. The action belongs to a plan. The plan exists in service of a broader change the user is trying to make.

This gives later workflows enough structure to reason about behavior longitudinally instead of treating every check-in as an independent event.`,
        summary:
          "goals → plans → recurring actions → completion → reflection → adjustment, with durable relationships for longitudinal reasoning.",
        tags: ["domain-model", "behavior-change", "data-modeling"],
      },
      {
        slug: "analytics",
        heading: "Product analytics",
        order: 9,
        body: `I instrumented Reaccord with PostHog across the product stack.

The current analytics surface includes authentication, onboarding completion, coaching interactions, plan creation, recommendation generation, failure events, and server-side exception capture.

Web uses browser and server-side PostHog clients; the native application uses the React Native SDK.

The event model is shared with the application rather than limited to page views, which lets me inspect whether users actually progress through the core product loop.`,
        summary:
          "PostHog across browser, server, and React Native: funnel-relevant product events and server-side exception capture.",
        tags: ["posthog", "analytics", "instrumentation", "observability"],
      },
      {
        slug: "consumer-product-engineering",
        heading: "Consumer product engineering",
        order: 10,
        body: `I use Reaccord myself, so repeated use is part of the development process.

That exposes a different class of defect from conventional functional testing: an interaction can work correctly and still be too slow, repetitive, confusing, or intrusive to survive daily use.

I have repeatedly changed information hierarchy, reduced required input, adjusted daily composition, and removed friction based on actual repeated use.

I build consumer applications in my spare time because I enjoy taking an idea through architecture, interaction design, implementation, and repeated use until it becomes something I actually want to keep using.`,
        summary:
          "Daily self-use as a development method: information hierarchy, input reduction, and friction removal driven by repeated use.",
        tags: [
          "consumer-product",
          "iteration",
          "interaction-design",
          "dogfooding",
        ],
      },
      {
        slug: "tools",
        heading: "Stack",
        order: 11,
        body: `- Web: Next.js, React, TypeScript.

- Mobile: Expo, React Native, Expo Router.

- Monorepo: Turborepo, npm workspaces.

- Shared contracts: TypeScript, Zod.

- Backend: Convex.

- AI: multi-model inference, model switching, bring-your-own-AI, structured/contextual workflows.

- Analytics: PostHog across browser, server, and React Native.

- Authentication: WorkOS.

- Payments: Stripe.

- Deployment: Vercel for the web application.`,
        summary:
          "Turborepo monorepo: Next.js + Expo/React Native + shared Zod contracts + Convex + PostHog + WorkOS + Stripe + Vercel.",
        tags: [
          "nextjs",
          "expo",
          "react-native",
          "turborepo",
          "convex",
          "zod",
          "posthog",
          "workos",
          "stripe",
          "vercel",
        ],
      },
    ],
  },
];

export const PROFILE_DOCUMENTS: ProfileDocumentSeed[] = [
  {
    type: "technical",
    title: "Technical Profile",
    sections: [
      {
        slug: "strongest-areas",
        heading: "Strongest areas",
        order: 1,
        body: `My strongest area is product/application engineering: turning ambiguous requirements into working software, particularly when the problem crosses product design, AI behavior, integrations, APIs, data, and frontend implementation.

Concretely:

- Product engineering under ambiguity — helping determine what should be built as well as how to build it.
- Whole-system reasoning across product behavior, data, APIs, integrations, frontend state, permissions, and backend workflows, rather than treating them as separate concerns.
- AI application engineering: tool calling, structured outputs, context design, validation, and failure handling.
- APIs and third-party integrations, including OAuth and external-system behavior in production.
- Application data modeling and permissions/authorization.
- Backend/server-side application workflows, including recurring background processing.
- Rapid mental-model formation in unfamiliar technologies and systems.
- Shipping under ambiguity — 0-to-1 environments where the technical path is not fully specified.

Because much of my engineering background began at the application and system level, I am comfortable moving across whatever technical boundary a problem requires rather than being restricted to one layer. This is breadth with product ownership, not a claim of deep specialization in every layer.`,
      },
      {
        slug: "ai-application-engineering",
        heading: "AI application engineering",
        order: 2,
        body: `I have direct production experience building LLM-powered product functionality including tool calling, contextual AI experiences, structured outputs, schema validation, prompt design, web-enabled workflows, and connecting models to application and organizational context.

AI is also deeply integrated into my engineering workflow. I use AI development tools aggressively to accelerate implementation, investigation, debugging, and learning while retaining responsibility for architecture, validation, code review, and final product decisions.`,
      },
      {
        slug: "learning-velocity",
        heading: "Learning velocity and transferability",
        order: 3,
        body: `My effectiveness is not dependent on already knowing every library in a role's stack.

I am comfortable entering unfamiliar systems, building a mental model quickly, working through documentation and existing code, using modern AI tools to accelerate that process, and validating the resulting implementation.

Recent C++/JUCE audio work is an example of this learning velocity. It should not be interpreted as long-term C++ specialization, but as evidence that I can become productive in unfamiliar technical environments quickly.`,
      },
      {
        slug: "engineering-foundations",
        heading: "Learning software engineering from the abstractions downward",
        order: 4,
        body: `Bubble was the environment where I first learned much of what I now think of as software engineering.

Because Bubble provides high-level abstractions for things that conventional applications often implement more explicitly, I encountered many engineering concepts first through their behavior in a real product: data modeling, application state, authorization, APIs, authentication, background workflows, performance, security, integrations, and the boundaries between different parts of a system.

As the products I worked on became more complicated, the limitations of those abstractions became just as educational as the capabilities:

- A workflow would become too expensive to run a certain way.
- A data structure that worked at small scale would create performance problems.
- An external API would impose rate limits or authentication requirements.
- A privacy rule would behave differently than expected.
- Work that looked simple at the product layer would need to move to custom JavaScript or an external service.

Solving those problems forced me to understand more about what was happening underneath the abstraction — restructuring data, redesigning workflows, changing client/server responsibilities, and moving work across implementation boundaries.

My path into engineering therefore looked somewhat different from the traditional route. I learned many software concepts from the application and system level downward, then progressively moved into conventional JavaScript, TypeScript, React, Next.js, Node.js, databases, APIs, and other code-first environments.

That background still affects how I work. I tend to think first about the behavior of the whole system:

- What the user is trying to do.
- Where the data moves.
- Which system owns which responsibility.
- What can fail.
- What the constraints are.
- What tradeoffs the implementation creates.

Syntax and frameworks matter, but I do not treat familiarity with a particular syntax as the same thing as understanding the system being built.`,
      },
      {
        slug: "working-experience",
        heading: "Working experience",
        order: 5,
        body: `- TypeScript, JavaScript, React, Next.js, Node.js.

- Bubble — a major production engineering environment for me: marketplace payments (Stripe Connect), social-platform API integrations, authorization and delegated access, recurring background workflows, rate-limit-aware data ingestion, and production debugging, all at the scale of a marketplace with thousands of users.

- Supabase, Postgres, APIs, OAuth.

- CI/CD, automated testing, production debugging.`,
      },
      {
        slug: "developing-experience",
        heading: "Developing experience",
        order: 6,
        body: `C++17, JUCE, CMake, VST3, and DSP. This work is recent and should be treated as evidence of range and learning velocity rather than long-term native-audio specialization.`,
      },
      {
        slug: "limited-experience",
        heading: "Limited experience",
        order: 7,
        body: `I am not primarily an infrastructure engineer. Large-scale distributed systems, Kubernetes, deep cloud-platform engineering, SRE, and Kafka-scale event infrastructure are not my strongest areas.

That is a statement about infrastructure engineering, not about backend application work. I have meaningful production evidence at the application/backend level — API design and integration, application data modeling, server-side workflows, authentication and OAuth, permissions and authorization, background processing, third-party systems, and production debugging — which is a different discipline from building and operating the underlying infrastructure.`,
      },
      {
        slug: "not-my-background",
        heading: "Not my background",
        order: 8,
        body: `I am not an ML research engineer and do not have a background training foundation models or building large-scale ML infrastructure. C++/JUCE/DSP experience is recent rather than long-term specialization.

Note: absence from the working-experience list is not a claim that I have never used a technology — it means the canonical sources do not document experience with it.`,
      },
    ],
  },
];
