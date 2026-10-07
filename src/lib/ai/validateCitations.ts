import type { CandidateFit, Theme, MaterialGap } from "./schemas";
import type { SourceSection } from "./corpus";

/**
 * Server-side citation validation. Never trust model citations just
 * because Zod passed — every citation must point at a section that was
 * actually supplied to the model, and quotes must be real excerpts.
 */

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function corpusKey(sourceType: string, sourceId: string, sectionId: string) {
  return JSON.stringify([sourceType, sourceId, sectionId]);
}

function buildCorpusIndex(sources: SourceSection[]) {
  const sections = new Map<string, SourceSection>();
  for (const s of sources) {
    sections.set(corpusKey(s.sourceType, s.sourceId, s.sectionId), s);
  }
  return sections;
}

/** True if the quote actually occurs in the section body (whitespace-normalized). */
export function quoteVerified(quote: string, body: string): boolean {
  const needle = normalizeWhitespace(quote);
  if (!needle) return false;
  return normalizeWhitespace(body).includes(needle);
}

export interface ValidatedCitationList {
  citations: CandidateFit["themes"][number]["citations"];
}

export interface ValidatedTheme {
  id: string;
  title: string;
  fit: Theme["fit"];
  narrative: string;
  requirementIds: string[];
  citations: Theme["citations"];
}

export interface ValidatedMaterialGap {
  title: string;
  narrative: string;
  citations: MaterialGap["citations"];
}

export interface ValidationResult {
  overallAssessment: CandidateFit["overallAssessment"];
  themes: ValidatedTheme[];
  materialGaps: ValidatedMaterialGap[];
  interviewQuestions: string[];
  /** Theme ids that were duplicated (should be impossible post-schema). */
  duplicateThemeIds: string[];
}

/**
 * Deterministic coverage enforcement. Every extracted requirement must
 * be accounted for by exactly one theme: no omissions, no unknown ids,
 * no requirement claimed by two themes. Enforced in application code —
 * never trusted to the prompt.
 */
export class ThemeCoverageError extends Error {
  readonly unknownRequirementIds: string[];
  readonly missingRequirementIds: string[];
  readonly duplicateRequirementIds: string[];

  constructor(args: {
    unknownRequirementIds: string[];
    missingRequirementIds: string[];
    duplicateRequirementIds: string[];
  }) {
    super(
      "Evaluation themes did not cover every extracted requirement exactly once" +
        (args.unknownRequirementIds.length
          ? `; unknown ids: ${args.unknownRequirementIds.join(", ")}`
          : "") +
        (args.missingRequirementIds.length
          ? `; missing ids: ${args.missingRequirementIds.join(", ")}`
          : "") +
        (args.duplicateRequirementIds.length
          ? `; duplicated across themes: ${args.duplicateRequirementIds.join(", ")}`
          : ""),
    );
    this.name = "ThemeCoverageError";
    this.unknownRequirementIds = args.unknownRequirementIds;
    this.missingRequirementIds = args.missingRequirementIds;
    this.duplicateRequirementIds = args.duplicateRequirementIds;
  }
}

export function validateThemeCoverage(
  fit: Pick<CandidateFit, "themes">,
  extractedRequirements: { id: string }[],
): void {
  const extractedIds = new Set(extractedRequirements.map((r) => r.id));

  const claimed = new Map<string, number>();
  for (const theme of fit.themes) {
    for (const id of theme.requirementIds) {
      claimed.set(id, (claimed.get(id) ?? 0) + 1);
    }
  }

  const unknownRequirementIds = [...claimed.keys()].filter(
    (id) => !extractedIds.has(id),
  );
  const missingRequirementIds = extractedRequirements
    .map((r) => r.id)
    .filter((id) => !claimed.has(id));
  const duplicateRequirementIds = [...claimed.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id);

  if (
    unknownRequirementIds.length > 0 ||
    missingRequirementIds.length > 0 ||
    duplicateRequirementIds.length > 0
  ) {
    throw new ThemeCoverageError({
      unknownRequirementIds,
      missingRequirementIds,
      duplicateRequirementIds,
    });
  }
}

