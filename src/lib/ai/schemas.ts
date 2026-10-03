import { z } from "zod";

/**
 * Zod schemas for both model stages. These define the exact structured
 * output contracts; the model cannot emit URLs, titles, or anything
 * outside these shapes (Zod rejects unknown/extra keys by default).
 */

// --- Stage A: job requirement extraction ---------------------------

export const requirementImportanceSchema = z.enum([
  "core",
  "important",
  "preferred",
]);

export const extractedRequirementSchema = z.object({
  id: z.string().regex(/^req_\d+$/, "id must look like req_1, req_2, …"),
  requirement: z.string().min(1).max(500),
  importance: requirementImportanceSchema,
  category: z.string().min(1).max(100),
});

export const extractedJobSchema = z.object({
  jobTitle: z.string().nullable(),
  company: z.string().nullable(),
  requirements: z
    .array(extractedRequirementSchema)
    .min(3)
    .max(25),
});

export type ExtractedJob = z.infer<typeof extractedJobSchema>;
export type ExtractedRequirement = z.infer<typeof extractedRequirementSchema>;

// --- Stage B: candidate advocacy evaluation -------------------------
//
// Product philosophy (see modelCalls.ts for the full prompt): this is a
// candidate advocacy product, not a compliance audit. The evaluator
// constructs the strongest evidence-backed case for Reg while
// preserving factual integrity. Fit values express how Reg's evidence
// maps to the underlying capability — they are not corpus-coverage
// verdicts, so there is no "insufficient_evidence" and no "partial".

export const fitSchema = z.enum([
  "strong",
  "relevant",
  "gap",
]);

export const citationSchema = z.object({
  sourceType: z.enum(["caseStudy", "profile"]),
  sourceId: z.string().min(1),
  sectionId: z.string().min(1),
  quote: z.string().max(600).optional(),
});

/**
 * A synthesized hiring theme: the public unit of analysis. Related
 * extracted requirements are clustered into a handful of themes;
 * requirementIds records which requirements feed the theme so coverage
 * can be validated deterministically.
 */
export const themeSchema = z.object({
  id: z.string().regex(/^theme_\d+$/, "id must look like theme_1, theme_2, …"),
  title: z.string().min(1).max(120),
  fit: fitSchema,
  narrative: z.string().min(1).max(2000),
  requirementIds: z.array(z.string().min(1)).min(1).max(25),
  citations: z.array(citationSchema).max(10),
});

/**
 * A material difference — only for genuine capability/domain gaps that
 * a reasonable hiring manager would weigh. Optional by design: absent
 * when no material gaps exist.
 */
export const materialGapSchema = z.object({
  title: z.string().min(1).max(120),
  narrative: z.string().min(1).max(2000),
  citations: z.array(citationSchema).max(10),
});

export const candidateFitSchema = z.object({
  overallAssessment: z.object({
    fit: fitSchema,
    narrative: z.string().min(1).max(2000),
  }),
  themes: z.array(themeSchema).min(3).max(10),
  materialGaps: z.array(materialGapSchema).max(5),
  interviewQuestions: z.array(z.string().min(1).max(500)).max(3),
});

export type CandidateFit = z.infer<typeof candidateFitSchema>;
export type Fit = z.infer<typeof fitSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type MaterialGap = z.infer<typeof materialGapSchema>;
export type ModelCitation = z.infer<typeof citationSchema>;
