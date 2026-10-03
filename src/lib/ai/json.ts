import type { z } from "zod";

/**
 * Structured-output parsing for Z.AI/GLM calls.
 *
 * Strategy: the provider request explicitly enables Z.AI JSON object mode
 * (response_format: {"type":"json_object"}), so the model text is expected
 * to be raw JSON. We do NOT strip markdown fences, translate YAML, or
 * otherwise "repair" model output as a success path — non-JSON or
 * schema-invalid text is a model/provider failure and fails loudly.
 *
 * Enforcement is two-gate:
 *   1. JSON.parse on the trimmed text
 *   2. the stage's Zod schema (safeParse)
 */

/** Preview cap embedded in error objects (logs cap again at 10k). */
const PREVIEW_CAP = 10_000;
export type StructuredOutputFailureStage =
  | "json_parse"
  | "schema_validation";

export class StructuredOutputParseError extends Error {
  readonly failureStage: StructuredOutputFailureStage;
  /** Zod issues when failureStage === "schema_validation". */
  readonly issues?: unknown;
  /** Safe truncated copy of the raw model text. */
  readonly textPreview: string;

  constructor(args: {
    message: string;
    failureStage: StructuredOutputFailureStage;
    cause?: unknown;
    issues?: unknown;
    rawText: string;
  }) {
    super(args.message, { cause: args.cause });
    this.name = "StructuredOutputParseError";
    this.failureStage = args.failureStage;
    this.issues = args.issues;
    this.textPreview = args.rawText.slice(0, PREVIEW_CAP);
  }
}

/**
 * Trims whitespace, JSON.parses, and validates against the supplied Zod
 * schema. Returns the typed object, or throws StructuredOutputParseError.
 */
export function parseStructuredJson<T>(rawText: string, schema: z.ZodType<T>): T {
  const text = rawText.trim();

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new StructuredOutputParseError({
      message:
        "Model did not return JSON: " +
        (error instanceof Error ? error.message : String(error)),
      failureStage: "json_parse",
      cause: error,
      rawText: text,
    });
  }

  const result = schema.safeParse(value);
  if (!result.success) {
    const first = result.error.issues[0];
    const where = first
      ? `${first.path.join(".") || "(root)"}: ${first.message}`
      : "unknown issue";
    throw new StructuredOutputParseError({
      message: `Model JSON failed schema validation (${where})`,
      failureStage: "schema_validation",
      issues: result.error.issues,
      rawText: text,
    });
  }

  return result.data;
}
