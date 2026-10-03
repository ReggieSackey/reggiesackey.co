/**
 * Hard-coded types for the analysis result.
 *
 * The citation model is the contract the generator MUST produce: plain
 * IDs only, no hrefs. The application (resolveCitationUrl) owns URL
 * construction. Fit labels express advocacy-calibrated capability
 * mapping (strong / relevant / gap) — there is no "insufficient
 * evidence" verdict because corpus silence is not negative evidence.
 */

export type FitLabel = "strong" | "relevant" | "gap";

export type CitationSourceType = "caseStudy" | "profile";

/**
 * A citation points at canonical source material by ID. It must NOT
 * contain an arbitrary href — trusted links are resolved at render time
 * by resolveCitationUrl().
 */
export interface Citation {
  sourceType: CitationSourceType;
  /** Slug of the case study or profile document type. */
  sourceId: string;
  /** Stable section slug — the precise evidence anchor. */
  sectionId: string;
  /** Optional short supporting quote from that section. */
  quote?: string;
}

/**
 * A synthesized hiring theme: the public unit of analysis. requirementIds
 * records which extracted requirements feed the theme so coverage is
 * deterministically checkable.
 */
export interface ThemeAnalysis {
  id: string;
  title: string;
  fit: FitLabel;
  narrative: string;
  requirementIds: string[];
  citations: Citation[];
}

/** A genuine capability/domain gap a hiring manager would weigh. */
export interface MaterialGap {
  title: string;
  narrative: string;
  citations: Citation[];
}

export interface AnalysisResult {
  jobTitle: string;
  company: string;
  overallAssessment: {
    fit: FitLabel;
    narrative: string;
  };
  themes: ThemeAnalysis[];
  materialGaps: MaterialGap[];
  interviewQuestions: string[];
}
