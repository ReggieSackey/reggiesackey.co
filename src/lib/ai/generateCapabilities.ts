import { callStructured, type CallModel } from "./modelCalls";
import { proposalsSchema } from "./capabilitySchemas";
import { renderCorpusForModel, type SourceSection } from "./corpus";
export async function generateCapabilities(
  sources: SourceSection[],
  existing: { title: string; description: string }[],
  caller?: CallModel,
) {
  const shape =
    'Return JSON {"proposals":[{"slug":"durable-capability","title":string,"description":string,"tags":[string],"evidence":[{"sourceType":"caseStudy"|"profile","sourceId":string,"sectionId":string,"note":string}]}]}.';
  return callStructured(
    caller,
    "capabilities",
    proposalsSchema,
    "Propose a compact registry of durable professional capabilities demonstrated in the supplied published sources. Aim for 8–20 concepts that employers hire for, not a technology inventory. Consolidate synonymous concepts. Existing concepts may be proposed for an explicit reviewed merge; never silently rename them. Each proposal needs 1–4 strongest canonical source section references; use exact supplied identifiers. Descriptions are interpretation, not new facts. Body text must never be copied into relationships. Description <=800 characters, note <=500, title <=120, tags <=8. " +
      shape,
    JSON.stringify({ existing }) + "\n" + renderCorpusForModel(sources),
    { shapeDescription: shape },
  );
}
