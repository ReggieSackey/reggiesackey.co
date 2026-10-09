type Evidence = { sourceType: "caseStudy" | "profile"; sourceId: string; sectionId: string; note: string };
export type CanonicalCapability = { slug: string; title: string; description: string; tags: string[]; evidence: Evidence[] };
const cs = (sourceId: string, sectionId: string, note: string): Evidence => ({ sourceType: "caseStudy", sourceId, sectionId, note });
const profile = (sectionId: string, note: string): Evidence => ({ sourceType: "profile", sourceId: "technical", sectionId, note });
const how = (sectionId: string, note: string): Evidence => ({ sourceType: "profile", sourceId: "how-i-work", sectionId, note });

/** Reviewed ontology. Changes are staged as proposals and still require administrator approval. */
export const CANONICAL_CAPABILITIES: CanonicalCapability[] = [
  {
    slug: "ambiguous-problem-to-working-system", title: "Ambiguous problem → working system",
    description: "Takes loosely defined needs, determines what should exist, and turns them into an operational system. Use when work requires progress without a complete specification, translating fuzzy goals into concrete behavior, defining the implementation path, or creating structure where none exists. Do not reduce this to requirements gathering.",
    tags: ["ambiguity", "definition", "delivery"],
    evidence: [cs("cmodel-strategic-assistant", "email-signals", "Owned a loosely defined workflow from product definition through production."), cs("cmodel-strategic-assistant", "architecture-evolution", "Adapted implementation boundaries as product needs evolved."), cs("cmodel-strategic-assistant", "responsibilities", "Defined and delivered product behavior across systems."), cs("musicbreakr", "responsibilities", "Owned product and technical responsibilities across a live marketplace."), how("demo-day", "Identified an organizational bottleneck and created a working team practice rather than leaving the problem at the level of discussion."), profile("strongest-areas", "Identifies shipping under ambiguity as a demonstrated strength.")],
  },
  {
    slug: "zero-to-one-product-building", title: "Zero-to-one product building",
    description: "Takes an idea through product definition, interaction design, architecture, implementation, and real use. Relevant when someone needs to create a new product, prototype, workflow, tool, service, experiment, or concrete solution rather than operate inside a narrowly predetermined task.",
    tags: ["zero-to-one", "product", "prototyping", "TypeScript", "React", "Next.js", "Bubble"],
    evidence: [cs("cmodel-strategic-assistant", "overview", "Worked from early product prototypes through production."), cs("cmodel-strategic-assistant", "responsibilities", "Built new AI product workflows end to end."), cs("reaccord", "overview", "Created a new personal system from concept through use."), cs("reaccord", "responsibilities", "Owned product definition, architecture, and implementation."), cs("musicbreakr", "overview", "Built and operated a marketplace product."), profile("strongest-areas", "Documents 0-to-1 product engineering.")],
  },
  {
    slug: "whole-system-reasoning", title: "Whole-system reasoning",
    description: "Reasons across users, workflows, data, interfaces, APIs, permissions, backend behavior, external systems, and failure modes rather than treating each layer independently. Relevant whenever success requires understanding how multiple parts of a system affect one another.",
    tags: ["systems", "architecture", "failure-modes", "frontend", "backend", "APIs"],
    evidence: [profile("strongest-areas", "Documents reasoning across product, data, APIs, permissions, and workflows."), profile("engineering-foundations", "Explains a whole-system mental model and implementation tradeoffs."), how("interdisciplinary-thinking", "Treats political institutions, incentives, territory, development, and stability as interacting parts of a system rather than isolated concepts."), cs("cmodel-strategic-assistant", "integrations", "Connects application state and external systems."), cs("cmodel-strategic-assistant", "architecture-evolution", "Shows decisions across changing architectural boundaries."), cs("musicbreakr", "responsibilities", "Spans product, application, payment, and external-system behavior."), cs("reaccord", "cross-platform-architecture", "Coordinates state and behavior across platforms.")],
  },
  {
    slug: "integration-workflow-engineering", title: "Integration & workflow engineering",
    description: "Connects external systems, APIs, data, and workflows into coherent operational systems. Includes authentication, external state, data translation, recurring workflows, system boundaries, failure behavior, and how information moves through a business or product process.",
    tags: ["APIs", "OAuth", "workflows", "integrations", "Microsoft Graph", "social platforms"],
    evidence: [cs("cmodel-strategic-assistant", "integrations", "Production OAuth and business-system integrations."), cs("cmodel-strategic-assistant", "email-signals", "Email-to-decision-intelligence workflow."), cs("musicbreakr", "social-attribution", "Normalized multiple external platforms into attribution workflows."), cs("musicbreakr", "responsibilities", "Owned integrations and recurring marketplace workflows."), profile("working-experience", "Documents production API, OAuth, and background workflow work.")],
  },
  {
    slug: "applied-ai-systems", title: "Applied AI systems",
    description: "Builds AI into real products and workflows using context, tools, structured generation, validation, retrieval, application state, and explicit trust boundaries. This is application-level AI engineering, not ML research or foundation-model training.",
    tags: ["AI", "LLM", "retrieval", "validation", "Vercel AI SDK", "TypeScript"],
    evidence: [cs("cmodel-strategic-assistant", "strategic-assistant", "Built a contextual, tool-using AI product."), cs("cmodel-strategic-assistant", "structured-generation", "Implemented schema-constrained generation and failure handling."), cs("cmodel-strategic-assistant", "email-signals", "Applied AI to an operational information workflow."), cs("reaccord", "model-independent-ai", "Separated model providers from application-owned AI behavior."), cs("reaccord", "personalized-context", "Built task-specific persistent context."), profile("ai-application-engineering", "Documents direct production AI application experience.")],
  },
  {
    slug: "rapid-technical-adaptation", title: "Rapid technical adaptation",
    description: "Becomes productive in unfamiliar technical environments by forming a useful mental model, learning the necessary layer, using documentation and modern tools effectively, and validating the implementation. Supports transferability but never erases genuine specialization gaps.",
    tags: ["learning", "adaptation", "transferability"],
    evidence: [profile("learning-velocity", "Documents entering unfamiliar systems and validating implementations."), profile("engineering-foundations", "Shows progressive learning across abstraction boundaries."), how("learning-by-building", "Documents a repeatable approach to entering unfamiliar technical environments and becoming productive through mental-model formation, documentation, AI assistance, implementation, and validation."), cs("nation-rts", "unfamiliar-engine", "Learned how an unfamiliar game engine's templates, components, and progression systems interact."), cs("audio-plugin-development", "real-time-audio", "Learned real-time audio constraints and separated visualization work from the audio-processing path."), cs("cmodel-strategic-assistant", "architecture-evolution", "Worked productively across successive architectures."), profile("developing-experience", "Recent C++ and JUCE work demonstrates range without claiming specialization.")],
  },
  {
    slug: "product-interaction-judgment", title: "Product & interaction judgment",
    description: "Determines not only how to implement something, but what should be built, how it should behave, how information should be presented, and where user friction should be removed. Useful beyond jobs called product; it is judgment about the behavior of things people use.",
    tags: ["product", "interaction", "user-friction"],
    evidence: [cs("reaccord", "adaptive-interface", "Derived interface behavior from evolving user state."), cs("reaccord", "consumer-product-engineering", "Refined interaction design through repeated real use."), cs("reaccord", "behavior-model", "Modeled behavior to shape product experience."), cs("cmodel-strategic-assistant", "email-signals", "Defined useful product behavior for high-volume information."), profile("strongest-areas", "Documents determining what should be built as well as how.")],
  },
  {
    slug: "platform-extension-abstraction-escape", title: "Platform extension & abstraction escape",
    description: "Recognizes when an existing platform or abstraction is useful, when its constraints become limiting, and how to extend it or move responsibility across an implementation boundary. Bubble is evidence for this broader capability, not the capability itself.",
    tags: ["platforms", "abstractions", "boundaries", "Bubble", "JavaScript", "external services"],
    evidence: [profile("engineering-foundations", "Documents learning from and moving work across abstraction boundaries."), cs("cmodel-strategic-assistant", "architecture-evolution", "Moved product responsibility across successive architectures."), cs("musicbreakr", "data-ingestion", "Restructured workflows and moved computation as constraints emerged."), cs("musicbreakr", "responsibilities", "Extended platform behavior through APIs and external services.")],
  },
  {
    slug: "production-problem-solving", title: "Production problem solving",
    description: "Diagnoses and resolves real failures across application state, workflows, third-party systems, APIs, external constraints, and implementation boundaries, and carries systems through actual use. Do not equate this with SRE or infrastructure specialization.",
    tags: ["production", "debugging", "operations", "Stripe", "APIs"],
    evidence: [cs("cmodel-strategic-assistant", "integrations", "Handled external-system behavior and integration failures."), cs("musicbreakr", "responsibilities", "Owned live marketplace behavior across systems."), cs("musicbreakr", "production-ownership", "Resolved failures in a live revenue-producing product."), profile("working-experience", "Documents production debugging and operational application work.")],
  },
  {
    slug: "data-state-modeling", title: "Data & state modeling",
    description: "Designs representations of application state, relationships, permissions, external data, generated state, and derived state around how a system actually behaves. This is application and data modeling, not data-engineering or distributed-database specialization.",
    tags: ["data", "state", "permissions", "Postgres", "Supabase", "application modeling"],
    evidence: [cs("reaccord", "flexible-backend", "Separated durable concepts from flexible generated state."), cs("reaccord", "behavior-model", "Modeled user behavior and derived state."), cs("reaccord", "adaptive-interface", "Derived interface state from evolving application data."), cs("musicbreakr", "social-attribution", "Modeled normalized external attribution data."), profile("strongest-areas", "Documents application data modeling and authorization.")],
  },
  {
    slug: "ai-enabled-process-design", title: "AI-enabled process design",
    description: "Designs ways for people and AI agents to accomplish work together using persistent context, task specification, model selection, review, testing, evaluation, and verification. Broader than personally using coding assistants; it redesigns work while retaining human control.",
    tags: ["agents", "process", "evaluation", "human-review"],
    evidence: [cs("cmodel-strategic-assistant", "agentic-engineering", "Designed a team process around coding agents, review, testing, and CI/CD."), cs("cmodel-strategic-assistant", "structured-generation", "Applied validation and controlled failure handling to model work."), cs("reaccord", "personalized-context", "Designed persistent context for AI-assisted work."), profile("ai-application-engineering", "Documents AI-assisted engineering with retained validation responsibility.")],
  },
  {
    slug: "cross-boundary-execution", title: "Cross-boundary execution",
    description: "Operates across technical implementation, product decisions, customer or user needs, and operational realities when solving a problem requires crossing those boundaries. Useful where traditionally separated functions must connect; it is not a claim of being good at everything.",
    tags: ["cross-functional", "execution", "operations"],
    evidence: [cs("cmodel-strategic-assistant", "overview", "Worked across product, AI, integrations, and operations."), cs("cmodel-strategic-assistant", "responsibilities", "Owned decisions and implementation across multiple boundaries."), cs("musicbreakr", "overview", "Combined marketplace product and operational ownership."), cs("musicbreakr", "responsibilities", "Crossed customer, product, payment, and technical concerns."), cs("reaccord", "responsibilities", "Owned product and architecture across surfaces."), profile("strongest-areas", "Documents comfort moving across technical boundaries.")],
  },
  {
    slug: "interdisciplinary-synthesis", title: "Interdisciplinary synthesis",
    description: "Connects ideas from different domains and turns them into a usable model, product, experiment, or system. Relevant when work requires research across unfamiliar subject matter, combining technical and non-technical perspectives, reframing a problem, or translating abstract ideas into something concrete. This is not a claim of formal academic expertise in every domain involved.",
    tags: ["interdisciplinary", "synthesis", "research", "systems", "creativity"],
    evidence: [how("interdisciplinary-thinking", "Political-science and historical questions are translated into interactive systems and game mechanics."), cs("nation-rts", "political-development", "Turns ideas about political development, sovereignty, institutions, and territory into gameplay rules."), how("overview", "Career and independent work repeatedly cross political science, history, design, music, games, and software.")],
  },
  {
    slug: "organizational-initiative", title: "Organizational initiative",
    description: "Notices when a team process is preventing useful work and creates a practical mechanism that helps people act. Relevant to experimentation, collaboration, internal innovation, change management, facilitation, and environments where progress depends on more than individual technical execution.",
    tags: ["initiative", "collaboration", "experimentation", "organizational-design", "leadership"],
    evidence: [how("demo-day", "Created CModel Demo Day to turn prolonged discussion into concrete experiments and pitches; the practice remains in use and made the team more decentralized and collaborative."), cs("cmodel-strategic-assistant", "agentic-engineering", "Helped redesign how a broader team can participate in implementation using coding agents while engineers retain review and quality controls.")],
  },
  {
    slug: "accountability-process-improvement", title: "Accountability & process improvement",
    description: "Responds to mistakes by owning the immediate failure, correcting it, examining the surrounding process, and changing conditions that make similar failures more likely. Relevant to judgment, reliability, self-management, operational maturity, and learning from failure.",
    tags: ["accountability", "quality", "process-improvement", "reliability", "judgment"],
    evidence: [how("accountability-and-quality", "Owned a payment bug, fixed it immediately, successfully advocated for additional QA resources, and changed personal working practices to protect decision quality."), cs("musicbreakr", "production-ownership", "Worked through production failures in a live revenue-producing marketplace.")],
  },
];
