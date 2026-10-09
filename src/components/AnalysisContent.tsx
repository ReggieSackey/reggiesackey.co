import type { CitationDisplayContext } from "@/lib/citationContext";
import type { Citation, FitLabel } from "@/lib/analysis";
import { CitationRow } from "@/components/CitationRow";

export type DisplayAnalysis = {
  jobTitle: string | null;
  company: string | null;
  overallFit: string | null;
  overallNarrative: string | null;
  themes: Array<{ id: string; title: string; fit: FitLabel; narrative: string; citations: Citation[] }>;
  materialGaps: Array<{ title: string; narrative: string; citations: Citation[] }>;
  interviewQuestions: string[];
};

export const emptyCitationContext: CitationDisplayContext = {
  sourceTitles: new Map(),
  sectionHeadings: new Map(),
};

export function AnalysisContent({ analysis, context = emptyCitationContext }: { analysis: DisplayAnalysis; context?: CitationDisplayContext }) {
  const positiveThemes = analysis.themes.filter((theme) => theme.fit !== "gap").slice(0, 5);
  const labels: Record<string, string> = { strong: "Strong fit", relevant: "Promising, but unproven", gap: "Significant gap" };
  return <div id="analysis-content" className="analysis-content">
    <h1 className="analysis-title">{analysis.jobTitle ?? "Role"}</h1>
    {analysis.company ? <p className="analysis-company">{analysis.company}</p> : null}
    <section className="analysis-section analysis-assessment"><h2>Overall assessment</h2><p className="analysis-fit-label">{labels[analysis.overallFit ?? "relevant"]}</p>{analysis.overallNarrative ? <p className="analysis-body">{analysis.overallNarrative}</p> : null}</section>
    {positiveThemes.length > 0 ? <section className="analysis-section"><h2>Where I fit</h2><div className="analysis-theme-list">{positiveThemes.map((theme) => <article className="analysis-theme" key={theme.id}><h3>{theme.title}</h3><p className="analysis-body">{theme.narrative}</p>{theme.citations.length ? <div className="analysis-citations">{theme.citations.map((citation, i) => <CitationRow key={`${theme.id}:${i}`} citation={citation} context={context} />)}</div> : null}</article>)}</div></section> : null}
    {analysis.materialGaps.length > 0 ? <section className="analysis-section"><h2>Where I&apos;m less proven</h2>{analysis.materialGaps.map((gap, i) => <article className="analysis-theme" key={`${gap.title}:${i}`}><h3>{gap.title}</h3><p className="analysis-body">{gap.narrative}</p>{gap.citations.length ? <div className="analysis-citations">{gap.citations.map((citation, j) => <CitationRow key={`${gap.title}:${j}`} citation={citation} context={context} />)}</div> : null}</article>)}</section> : null}
    {analysis.interviewQuestions.length > 0 ? <section className="analysis-section"><h2>One thing I&apos;d want to discuss</h2><p className="analysis-body">{analysis.interviewQuestions[0]}</p></section> : null}
  </div>;
}
