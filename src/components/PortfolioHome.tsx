"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { candidate } from "@/config/candidate";
import { MAX_JD_LENGTH } from "@/lib/ai/jd";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { SectionBody } from "@/components/SectionBody";
import { AnalysisToolbar } from "@/components/AnalysisToolbar";
import { AnalysisContent, type DisplayAnalysis } from "@/components/AnalysisContent";
import type { Id } from "@convex/_generated/dataModel";

const MAX_LENGTH = MAX_JD_LENGTH;
const SHELL_TRANSITION_MS = 220;
const loadingMessages = [
  "Contacting language model…",
  "Interpreting requirements…",
  "Gathering evidence…",
  "Comparing capabilities…",
  "Preparing analysis…",
];

type Phase = "idle" | "expanding" | "loading" | "error";
type ShellView = "home" | "caseStudies" | "caseStudyDetail" | "howIWork" | "downloads" | "analysis";

export function PortfolioHome({ initialView = "home", initialSlug, initialProfile, initialAnalysisId }: { initialView?: ShellView; initialSlug?: string; initialProfile?: ProfileData; initialAnalysisId?: string }) {
  const pathname = usePathname();
  const [value, setValue] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const requestRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const routeView: ShellView = pathname.startsWith("/analysis/") ? "analysis" : pathname === "/work" ? "caseStudies" : pathname.startsWith("/work/") ? "caseStudyDetail" : pathname === "/how-i-work" ? "howIWork" : pathname === "/downloads" ? "downloads" : initialView;
  const [view, setView] = useState<ShellView>(routeView);
  const detailSlug = pathname.startsWith("/work/") ? pathname.split("/").pop() : initialSlug;
  const caseStudies = useQuery(api.caseStudies.getPublishedCaseStudies);
  const detail = useQuery(api.caseStudies.getCaseStudyWithSections, detailSlug ? { slug: detailSlug } : "skip");
  const publishedProfile = useQuery(api.profileDocuments.getProfileDocumentWithSections, view === "howIWork" ? { type: "how-i-work" } : "skip");
  const profile = publishedProfile ?? initialProfile;
  const routeAnalysisId = pathname.startsWith("/analysis/") ? pathname.split("/").pop() : initialAnalysisId;
  const [analysisId, setAnalysisId] = useState<string | null>(routeAnalysisId ?? null);
  const validAnalysisId = analysisId && /^[a-z0-9]{22,32}$/i.test(analysisId) ? analysisId : null;
  const analysis = useQuery(api.jobAnalyses.getCompletedAnalysis, validAnalysisId ? { id: validAnalysisId as Id<"jobAnalyses"> } : "skip");
  const analysisStatus = useQuery(api.jobAnalyses.getAnalysisStatus, validAnalysisId ? { id: validAnalysisId as Id<"jobAnalyses"> } : "skip");
  const [overlayView, setOverlayView] = useState<ShellView | null>(routeView === "home" ? null : routeView);
  const [overlayDirection, setOverlayDirection] = useState<"left" | "right">("left");
  const [overlayActive, setOverlayActive] = useState(routeView !== "home");
  const [isLeaving, setIsLeaving] = useState(false);
  const transitionTimer = useRef<number | null>(null);
  const historyIndexRef = useRef(0);
  const currentViewRef = useRef(view);

  useEffect(() => {
    currentViewRef.current = view;
  }, [view]);

  useEffect(() => {
    if (phase !== "loading" && phase !== "expanding") return;
    const timer = window.setInterval(
      () => setMessageIndex((current) => (current + 1) % loadingMessages.length),
      2600,
    );
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => () => requestRef.current?.abort(), []);

  useEffect(() => {
    const initialState = window.history.state as { portfolioShellIndex?: number } | null;
    historyIndexRef.current = initialState?.portfolioShellIndex ?? 0;
    window.history.replaceState({ ...initialState, portfolioShellIndex: historyIndexRef.current }, "", window.location.href);
    const syncHistoryNavigation = () => {
      const previous = currentViewRef.current;
      const path = window.location.pathname;
      const destination: ShellView = path.startsWith("/analysis/") ? "analysis" : path === "/work" ? "caseStudies" : path.startsWith("/work/") ? "caseStudyDetail" : path === "/how-i-work" ? "howIWork" : path === "/downloads" ? "downloads" : "home";
      if (previous === destination) return;
      const state = window.history.state as { portfolioShellIndex?: number } | null;
      const nextIndex = state?.portfolioShellIndex ?? historyIndexRef.current;
      const movingForward = nextIndex > historyIndexRef.current;
      historyIndexRef.current = nextIndex;
      setView(destination);
      if (destination === "analysis") setAnalysisId(path.split("/").pop() ?? null);
      setOverlayView(movingForward ? destination : previous);
      setOverlayDirection(previous === "analysis" || destination === "analysis" ? "right" : "left");
      setIsLeaving(false);
      setOverlayActive(!movingForward);
      requestAnimationFrame(() => {
        if (movingForward) setOverlayActive(true);
        else setIsLeaving(true);
      });
      if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
      if (!movingForward) {
        transitionTimer.current = window.setTimeout(() => {
          setOverlayView(null);
          setOverlayActive(false);
          setIsLeaving(false);
        }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : SHELL_TRANSITION_MS);
      }
    };
    window.addEventListener("popstate", syncHistoryNavigation);
    return () => window.removeEventListener("popstate", syncHistoryNavigation);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(min-width: 821px)").matches) inputRef.current?.focus();
  }, []);

  function openView(nextView: ShellView, slug?: string, direction: "left" | "right" = "left") {
    if (isLeaving) return;
    setOverlayDirection(direction);
    if (nextView === "home" || nextView === "caseStudies" && view === "caseStudyDetail") {
      if (view === "home") return;
      const target: ShellView = nextView === "home" ? "home" : "caseStudies";
      const href = target === "home" ? "/" : "/work";
      setOverlayView(view);
      setOverlayActive(true);
      setIsLeaving(false);
      setView(target);
      historyIndexRef.current += 1;
      window.history.pushState({ portfolioShellIndex: historyIndexRef.current }, "", href);
      requestAnimationFrame(() => setIsLeaving(true));
      if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
      transitionTimer.current = window.setTimeout(() => {
        setOverlayView(null);
        setIsLeaving(false);
      }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : SHELL_TRANSITION_MS);
      return;
    }
    const href = nextView === "caseStudies" ? "/work" : nextView === "caseStudyDetail" ? `/work/${slug}` : nextView === "howIWork" ? "/how-i-work" : "/downloads";
    setOverlayView(nextView);
    setOverlayActive(false);
    setView(nextView);
    historyIndexRef.current += 1;
    window.history.pushState({ portfolioShellIndex: historyIndexRef.current }, "", href);
    requestAnimationFrame(() => setOverlayActive(true));
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
  }

  function openAnalysisBack() {
    if (isLeaving || view !== "analysis") return;
    setOverlayDirection("right");
    setOverlayActive(true);
    setIsLeaving(false);
    setView("home");
    historyIndexRef.current += 1;
    window.history.pushState({ portfolioShellIndex: historyIndexRef.current }, "", "/");
    requestAnimationFrame(() => setIsLeaving(true));
    transitionTimer.current = window.setTimeout(() => {
      setOverlayView(null);
      setOverlayActive(false);
      setIsLeaving(false);
      setAnalysisId(null);
      setPhase("idle");
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : SHELL_TRANSITION_MS);
  }

  useEffect(() => () => { if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current); }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!value.trim() || phase !== "idle") return;
    setError(null);
    setMessageIndex(0);
    setPhase("expanding");
    setView("analysis");
    setOverlayView("analysis");
    setOverlayDirection("right");
    setOverlayActive(false);
    setIsLeaving(false);
    requestAnimationFrame(() => setOverlayActive(true));
    const controller = new AbortController();
    requestRef.current = controller;

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: value }),
        signal: controller.signal,
      });
      const data = (await response.json()) as { id?: string; error?: string };
      if ((!response.ok && response.status !== 202) || !data.id) {
        setError(data.error ?? "Analysis failed. Please try again.");
        setPhase("error");
        return;
      }
      setAnalysisId(data.id);
      setPhase("loading");
    } catch (caught) {
      if ((caught as Error).name === "AbortError") return;
      setError("Something went wrong. Check your connection and try again.");
      setPhase("error");
    }
  }

  useEffect(() => {
    if (!analysis || !analysisId || pathname.startsWith("/analysis/")) return;
    historyIndexRef.current += 1;
    window.history.pushState({ portfolioShellIndex: historyIndexRef.current }, "", `/analysis/${analysisId}`);
  }, [analysis, analysisId, pathname, view]);

  return (
    <main className="portfolio-frame">
      <div className="portfolio-card">
        <div className="mobile-portfolio-nav"><PortfolioNav onNavigate={openView} /></div>
        <aside className="portfolio-sidebar">
          <Link href="/" className="portfolio-name">{candidate.name}</Link>
          <p className="portfolio-bio">
            I&apos;m a self-taught product engineer and multidisciplinary builder. I&apos;ve spent most of my career at startups, turning loose ideas into real products and figuring out whatever I need to learn along the way.
            <br /><br />
            My interests have taken me across AI, open-source development, game design, audio software, and design, with a liberal arts background that shapes how I think about all of it.
          </p>
          <div className="portfolio-rule" />
          <div className="desktop-portfolio-nav"><PortfolioNav onNavigate={openView} /></div>
        </aside>

        <section className="portfolio-takeover" aria-live="polite">
            <form onSubmit={submit} className="job-form">
              <div className="job-input-region">
                <label htmlFor="job-description" className="sr-only">Job description</label>
                <textarea ref={inputRef} id="job-description" aria-label="Job description" value={value} onChange={(event) => setValue(event.target.value)} maxLength={MAX_LENGTH} placeholder="" />
                {!value ? <div className="job-placeholder" aria-hidden="true"><span className="job-placeholder-primary">Paste a job description...</span><span className="job-placeholder-secondary">I’ll compare it to my work and tell you where I fit.</span></div> : null}
                <span>{value.length}/{MAX_LENGTH}</span>
              </div>
              <div className="input-footer">
                {error ? <div className="form-error" role="alert"><span>{error}</span><button type="button" onClick={() => setPhase("idle")}>Try again</button></div> : null}
                <button className="analyze-button" type="submit" disabled={!value.trim() || phase !== "idle"}>Analyze Fit</button>
              </div>
            </form>
        </section>
        {overlayView ? <div className={`shell-transition-layer from-${overlayDirection} ${overlayActive ? "is-active" : ""} ${isLeaving ? "is-leaving" : ""}`}>
          {overlayView === "analysis" ? <AnalysisWorkspace analysis={analysis} status={analysisStatus?.status} phase={phase} message={loadingMessages[messageIndex]} onBack={openAnalysisBack} onRetry={() => { setPhase("idle"); setAnalysisId(null); setOverlayView(null); setOverlayActive(false); setView("home"); }} /> : <ExpandedView view={overlayView} caseStudies={caseStudies} detail={detail} profile={profile} onBack={() => openView(overlayView === "caseStudyDetail" ? "caseStudies" : "home")} onOpenDetail={(slug) => openView("caseStudyDetail", slug)} />}
        </div> : null}
      </div>
    </main>
  );
}

