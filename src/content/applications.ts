/**
 * Source-controlled public application fit reports.
 *
 * These are hand-reviewed, role-specific narratives rendered at
 * /application/[slug]. They follow the portfolio's editorial contract:
 * conservative about facts, generous about interpretation, and explicit
 * about gaps. Section bodies use the same markdown-lite contract as
 * canonical section bodies (see SectionBody): blank-line-separated
 * paragraphs, or bullet blocks whose lines all start with "- ".
 *
 * Grounding for every claim lives in the canonical case studies and
 * profile documents (see convex/seedData.ts and
 * convex/additionalCaseStudies.ts). Do not add claims here that have no
 * canonical source.
 */

export type FitReportSection = {
  heading: string;
  body: string;
};

export type FitReport = {
  slug: string;
  role: string;
  company: string;
  location: string;
  compensation: string;
  postingUrl: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  sections: FitReportSection[];
};

const shopmyAgentManager: FitReport = {
  slug: "shopmy-agent-manager",
  role: "Agent Manager (Product Manager, AI Agents)",
  company: "ShopMy",
  location: "Remote — United States",
  compensation:
    "Published New York salary range: $150,000–$225,000 base plus equity. The $150K–$225K figure is the range ShopMy discloses under the New York Pay Transparency Law; the role itself is remote across the US. Every ShopMy employee receives equity on top of cash compensation.",
  postingUrl: "https://job-boards.greenhouse.io/shopmy/jobs/5309553008",
  metaTitle: "Fit report — Agent Manager, ShopMy",
  metaDescription:
    "Evidence-based fit report for the ShopMy Agent Manager role (Product Manager for AI agents): hands-on agent experience, creator-economy background, likely interview stories, and honest gaps.",
  intro: `ShopMy is hiring an Agent Manager: a Product Manager for its growing fleet of AI agents that do real work for internal teams and external clients — brands and creators. This report is my evidence-based read on how my shipped work maps onto that role, written the way this whole portfolio works: conservative about facts, generous about interpretation, and explicit about what is missing.

The short version: the hands-on agent work, the documentation-and-review discipline for agent-generated changes, and the creator-marketplace domain overlap are real and demonstrable. The honest gaps are formal agent-evaluation ownership and explicit ROI/run-history measurement — the parts of the role that are about standing up measurement discipline over a fleet of agents. I have built pieces of that discipline; I have not yet owned it as a product surface.`,
  sections: [
    {
      heading: "The role, in ShopMy's own terms",
      body: `The posting asks for someone who sits between the people an agent serves and the agentic system itself, and who embodies three qualities:

- A systems thinker: understands the internal team or external brand or creator an agent serves, reads between incomplete requests to find the need actually worth solving, and knows where an agent genuinely helps and where it does not.

- Hands-on with agents: in the prompts, documents, and delegation directly; prototypes and tests against real runs rather than writing long specs.

- Living on the frontier of agents: real intuition for how LLMs are prompted, how they delegate, and how they are evaluated, with a set bar for what a great agent feels like — accurate, reliable, on-tone, trusted.

The stated responsibilities map cleanly onto daily work: deep-dive with customer teams to decide where agents plug in; own each agent's customer need and convert it into requirements; garden agents against recurring gaps, quality drift, confusing delegation, and weak eval coverage; own prompt and document quality, delegation shape, locked instructions, and agent boundaries; shape the orchestration system itself; and triage the improvement queue between agent-side changes, engineering gaps, and product ambiguity.

Requirements: 3+ years in product management or a closely related role owning a product, workflow, or service against real customer needs; business judgment about where the leverage and ROI are; evidence-driven analysis with the patience to read run histories; enough technical fluency to prototype and go deep with engineers — "you do not need to be a software engineer, but you cannot be hands-off"; and comfort operating independently amid ambiguity. Bonus points include creator economy, influencer or affiliate marketing, or e-commerce background, hands-on LLM agent experience, eval frameworks or LLM-as-judge familiarity, and working directly with brands or creators as clients.`,
    },
    {
      heading: "Where the fit is strong",
      body: `Hands-on with agents, literally. I built CModel's strategic assistant myself: a standalone TypeScript/Next.js application on the Vercel AI SDK. I designed its runtime context — provided organization and page state versus selective tool calls — instead of stuffing application state into every prompt. I implemented tool calling against application data and external sources, web search for out-of-bounds questions, and schema-constrained generation where model output becomes application state only after validation, with explicit accept, retry, repair, or reject handling. I choose models and reasoning effort by task complexity and cost, and I added evals where deterministic tests are insufficient. This is the posting's "in the prompts, documents, and delegation" as shipped production work, not a spec handed to engineering.

Prompt, document, and delegation quality at system level. I initiated CModel's move to an agentic development model: shared technical documentation written for both humans and coding agents; task decomposition, prompting, and context design for agents; code-review practices covering human- and agent-generated changes; and automated testing, CI/CD, and evals as the quality bar. The pattern is a software factory: implementation is open to people across the company working through agents, while engineers own architecture, review, and release. That is the same shape of responsibility as owning delegation shape, locked instructions, and boundaries — applied to development agents rather than client-facing ones.

Systems thinking about how customer work actually flows. At CModel I owned an email-to-decision-intelligence pipeline from product definition through production. The hard problem was signal selection: authorized organizational email contains far more information than is useful, so the system must find the relevant strategic signals without treating raw inbox contents as model context. That is exactly the posting's "assume the requests you are handed are incomplete and read between them." I also implemented and maintained integrations across roughly nine external systems — Microsoft Graph, SharePoint, Teams, DocuSign, HubSpot, Monday, Harvest, Freshdesk, and Google services — where failures concentrate at boundaries: expired authorization, external state diverging from documentation, disagreement between local and remote data. The customers on the other side of this work are executives across industries including state-level government and economic-development organizations, and the job was consistently turning what they asked for into what they actually needed.

Creator-economy domain overlap. MusicBreakr was a two-sided marketplace where artists and music companies hired creators to promote music on social platforms. It served thousands of users, processed hundreds of thousands of dollars in transactions, and supported customers including major record labels. I owned social attribution across Instagram, TikTok, YouTube, and Twitter/X: ingesting four platforms' heterogeneous data, normalizing it onto internal creator, promotion, and campaign models, and answering the underlying client question — did the contracted promotion happen, and how did it perform over time. That is evidence-driven measurement of creator promotional work, which is structurally the same problem ShopMy's performance-driven creator programs and agents operate on. I also implemented delegated account access for managers and labels, and Stripe Connect for marketplace payments.

Shipping to real users, owning outcomes. I have published Bubble plugins that earn subscription revenue — products shipped to paying external users, maintained against their expectations. I have also recruited and managed contractors: defining the work, selecting people, and coordinating delivery against outcomes. Both are small but direct evidence for the ownership and coordination this role requires.`,
    },
    {
      heading: "Gaps and risks, stated plainly",
      body: `Formal agent evaluation ownership is the biggest gap. Evals in my work so far are part of the development workflow — checks I added where deterministic tests fell short — not an owned, ongoing program that monitors a fleet of production agents for quality drift, recurring gaps, and weak eval coverage. The posting's "garden agents" responsibility is the core duty I can least prove in advance.

Explicit ROI and run-history measurement is the second gap. I have not owned run-success rates, cost-per-task, or a formal improvement queue as measured systems. My analysis habits are evidence-driven, and I have reworked ingestion and workflows under real cost and quota constraints at MusicBreakr, but reading run histories at fleet scale and prioritizing by that evidence is a discipline I would be building for the first time here, not one I arrive with.

Evaluation tooling familiarity is conceptual rather than production: I have not run a named eval framework or an LLM-as-judge system in production. I understand what they are for and have hand-rolled validation and evals; I have not operated the packaged versions.

Title history: I have owned products, workflows, and services against real customer needs, but as a builder and owner rather than under a product manager title. The posting explicitly allows "a closely related role," and this fits — but formal PM process (prioritization frameworks, roadmap cadence, stakeholder ceremonies) is something interviewers should probe rather than assume.

Scale context: my production experience is small-team scale. ShopMy is a high-growth company that recently raised at a $1.5B valuation. Operating independently in a role and system that are both still being built fits how I work; doing it inside that pace and visibility is a reasonable thing to verify in references and interviews.`,
    },
    {
      heading: "Likely interview stories",
      body: `Design the assistant's context. CModel's strategic assistant keeps immediately relevant organization and page state in context and retrieves the rest through tool calls, with web search for questions outside the product. Expect follow-ups on why I separated provided context from retrieved context and what broke before I did.

What does good output look like? Schema-constrained generation at CModel: define the structure, generate against it, validate, then accept, retry, repair, or reject. The point I would argue in the interview: model output only becomes application state after it passes an explicit boundary — the same instinct the posting calls setting the bar for accurate and reliable.

How do you let non-engineers ship with agents without losing quality? The agentic development process at CModel: documentation usable by humans and agents, task decomposition and context design, engineer-owned review of every change, automated tests and CI/CD behind release. This is my closest story to owning delegation shape, locked instructions, and review controls.

Read an ambiguous request. The email pipeline: the stated ask was email integration, but the real problem was choosing which small fraction of email is a strategic signal at all. A story about finding the need worth solving underneath the request.

How would you know a promotion actually ran? MusicBreakr attribution: four social platforms with different identifiers, schemas, access models, and rate limits, normalized into campaign and creator views that could prove delivery and performance over time. Domain fluency plus an evidence-first reflex in the creator economy.

A mistake you owned. At MusicBreakr I introduced a subtle bug that overpaid creators. I fixed it immediately, successfully advocated for additional QA resources, and changed my own working practices to protect decision quality. Money-touching systems raise the cost of vagueness; that lesson is directly relevant to agents that touch client-facing work.`,
    },
    {
      heading: "Bottom line",
      body: `The overlap is real: hands-on agent building, prompt and context design, structured-output discipline, documentation and review practices for agent-generated work, creator-economy marketplace experience, and a track record of turning executive and client needs into shipped behavior.

The open question — mine to answer, not yours to assume — is measurement: standing up eval coverage, watching quality drift, and prioritizing by run-history evidence and ROI as an owned, ongoing practice. If ShopMy hires for this role expecting that discipline to exist on day one, the gap matters. If the role is expected to build it, the combination of hands-on agent work and marketplace domain fit is strong, and the first thing I would build is the measurement layer.`,
    },
    {
      heading: "Apply",
      body: `The official posting and application form for this role lives on ShopMy's Greenhouse board. Compensation shown there is the New York pay-transparency range of $150,000–$225,000 base salary, exclusive of bonus or commission, with equity granted to every employee; the position is remote within the United States.`,
    },
  ],
};

export const fitReports: readonly FitReport[] = [shopmyAgentManager];

export function getFitReport(slug: string): FitReport | undefined {
  return fitReports.find((report) => report.slug === slug);
}