const UNGROUNDED_NARRATIVE =
  "The source material supplied for this analysis does not support a grounded assessment of this theme.";

type Citation = Theme["citations"][number];

function validateCitationList(
  citations: Citation[],
  index: Map<string, SourceSection>,
): Citation[] {
  return citations
    .filter((c) => index.has(corpusKey(c.sourceType, c.sourceId, c.sectionId)))
    .map((c) => {
      const section = index.get(
        corpusKey(c.sourceType, c.sourceId, c.sectionId),
      );
      if (!section) return null;
      if (c.quote && !quoteVerified(c.quote, section.body)) {
        // Fabricated quote: strip it, keep the (valid) citation.
        const { sourceType, sourceId, sectionId } = c;
        return { sourceType, sourceId, sectionId };
      }
      return c;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);
}

/**
 * Validates model output against the corpus that was actually supplied.
 *
 * - Invalid citations (unknown source/section) are removed.
 * - Quotes that can't be verified are removed; the citation survives.
 * - A theme whose citations were ALL invalid is downgraded to
 *   insufficient grounding with an explicit narrative if it originally
 *   claimed grounding (fit != gap).
 */
export function validateCandidateFit(
  fit: CandidateFit,
  sources: SourceSection[],
): ValidationResult {
  const index = buildCorpusIndex(sources);

  const seenThemeIds = new Set<string>();
  const duplicateThemeIds: string[] = [];

  const themes: ValidatedTheme[] = fit.themes.map((theme) => {
    if (seenThemeIds.has(theme.id)) duplicateThemeIds.push(theme.id);
    seenThemeIds.add(theme.id);

    const validCitations = validateCitationList(theme.citations, index);
    const claimedGrounding = theme.fit !== "gap";
    const lostAllGrounding =
      claimedGrounding &&
      validCitations.length === 0 &&
      theme.citations.length > 0;

    return {
      id: theme.id,
      title: theme.title,
      fit: lostAllGrounding ? "relevant" : theme.fit,
      narrative: lostAllGrounding ? UNGROUNDED_NARRATIVE : theme.narrative,
      requirementIds: theme.requirementIds,
      citations: validCitations,
    };
  });

  const materialGaps: ValidatedMaterialGap[] = fit.materialGaps.map((gap) => ({
    title: gap.title,
    narrative: gap.narrative,
    citations: validateCitationList(gap.citations, index),
  }));

  return {
    overallAssessment: fit.overallAssessment,
    themes,
    materialGaps,
    interviewQuestions: fit.interviewQuestions,
    duplicateThemeIds,
  };
}

/** Public pipeline fails closed on grounding loss; no semantic repair or advocacy downgrade. */
export function assertGroundedFit(
  fit: CandidateFit,
  sources: SourceSection[],
): void {
  const index = buildCorpusIndex(sources);
  if (new Set(fit.themes.map((t) => t.id)).size !== fit.themes.length)
    throw new Error("Duplicate theme IDs");
  for (const theme of fit.themes) {
    if (
      theme.fit !== "gap" &&
      !validateCitationList(theme.citations, index).length
    )
      throw new Error("Ungrounded theme");
  }
  // A gap claim is also a factual claim. If citations were supplied, forgery must not survive as prose.
  for (const group of [...fit.themes, ...fit.materialGaps]) {
    if (
      group.citations.some(
        (c) => !index.has(corpusKey(c.sourceType, c.sourceId, c.sectionId)),
      )
    )
      throw new Error("Forged citation");
    if (
      group.citations.some(
        (c) =>
          c.quote &&
          !quoteVerified(
            c.quote,
            index.get(corpusKey(c.sourceType, c.sourceId, c.sectionId))!.body,
          ),
      )
    )
      throw new Error("Unverifiable quote");
  }
  if (
    fit.overallAssessment.fit !== "gap" &&
    !fit.themes.some((t) => t.fit !== "gap" && t.citations.length)
  )
    throw new Error("Ungrounded overall assessment");
}