function AnalysisWorkspace({ analysis, status, phase, message, onBack, onRetry }: { analysis: DisplayAnalysis | null | undefined; status?: string; phase: Phase; message: string; onBack: () => void; onRetry: () => void }) {
  return <section className="portfolio-expanded-content analysis-workspace">
    {analysis ? <><AnalysisToolbar onBack={onBack} /><AnalysisContent analysis={analysis} /></> : status === "failed" || phase === "error" ? <><AnalysisToolbar onBack={onBack} /><div className="analysis-state"><h1>Analysis failed</h1><p>Something went wrong while analyzing this job description.</p><button type="button" onClick={onRetry}>Try again</button></div></> : <div className="analysis-loading-shell"><LoadingState message={message} /></div>}
  </section>;
}

function PortfolioNav({ onNavigate }: { onNavigate: (view: ShellView, slug?: string) => void }) {
  return (
    <nav className="portfolio-nav" aria-label="Primary">
      <button type="button" onClick={() => onNavigate("home")}>Home</button>
      <button type="button" onClick={() => onNavigate("caseStudies")}>Case Studies</button>
      <button type="button" onClick={() => onNavigate("howIWork")}>How I work</button>
      <a href="https://github.com/ReggieSackey" target="_blank" rel="noopener noreferrer">GitHub</a>
      <button type="button" onClick={() => onNavigate("downloads")}>Downloads</button>
      {candidate.contactEmail ? <a className="mail-link" href={`mailto:${candidate.contactEmail}`} aria-label="Email Reg"><span aria-hidden="true">✉</span></a> : null}
    </nav>
  );
}

