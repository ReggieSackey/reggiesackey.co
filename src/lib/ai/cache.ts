import { hashJobDescription } from "./jd";
import { candidate } from "@/config/candidate";
/** Bump for prompt, schema, retrieval, validation, or matcher behavior changes. */
export const ANALYSIS_CONTRACT_VERSION = "capabilities-v1.3";
export async function analysisCacheKey(
  inputHash: string,
  evidenceVersion: string,
  model: string,
  reasoning: string,
) {
  return hashJobDescription(
    JSON.stringify({
      inputHash,
      evidenceVersion,
      model,
      reasoning,
      candidate,
      contract: ANALYSIS_CONTRACT_VERSION,
    }),
  );
}
