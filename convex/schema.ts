import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Canonical data model.
 *
 * Case studies and profile documents are the canonical factual source
 * material. Capabilities interpret those facts; relationships reference stable
 * source identities without copying canonical section bodies.
 */
export const evidenceRef = v.object({
  sourceType: v.union(v.literal("caseStudy"), v.literal("profile")),
  sourceId: v.string(),
  sectionId: v.string(),
  note: v.string(),
});
export const capabilityFields = {
  slug: v.string(),
  title: v.string(),
  description: v.string(),
  tags: v.array(v.string()),
};
export default defineSchema({
  capabilities: defineTable({
    ...capabilityFields,
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["active"]),
  capabilityEvidence: defineTable({
    capabilityId: v.id("capabilities"),
    ...evidenceRef.fields,
  }).index("by_capability", ["capabilityId"]),
  capabilityProposals: defineTable({
    ...capabilityFields,
    evidence: v.array(evidenceRef),
    corpusVersion: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"]),
  analysisBudget: defineTable({
    day: v.string(),
    reservedCalls: v.number(),
    failures: v.number(),
    circuitUntil: v.number(),
  }).index("by_day", ["day"]),
  analysisLeases: defineTable({
    analysisId: v.optional(v.id("jobAnalyses")),
    expiresAt: v.number(),
  }).index("by_expiry", ["expiresAt"]),
  users: defineTable({
    /** WorkOS user id (the `subject` of the auth token). */
    authId: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("viewer")),
  })
    .index("by_authId", ["authId"])
    .index("by_email", ["email"]),

  /**
   * A single case study. Split into stable sections (caseStudySections)
   * so retrieval and citation can target precise chunks of evidence.
   */
  caseStudies: defineTable({
    slug: v.string(),
    title: v.string(),
    companyOrProject: v.string(),
    summary: v.string(),
    published: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_published", ["published"]),

  /** Stable, addressable section of a case study. */
  caseStudySections: defineTable({
    caseStudyId: v.id("caseStudies"),
    slug: v.string(),
    heading: v.string(),
    body: v.string(),
    order: v.number(),
    summary: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_caseStudyId_and_order", ["caseStudyId", "order"])
    .index("by_slug", ["slug"]),

  /** A profile document (e.g. resume, bio, skills inventory). */
  profileDocuments: defineTable({
    type: v.string(),
    title: v.string(),
    published: v.boolean(),
  })
    .index("by_type", ["type"])
    .index("by_published", ["published"]),

  /** Stable, addressable section of a profile document. */
  profileSections: defineTable({
    profileDocumentId: v.id("profileDocuments"),
    slug: v.string(),
    heading: v.string(),
    body: v.string(),
    order: v.number(),
  })
    .index("by_profileDocumentId_and_order", ["profileDocumentId", "order"])
    .index("by_slug", ["slug"]),

  /**
   * One analysis run over a pasted job description.
   * Rows are keyed by inputHash for future caching/deduplication.
   *
   * The public result is theme-based (advocacy model): synthesized
   * hiring themes each covering a set of extracted requirement ids,
   * optional material gaps, and at most 3 interview questions.
   */
  jobAnalyses: defineTable({
    inputHash: v.string(),
    cacheKey: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    company: v.optional(v.string()),
    overallFit: v.optional(
      v.union(v.literal("strong"), v.literal("relevant"), v.literal("gap")),
    ),
    overallNarrative: v.optional(v.string()),
    themes: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          fit: v.union(
            v.literal("strong"),
            v.literal("relevant"),
            v.literal("gap"),
          ),
          narrative: v.string(),
          requirementIds: v.array(v.string()),
          citations: v.array(
            v.object({
              sourceType: v.union(v.literal("caseStudy"), v.literal("profile")),
              sourceId: v.string(),
              sectionId: v.string(),
              quote: v.optional(v.string()),
            }),
          ),
        }),
      ),
    ),
    materialGaps: v.optional(
      v.array(
        v.object({
          title: v.string(),
          narrative: v.string(),
          citations: v.array(
            v.object({
              sourceType: v.union(v.literal("caseStudy"), v.literal("profile")),
              sourceId: v.string(),
              sectionId: v.string(),
              quote: v.optional(v.string()),
            }),
          ),
        }),
      ),
    ),
    interviewQuestions: v.optional(v.array(v.string())),
    rawJobDescription: v.string(),
    status: v.string(),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_inputHash", ["inputHash"])
    .index("by_cache_status", ["cacheKey", "status"])
    .index("by_status", ["status"]),

  /**
   * A job application Reg has made (or is preparing). Not the public
   * analysis surface — that is jobAnalyses. Published applications get
   * their own slug-addressed page at /application/[slug].
   */
  applications: defineTable({
    slug: v.string(),
    company: v.string(),
    jobTitle: v.string(),
    jobUrl: v.optional(v.string()),
    rawJobDescription: v.string(),
    status: v.string(),
    published: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"]),

  /** Lightweight usage telemetry (analysis requested, page viewed, …). */
  usageEvents: defineTable({
    eventType: v.string(),
    createdAt: v.number(),
    metadata: v.optional(v.any()),
  }).index("by_eventType_and_createdAt", ["eventType", "createdAt"]),
});