type PublishedStudy = { _id: string; slug: string; title: string; companyOrProject: string; summary: string };
type DetailData = { caseStudy: { title: string; companyOrProject: string; summary: string }; sections: Array<{ _id: string; slug: string; heading: string; body: string }> } | null | undefined;
type ProfileData = { document: { title: string }; sections: Array<{ _id: string; slug: string; heading: string; body: string }> } | null | undefined;

function ExpandedView({ view, caseStudies, detail, profile, onBack, onOpenDetail }: { view: ShellView; caseStudies: PublishedStudy[] | undefined; detail: DetailData; profile: ProfileData; onBack: () => void; onOpenDetail: (slug: string) => void }) {
  const title = view === "caseStudyDetail" ? detail?.caseStudy.title ?? "Case study" : view === "howIWork" ? profile?.document.title ?? "How I Work" : view === "downloads" ? "Downloads" : "Case Studies";
  const sections = view === "caseStudyDetail" ? detail?.sections : view === "howIWork" ? profile?.sections : null;
  return <section className="portfolio-expanded-content" aria-labelledby="expanded-title">
    <div className="expanded-toolbar"><h1 id="expanded-title">{title}</h1><button type="button" onClick={onBack}>← Back</button></div>
    {view === "caseStudies" ? <div className="case-study-grid">{caseStudies?.map((study) => <button type="button" key={study._id} className="case-study-card" onClick={() => onOpenDetail(study.slug)}><h2>{study.title}</h2><span>{study.companyOrProject}</span><p>{study.summary}</p></button>)}</div> : view === "downloads" ? <div className="expanded-copy"><p>Downloadable materials will be available here.</p></div> : <div className="expanded-sections">{detail?.caseStudy ? <><p className="expanded-meta">{detail.caseStudy.companyOrProject}</p><p className="expanded-summary">{detail.caseStudy.summary}</p></> : null}{sections?.map((section) => <article key={section._id} id={section.slug}><h2>{section.heading}</h2><SectionBody body={section.body} /></article>)}</div>}
  </section>;
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="loading-state">
      <div className="liquid-orb" aria-hidden="true" />
      <p>{message}</p>
      <div className="loading-dots" aria-hidden="true"><i /><i /><i /><i /></div>
      <span className="sr-only">Analysis in progress</span>
    </div>
  );
}
