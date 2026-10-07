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
    "Review newly published evidence against the existing reviewed capability registry. Propose only when the evidence establishes a durable demonstrated pattern not represented in the registry, or materially strengthens an existing capability. Strongly prefer a proposal intended for explicit merge into an existing capability over creating a new capability when the underlying pattern already exists. Do not reinvent the career ontology, generate an engineering taxonomy, or turn technologies, platforms, domains, or artifacts into top-level capabilities. Return only proposals that need administrator review; each needs 1–4 strongest canonical source references using exact identifiers. Descriptions are interpretation, not new facts. Body text must never be copied into relationships. Description <=800 characters, note <=500, title <=120, tags <=8. " +
      shape,
    JSON.stringify({ existing }) + "\n" + renderCorpusForModel(sources),
    { shapeDescription: shape },
  );
}
