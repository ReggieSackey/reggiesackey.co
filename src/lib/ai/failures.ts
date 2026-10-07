import { StructuredOutputParseError } from "./json";
import { ThemeCoverageError } from "./validateCitations";
/** Allowlist only: never serialize a provider exception, message, cause, or body. */
export function safeFailureCode(error: unknown): string {
  if (error instanceof StructuredOutputParseError) return error.failureStage;
  if (error instanceof ThemeCoverageError) return "requirement_coverage";
  if (error instanceof Error) {
    const codes: Record<string, string> = {
      "Ungrounded theme": "ungrounded_theme",
      "Forged citation": "forged_citation",
      "Unverifiable quote": "unverifiable_quote",
      "Duplicate theme IDs": "duplicate_theme",
      "Ungrounded overall assessment": "ungrounded_overall",
      "AI call limit": "call_limit",
      "Invalid capability decision": "invalid_match",
      "Invalid requirement fit decision": "invalid_requirement_fit",
      "Synthesis theme contract mismatch": "synthesis_theme_contract",
      "Forged planned citation": "forged_planned_citation",
      "Unexpected material gap": "unexpected_material_gap",
      "Synthesis plan requires at least three themes": "synthesis_plan_too_small",
      "Duplicate extracted requirement": "duplicate_requirement",
      "Evidence changed": "evidence_changed",
      "Model output limit": "output_limit",
      "Model input limit": "input_limit",
    };
    return codes[error.message] ?? "provider_or_service_failure";
  }
  return "unknown_failure";
}
