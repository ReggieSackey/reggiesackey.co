import { hashJobDescription } from "./jd";
import { candidate } from "@/config/candidate";
/** Bump for prompt, schema, retrieval, validation, or matcher behavior changes. */
export const ANALYSIS_CONTRACT_VERSION = "success-profile-v1";
export async function analysisCacheKey(
  inputHash: string,
  evidenceVersion: string,
  model: string,
  reasoning: string,
  matcher = "zai-structured-v1",
) {
  return hashJobDescription(
    JSON.stringify({
      inputHash,
      evidenceVersion,
      model,
      reasoning,
      matcher,
      candidate,
      contract: ANALYSIS_CONTRACT_VERSION,
    }),
  );
}
