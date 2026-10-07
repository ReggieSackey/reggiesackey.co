import { z } from "zod";
import { extractedJobSchema } from "./schemas";
export const capabilityProposalSchema = z
  .object({
    slug: z
      .string()
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(800),
    tags: z.array(z.string().max(50)).max(8),
    evidence: z
      .array(
        z
          .object({
            sourceType: z.enum(["caseStudy", "profile"]),
            sourceId: z.string().min(1).max(100),
            sectionId: z.string().min(1).max(100),
            note: z.string().max(500),
          })
          .strict(),
      )
      .min(1)
      .max(30),
  })
  .strict();
export const proposalsSchema = z
  .object({ proposals: z.array(capabilityProposalSchema).min(1).max(40) })
  .strict();
export const decisionSchema = z
  .object({
    extractedJob: extractedJobSchema,
    matches: z
      .array(
        z
          .object({
            capabilityId: z.string().min(1).max(100),
            requirementIds: z
              .array(z.string().regex(/^req_\d+$/))
              .min(1)
              .max(25),
            score: z.number().min(0).max(1),
          })
          .strict(),
      )
      .max(12),
    requirementFits: z.array(z.object({
      requirementId: z.string().regex(/^req_\d+$/),
      fit: z.enum(["direct", "transferable", "gap"]),
    }).strict()).max(25).optional(),
  })
  .strict();
export type Decision = z.infer<typeof decisionSchema>;
export type Capability = {
  id: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  evidence?: Array<{
    sourceType: "caseStudy" | "profile";
    sourceId: string;
    sectionId: string;
    note: string;
  }>;
};
