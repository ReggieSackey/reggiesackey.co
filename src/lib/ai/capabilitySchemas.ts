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
export const successProfileSchema = z.object({
  mission: z.string().min(1).max(500),
  work: z.array(z.object({
    id: z.string().regex(/^work_\d+$/),
    activity: z.string().min(1).max(500),
    importance: z.enum(["core", "important", "secondary"]),
  }).strict()).min(1).max(12),
  successDrivers: z.array(z.object({
    id: z.string().regex(/^driver_\d+$/),
    driver: z.string().min(1).max(500),
    importance: z.enum(["core", "important", "secondary"]),
  }).strict()).min(1).max(12),
  hardConstraints: z.array(z.object({
    id: z.string().regex(/^constraint_\d+$/),
    constraint: z.string().min(1).max(500),
    severity: z.enum(["blocking", "material"]),
  }).strict()).max(8),
}).strict();
export const decisionSchema = z
  .object({
    successProfile: successProfileSchema.optional(),
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
    capabilityRelevance: z.array(z.object({
      capabilityId: z.string().min(1).max(100),
      relevance: z.enum(["central", "useful", "incidental"]),
      workIds: z.array(z.string().regex(/^work_\d+$/)).max(12),
      successDriverIds: z.array(z.string().regex(/^driver_\d+$/)).max(12),
    }).strict()).max(12).optional(),
  })
  .strict();
export type Decision = z.infer<typeof decisionSchema>;
export type SuccessProfile = z.infer<typeof successProfileSchema>;
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
