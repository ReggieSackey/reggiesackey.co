"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { candidate } from "@/config/candidate";
import { MAX_JD_LENGTH } from "@/lib/ai/jd";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { SectionBody } from "@/components/SectionBody";
import { AnalysisToolbar } from "@/components/AnalysisToolbar";
import { AnalysisContent, type DisplayAnalysis } from "@/components/AnalysisContent";
import {
  buildCitationContextFromRows,
  collectCitationRefs,
  type CitationDisplayContext,
} from "@/lib/citationContext";
import type { Citation } from "@/lib/analysis";
import type { Id } from "@convex/_generated/dataModel";

const MAX_LENGTH = MAX_JD_LENGTH;

/*
 * Shell transition timing.
 *   0ms    click — old content fades out
 *   HIDE_MS divider (the animated --split value) starts moving
 *   ~MOVE_MS - REVEAL_LEAD_MS  destination content fades in
 */
const HIDE_MS = 45;
const MOVE_MS = 300;
const REVEAL_LEAD_MS = 45;
const REVEAL_MS = 120;
const TRANSITION_FALLBACK_MS = MOVE_MS * 2 + 150;
const ANCHOR_RETRY_MS = 80;
const ANCHOR_MAX_TRIES = 40;

const loadingMessages = [
  "Contacting language model…",
  "Interpreting requirements…",
  "Gathering evidence…",
  "Comparing capabilities…",
  "Preparing analysis…",
];

/* ── Navigation state model ────────────────────────────────────────────
 *
 * One authoritative view (derived shell mode) and one authoritative
 * motion phase. The URL is the single source of truth; the transition
 * controller drives how we got there.
 *
 * Shell ownership: portfolio/profile views own the LEFT panel; analysis
 * owns the RIGHT panel; home splits 29/71.
 */

type ShellView =
  | "home"
  | "caseStudies"
  | "caseStudyDetail"
  | "howIWork"
  | "profile"
  | "downloads"
  | "analysis";
type ShellMode = "home" | "portfolio" | "analysis";
type MotionPhase = "settled" | "hiding" | "moving" | "revealing";
type AnalysisPhase = "idle" | "submitting" | "loading" | "error";

const shellModeForView = (view: ShellView): ShellMode =>
  view === "analysis" ? "analysis" : view === "home" ? "home" : "portfolio";

const labelForView = (view: ShellView): string =>
  view === "caseStudies"
    ? "Case studies"
    : view === "caseStudyDetail"
      ? "Case study"
      : view === "howIWork"
        ? "How I work"
        : view === "profile"
          ? "Profile"
          : view === "downloads"
            ? "Downloads"
            : view === "analysis"
              ? "Analysis"
              : "Home";

/* ── Route parser (single source of truth for path → view) ──────────── */

type ParsedShellRoute = {
  view: ShellView;
  slug: string | null;
  profileType: string | null;
  analysisId: string | null;
  hash: string | null;
};

function parseShellRoute(pathname: string, hash = ""): ParsedShellRoute {
  const clean = pathname.split("#")[0];
  const anchor = hash.startsWith("#") ? hash.slice(1) : hash.split("#")[1] || null;
  if (clean.startsWith("/analysis/")) {
    const id = clean.split("/").pop() ?? "";
    return {
      view: "analysis",
      slug: null,
      profileType: null,
      analysisId: /^[a-z0-9]{22,32}$/i.test(id) ? id : null,
      hash: anchor,
    };
  }
  if (clean.startsWith("/work/")) {
    return {
      view: "caseStudyDetail",
      slug: clean.split("/").pop() ?? null,
      profileType: null,
      analysisId: null,
      hash: anchor,
    };
  }
  if (clean === "/work") return { view: "caseStudies", slug: null, profileType: null, analysisId: null, hash: anchor };
  if (clean === "/how-i-work") return { view: "howIWork", slug: null, profileType: null, analysisId: null, hash: anchor };
  if (clean.startsWith("/profile/")) {
    return {
      view: "profile",
      slug: null,
      profileType: clean.split("/").pop() ?? null,
      analysisId: null,
      hash: anchor,
    };
  }
  if (clean === "/downloads") return { view: "downloads", slug: null, profileType: null, analysisId: null, hash: anchor };
  return { view: "home", slug: null, profileType: null, analysisId: null, hash: anchor };
}

function hrefForView(
  view: ShellView,
  opts: { slug?: string | null; analysisId?: string | null; profileType?: string | null } = {},
): string {
  switch (view) {
    case "caseStudies":
      return "/work";
    case "caseStudyDetail":
      return `/work/${opts.slug ?? ""}`;
    case "howIWork":
      return "/how-i-work";
    case "profile":
      if (!opts.profileType) throw new Error("Profile navigation requires profileType");
      return `/profile/${opts.profileType}`;
    case "downloads":
      return "/downloads";
    case "analysis":
      return opts.analysisId ? `/analysis/${opts.analysisId}` : window.location.pathname;
    default:
      return "/";
  }
}

type ShellState = {
  view: ShellView;
  detailSlug: string | null;
  profileType: string | null;
  analysisId: string | null;
  motionPhase: MotionPhase;
  analysisPhase: AnalysisPhase;
  error: string | null;
};

/** Explicit navigation targets — profile navigation must name its type. */
type NavigationTarget = {
  view: ShellView;
  slug?: string | null;
  profileType?: string | null;
  analysisId?: string | null;
  anchor?: string | null;
};

type ShellAction =
  | { type: "hide" }
  | {
      type: "move";
      view: ShellView;
      slug?: string | null;
      analysisId?: string | null;
      profileType?: string | null;
    }
  | { type: "reveal" }
  | { type: "settle" }
  | {
      type: "localSwap";
      view: ShellView;
      slug?: string | null;
      profileType?: string | null;
    }
  | { type: "attachAnalysis"; analysisId: string }
  | { type: "analysisPhase"; phase: AnalysisPhase }
  | { type: "analysisError"; message: string | null }
  | {
      type: "snap";
      view: ShellView;
      slug?: string | null;
      analysisId?: string | null;
      profileType?: string | null;
    };

function shellReducer(state: ShellState, action: ShellAction): ShellState {
  switch (action.type) {
    case "hide":
      return state.motionPhase === "settled" ? { ...state, motionPhase: "hiding" } : state;
    case "move": {
      const movingToAnalysis = action.view === "analysis";
      return {
        view: action.view,
        detailSlug: action.view === "caseStudyDetail" ? (action.slug ?? null) : null,
        profileType: action.view === "profile" ? (action.profileType ?? null) : null,
        analysisId: movingToAnalysis ? (action.analysisId ?? null) : null,
        motionPhase: "moving",
        analysisPhase: movingToAnalysis ? state.analysisPhase : "idle",
        error: movingToAnalysis ? state.error : null,
      };
    }
    case "reveal":
      return { ...state, motionPhase: "revealing" };
    case "settle":
      return { ...state, motionPhase: "settled" };
    // Same expanded panel side (work index ↔ detail ↔ profile): swap
    // content in place, the boundary stays where it is.
    case "localSwap":
      return {
        ...state,
        view: action.view,
        detailSlug:
          action.view === "caseStudyDetail" ? (action.slug ?? state.detailSlug) : null,
        profileType: action.view === "profile" ? (action.profileType ?? state.profileType) : null,
        motionPhase: "settled",
      };
    case "attachAnalysis":
      return state.view === "analysis" ? { ...state, analysisId: action.analysisId } : state;
    case "analysisPhase":
      return { ...state, analysisPhase: action.phase };
    case "analysisError":
      return {
        ...state,
        error: action.message,
        ...(action.message ? { analysisPhase: "error" as const } : {}),
      };
    // External navigation (popstate / direct URL): land immediately.
    case "snap":
      return {
        view: action.view,
        detailSlug: action.view === "caseStudyDetail" ? (action.slug ?? null) : null,
        profileType: action.view === "profile" ? (action.profileType ?? null) : null,
        analysisId: action.view === "analysis" ? (action.analysisId ?? null) : null,
        motionPhase: "settled",
        analysisPhase: action.view === "home" ? "idle" : state.analysisPhase,
        error: action.view === "home" ? null : state.error,
      };
  }
}

function scrollToSection(sectionId: string, behavior: ScrollBehavior): boolean {
  const element = document.getElementById(sectionId);
  if (!element) return false;
  element.scrollIntoView({ behavior, block: "start" });
  return true;
}

/**
 * The shell derives its view from the URL (usePathname). The initial*
 * props seed server-fetched data for direct visits; all navigation
 * afterwards is client-side.
 */
export function PortfolioHome({
  initialProfile,
  initialProfileType,
}: {
  initialView?: string;
  initialSlug?: string;
  initialAnalysisId?: string;
  initialProfileType?: string;
  initialProfile?: ProfileData;
}) {
  const pathname = usePathname();
  const route = useMemo(
    () =>
      parseShellRoute(
        pathname,
        typeof window === "undefined" ? "" : window.location.hash,
      ),
     
    [pathname],
  );

  const [shell, dispatch] = useReducer(shellReducer, undefined, () => ({
    view: route.view,
    detailSlug: route.slug,
    profileType: route.profileType,
    analysisId: route.analysisId,
    motionPhase: "settled" as MotionPhase,
    analysisPhase: "idle" as AnalysisPhase,
    error: null as string | null,
  }));
  const shellMode = shellModeForView(shell.view);
  const { analysisPhase, error } = shell;

  const [value, setValue] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [announce, setAnnounce] = useState("");
  // Cold-load anchor: seeded into pendingAnchor at mount so the retry
  // effect handles it — no state-setting effect needed.
  // Cold-load anchor: seeded into pendingAnchor at mount so the retry
  // effect handles it — no state-setting effect needed.
  const [pendingAnchor, setPendingAnchor] = useState<string | null>(route.hash);  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef(shell);
  const runIdRef = useRef(0);
  const busyRef = useRef(false);
  const expectedHrefRef = useRef<string | null>(null);
  const pendingTimersRef = useRef<number[]>([]);
  const requestRef = useRef<AbortController | null>(null);
  const reducedMotionRef = useRef(false);
  const anchorRetryRef = useRef(0);

  useEffect(() => {
    shellRef.current = shell;
  }, [shell]);

  /* Convex data — keyed to the current shell view. */
  const caseStudies = useQuery(api.caseStudies.getPublishedCaseStudies);
  const detailSlug = shell.view === "caseStudyDetail" ? shell.detailSlug : null;
  const detail = useQuery(
    api.caseStudies.getCaseStudyWithSections,
    detailSlug ? { slug: detailSlug } : "skip",
  );
  const activeProfileType =
    shell.view === "howIWork"
      ? "how-i-work"
      : shell.view === "profile"
        ? shell.profileType
        : null;
  const publishedProfile = useQuery(
    api.profileDocuments.getProfileDocumentWithSections,
    activeProfileType ? { type: activeProfileType } : "skip",
  );
  const profile =
    publishedProfile ??
    (initialProfile && (!initialProfileType || initialProfileType === activeProfileType)
      ? initialProfile
      : undefined);
  const validAnalysisId =
    shell.analysisId && /^[a-z0-9]{22,32}$/i.test(shell.analysisId) ? shell.analysisId : null;
  const analysis = useQuery(
    api.jobAnalyses.getCompletedAnalysis,
    validAnalysisId ? { id: validAnalysisId as Id<"jobAnalyses"> } : "skip",
  );
  const analysisStatus = useQuery(
    api.jobAnalyses.getAnalysisStatus,
    validAnalysisId ? { id: validAnalysisId as Id<"jobAnalyses"> } : "skip",
  );

  /* Citation context: resolve every citation in the completed analysis
   * to canonical source titles + section headings. */
  const citationRefs = useMemo(() => {
    if (!analysis) return [];
    const all: Citation[] = [
      ...analysis.themes.flatMap((t) => t.citations),
      ...analysis.materialGaps.flatMap((g) => g.citations),
    ];
    return collectCitationRefs(all);
  }, [analysis]);

  const citationRows = useQuery(
    api.citations.getCitationSources,
    citationRefs.length ? { citations: citationRefs } : "skip",
  );
  const citationContext: CitationDisplayContext = useMemo(
    () => (citationRows ? buildCitationContextFromRows(citationRows) : { sourceTitles: new Map(), sectionHeadings: new Map() }),
    [citationRows],
  );

  /* ── Document title synchronizer ─────────────────────────────────────
   *
   * pushState navigation does not rerun Next.js route metadata, so the
   * mounted SPA owns document.title after first paint. One derived
   * value, one effect — no scattered mutations. Direct loads keep the
   * server-rendered title; this converges to the same strings.
   */
  const detailTitle = detail?.caseStudy.title;
  const profileTitle = profile?.document.title;
  const analysisTitle = analysis?.jobTitle;
  const pageTitle = useMemo(() => {
    switch (shell.view) {
      case "caseStudies":
        return `Case Studies — ${candidate.name}`;
      case "caseStudyDetail":
        return `${detailTitle ?? "Case Study"} — ${candidate.name}`;
      case "howIWork":
        return `How I Work — ${candidate.name}`;
      case "profile":
        return `${profileTitle ?? "Profile"} — ${candidate.name}`;
      case "downloads":
        return `Downloads — ${candidate.name}`;
      case "analysis":
        return `${analysisTitle ?? "Fit analysis"} — ${candidate.name}`;
      default:
        return `${candidate.name} — ${candidate.headline}`;
    }
  }, [shell.view, detailTitle, profileTitle, analysisTitle]);

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  /* ── Transition controller ─────────────────────────────────────────── */

  const wait = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      const id = window.setTimeout(() => {
        pendingTimersRef.current = pendingTimersRef.current.filter((t) => t !== id);
        resolve();
      }, ms);
      pendingTimersRef.current.push(id);
    });
  }, []);

  const waitForSplitTransition = useCallback((card: HTMLElement) => {
    return new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        card.removeEventListener("transitionend", handleEnd);
        window.clearTimeout(fallback);
        resolve();
      };
      const handleEnd = (event: TransitionEvent) => {
        if (event.target === card && event.propertyName === "--split") finish();
      };
      const fallback = window.setTimeout(finish, TRANSITION_FALLBACK_MS);
      card.addEventListener("transitionend", handleEnd);
    });
  }, []);

  const focusAfterTransition = useCallback(
    (view: ShellView, previous: { view: ShellView; profileType?: string | null }) => {
      if (view === "home") {
        const navButton = document.querySelector<HTMLButtonElement>(
          `.home-left-content [data-nav-view="${previous.view}${
            previous.view === "profile" ? `:${previous.profileType ?? ""}` : ""
          }"]`,
        );
        const target =
          previous.view === "analysis" ? inputRef.current : (navButton ?? inputRef.current);
        target?.focus({ preventScroll: true });
        return;
      }
    if (view === "analysis") {
      document.querySelector<HTMLElement>(".analysis-workspace")?.focus({ preventScroll: true });
      return;
    }
    document.getElementById("expanded-title")?.focus({ preventScroll: true });
  }, []);
  const transitionTo = useCallback(
    async (target: {
      view: ShellView;
      slug?: string | null;
      analysisId?: string | null;
      profileType?: string | null;
      anchor?: string | null;
    }) => {
      if (busyRef.current) return false;
      busyRef.current = true;
      const previous = { view: shellRef.current.view, profileType: shellRef.current.profileType };
      const run = ++runIdRef.current;
      const href =
        hrefForView(target.view, {
          slug: target.slug ?? null,
          analysisId: target.analysisId ?? null,
          profileType: target.profileType ?? null,
        }) + (target.anchor ? `#${target.anchor}` : "");
      const alive = () => runIdRef.current === run;
      try {
        if (target.anchor) setPendingAnchor(target.anchor);

        if (reducedMotionRef.current) {
          if (href !== window.location.pathname + window.location.hash) {
            expectedHrefRef.current = href;
            window.history.pushState({}, "", href);
          }
          dispatch({ type: "snap", ...target });
          setAnnounce(labelForView(target.view));
          requestAnimationFrame(() => focusAfterTransition(target.view, previous));
          return true;
        }

        // 1. Old content fades out; commit the starting styles first.
        dispatch({ type: "hide" });
        if (href !== window.location.pathname + window.location.hash) {
          expectedHrefRef.current = href;
          window.history.pushState({}, "", href);
        }
        await wait(HIDE_MS);
        if (!alive()) return false;

        // 2. The panel boundary (the --split value) sweeps to its target.
        dispatch({ type: "move", ...target });
        const card = cardRef.current;
        const splitDone = card ? waitForSplitTransition(card) : Promise.resolve();
        await Promise.race([splitDone, wait(MOVE_MS - REVEAL_LEAD_MS)]);
        if (!alive()) return false;

        // 3. Destination content fades in — in place, never translated.
        dispatch({ type: "reveal" });
        setAnnounce(labelForView(target.view));
        focusAfterTransition(target.view, previous);
        await wait(REVEAL_MS);
        if (!alive()) return false;

        dispatch({ type: "settle" });
        return true;
      } finally {
        if (alive()) busyRef.current = false;
      }
    },
    [focusAfterTransition, waitForSplitTransition, wait],
  );

  const openView = useCallback(
    (next: NavigationTarget) => {
      if (busyRef.current) return;
      const current = shellRef.current;
      const sameTarget =
        next.view === current.view &&
        !(next.view === "caseStudyDetail" && next.slug != null && next.slug !== current.detailSlug) &&
        !(next.view === "profile" && next.profileType != null && next.profileType !== current.profileType);
      if (sameTarget && !next.anchor) return;

      // Same page, anchor-only navigation: no shell transition, just
      // update the hash and smooth-scroll.
      if (sameTarget && next.anchor) {
        window.history.pushState({}, "", `#${next.anchor}`);
        setPendingAnchor(next.anchor);
        return;
      }

      const currentMode = shellModeForView(current.view);
      const nextMode = shellModeForView(next.view);
      const href =
        hrefForView(next.view, {
          slug: next.slug ?? null,
          profileType: next.profileType ?? null,
          analysisId: next.analysisId ?? current.analysisId,
        }) + (next.anchor ? `#${next.anchor}` : "");

      // Between two LEFT-owned (or two RIGHT-owned) views the boundary
      // does not move — swap the content locally with a quick fade.
      if (
        currentMode === nextMode &&
        currentMode !== "home" &&
        current.motionPhase === "settled"
      ) {
        expectedHrefRef.current = href;
        window.history.pushState({}, "", href);
        dispatch({
          type: "localSwap",
          view: next.view,
          slug: next.slug ?? null,
          profileType: next.profileType ?? null,
        });
        setAnnounce(labelForView(next.view));
        if (next.anchor) setPendingAnchor(next.anchor);
        requestAnimationFrame(() =>
          focusAfterTransition(next.view, { view: current.view, profileType: current.profileType }),
        );
        return;
      }

      void transitionTo({
        view: next.view,
        slug: next.slug ?? null,
        profileType: next.profileType ?? null,
        analysisId: next.analysisId ?? null,
        anchor: next.anchor ?? null,
      });
    },
    [focusAfterTransition, transitionTo],
  );

  /* ── Navigation synchronization ──────────────────────────────────────
   *
   * One mechanism: window.history.pushState (Next-integrated) for
   * internal navigation, popstate for back/forward. Any popstate
   * interrupts an in-flight transition and snaps to the URL's state.
   */

  useEffect(() => {
    const syncFromLocation = () => {
      const next = parseShellRoute(window.location.pathname, window.location.hash);
      const current = shellRef.current;
      const inSync =
        next.view === current.view &&
        (next.view !== "caseStudyDetail" || next.slug === current.detailSlug) &&
        (next.view !== "profile" || next.profileType === current.profileType);
      if (inSync && !busyRef.current && !next.hash) return;

      // Anchor-only change on the same view: just scroll.
      if (inSync && next.hash) {
        setPendingAnchor(next.hash);
        return;
      }

      runIdRef.current += 1;
      busyRef.current = false;
      expectedHrefRef.current = null;
      dispatch({
        type: "snap",
        view: next.view,
        slug: next.slug,
        analysisId: next.analysisId,
        profileType: next.profileType,
      });
      if (next.hash) setPendingAnchor(next.hash);
    };
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
     
  }, []);

  // The router's usePathname catches up asynchronously after our own
  // pushState; consume that sync instead of treating it as external.
  useEffect(() => {
    const href = hrefForView(route.view, {
      slug: route.slug,
      analysisId: route.analysisId,
      profileType: route.profileType,
    }) + (route.hash ? `#${route.hash}` : "");
    if (expectedHrefRef.current === href) {
      expectedHrefRef.current = null;
      return;
    }
    const current = shellRef.current;
    const inSync =
      route.view === current.view &&
      (route.view !== "caseStudyDetail" || route.slug === current.detailSlug) &&
      (route.view !== "profile" || route.profileType === current.profileType);
    if (inSync && !busyRef.current) return;

    runIdRef.current += 1;
    busyRef.current = false;
    dispatch({
      type: "snap",
      view: route.view,
      slug: route.slug,
      analysisId: route.analysisId,
      profileType: route.profileType,
    });
  }, [route]);

  /* ── Pending-anchor resolution: scroll only once the destination
   * content is actually mounted (bounded retry, no fixed delays). ──── */

  useEffect(() => {
    if (!pendingAnchor) return;
    const behavior: ScrollBehavior = reducedMotionRef.current ? "auto" : "smooth";
    if (scrollToSection(pendingAnchor, behavior)) {
      setPendingAnchor(null);
      anchorRetryRef.current = 0;
      return;
    }
    if (anchorRetryRef.current >= ANCHOR_MAX_TRIES) {
      setPendingAnchor(null);
      anchorRetryRef.current = 0;
      return;
    }
    anchorRetryRef.current += 1;
    const retry = window.setTimeout(() => {
      pendingTimersRef.current = pendingTimersRef.current.filter((t) => t !== retry);
      // Re-attempt by nudging state through a fresh render cycle.
      setPendingAnchor((current) => (current === pendingAnchor ? current : current));
    }, ANCHOR_RETRY_MS);
    pendingTimersRef.current.push(retry);
    return () => window.clearTimeout(retry);
  }, [pendingAnchor, shell, detail, profile, citationRows]);

  /* ── Side effects ──────────────────────────────────────────────────── */

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = query.matches;
    const onChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (analysisPhase !== "submitting" && analysisPhase !== "loading") return;
    const timer = window.setInterval(
      () => setMessageIndex((current) => (current + 1) % loadingMessages.length),
      2600,
    );
    return () => window.clearInterval(timer);
  }, [analysisPhase]);

  useEffect(
    () => () => {
      requestRef.current?.abort();
      runIdRef.current += 1;
      for (const timer of pendingTimersRef.current) window.clearTimeout(timer);
    },
    [],
  );

  // Initial focus: the textarea on the homepage, the view heading on a
  // direct subpage visit (which starts expanded, with no entrance animation).
  useEffect(() => {
    if (shellRef.current.view !== "home") {
      const view = shellRef.current.view;
      const id = window.setTimeout(
        () => focusAfterTransition(view, { view: "home" }),
        reducedMotionRef.current ? 0 : 60,
      );
      return () => window.clearTimeout(id);
    }
    if (window.matchMedia("(min-width: 1050px)").matches) inputRef.current?.focus();
  }, [focusAfterTransition]);

  /* ── Analysis flow ─────────────────────────────────────────────────── */

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!value.trim() || analysisPhase !== "idle" || busyRef.current) return;
    dispatch({ type: "analysisError", message: null });
    setMessageIndex(0);
    dispatch({ type: "analysisPhase", phase: "submitting" });
    setAnnounce("Analyzing fit…");

    const controller = new AbortController();
    requestRef.current = controller;
    const request = (async () => {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: value }),
        signal: controller.signal,
      });
      const data = (await response.json()) as { id?: string; error?: string };
      if ((!response.ok && response.status !== 202) || !data.id) {
        dispatch({
          type: "analysisError",
          message: data.error ?? "Analysis failed. Please try again.",
        });
        setAnnounce("Analysis failed");
        return;
      }
      dispatch({ type: "analysisPhase", phase: "loading" });
      dispatch({ type: "attachAnalysis", analysisId: data.id });
      const href = `/analysis/${data.id}`;
      expectedHrefRef.current = href;
      window.history.pushState({}, "", href);
    })().catch((caught: unknown) => {
      if ((caught as Error).name === "AbortError") return;
      dispatch({
        type: "analysisError",
        message: "Something went wrong. Check your connection and try again.",
      });
      setAnnounce("Analysis failed");
    });

    await Promise.all([request, transitionTo({ view: "analysis" })]);
  }

  function openAnalysisBack() {
    if (shellRef.current.view !== "analysis" || busyRef.current) return;
    dispatch({ type: "analysisPhase", phase: "idle" });
    dispatch({ type: "analysisError", message: null });
    requestRef.current?.abort();
    void transitionTo({ view: "home" });
  }

  function retryAnalysis() {
    if (busyRef.current) return;
    dispatch({ type: "analysisPhase", phase: "idle" });
    dispatch({ type: "analysisError", message: null });
    void transitionTo({ view: "home" });
  }

  /* ── Render ──────────────────────────────────────────────────────────
   *
   * Two permanent panel containers. The sidebar and job form always stay
   * mounted; expanded content mounts only for the active mode. The main
   * nav (sidebar + mobile bar) is HOME chrome only.
   */

  const sideInteractive = (side: ShellMode) =>
    (shell.motionPhase === "settled" || shell.motionPhase === "revealing") && shellMode === side;
  const homeInteractive =
    shellMode === "home" && (shell.motionPhase === "settled" || shell.motionPhase === "revealing");
  // Global nav is home-only chrome: hidden whenever another view owns
  // the shell (or home is mid-transition).
  const showHomeNavigation = shellMode === "home" && shell.motionPhase === "settled";

  return (
    <main className="portfolio-frame">
      <div
        className="portfolio-card"
        ref={cardRef}
        data-shell-mode={shellMode}
        data-motion-phase={shell.motionPhase}
        data-nav={showHomeNavigation ? "visible" : "hidden"}
      >
        <div className="mobile-portfolio-nav" inert={!showHomeNavigation}>
          <PortfolioNav onNavigate={openView} />
        </div>

        <div className="shell-left-panel">
          <div className="home-left-content" inert={!homeInteractive}>
            <aside className="portfolio-sidebar">
              <button
                type="button"
                className="portfolio-name"
                onClick={() => openView({ view: "home" })}
              >
                {candidate.name}
              </button>
              <p className="portfolio-bio">
                I&apos;m a self-taught product engineer and multidisciplinary builder. I&apos;ve
                spent most of my career at startups, turning loose ideas into real products and
                figuring out whatever I need to learn along the way.
                <br />
                <br />
                My interests have taken me across AI, open-source development, game design, audio
                software, and design, with a liberal arts background that shapes how I think about
                all of it.
              </p>
              <div className="portfolio-rule" />
              <div className="desktop-portfolio-nav" inert={!showHomeNavigation}>
                <PortfolioNav onNavigate={openView} />
              </div>
            </aside>
          </div>
          <div className="mobile-expand" data-side="left" data-open={shellMode === "portfolio"}>
            <div className="mobile-expand-clip">
              <div className="expanded-left-content" inert={!sideInteractive("portfolio")}>
                {shellMode === "portfolio" ? (
                  <ExpandedView
                    key={shell.view + (shell.detailSlug ?? "") + (shell.profileType ?? "")}
                    view={shell.view}
                    caseStudies={caseStudies}
                    detail={detail}
                    profile={profile}
                    onBack={() =>
                      openView(
                        shell.view === "caseStudyDetail"
                          ? { view: "caseStudies" }
                          : { view: "home" },
                      )
                    }
                    onOpenDetail={(slug) => openView({ view: "caseStudyDetail", slug })}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="shell-divider" aria-hidden="true" />

        <div className="shell-right-panel">
          <div className="home-right-content" inert={!homeInteractive}>
            <form onSubmit={submit} className="job-form">
              <div className="job-input-region">
                <div className="job-writing-surface">
                  <label htmlFor="job-description" className="sr-only">
                    Job description
                  </label>
                  <textarea
                    ref={inputRef}
                    id="job-description"
                    aria-label="Job description"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    maxLength={MAX_LENGTH}
                    placeholder=""
                  />
                  {!value ? (
                    <div className="job-placeholder" aria-hidden="true">
                      <span className="job-placeholder-primary">Paste a job description...</span>
                      <span className="job-placeholder-secondary">
                        I’ll compare it to my work and tell you where I fit.
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="job-counter-row" aria-hidden="true">
                  <span>
                    {value.length}/{MAX_LENGTH}
                  </span>
                </div>
              </div>
              <div className="input-footer">
                {error ? (
                  <div className="form-error" role="alert">
                    <span>{error}</span>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "analysisPhase", phase: "idle" })}
                    >
                      Try again
                    </button>
                  </div>
                ) : null}
                <button
                  className="analyze-button"
                  type="submit"
                  disabled={!value.trim() || analysisPhase !== "idle"}
                >
                  Analyze Fit
                </button>
              </div>
            </form>
          </div>
          <div className="mobile-expand" data-side="right" data-open={shellMode === "analysis"}>
            <div className="mobile-expand-clip">
              <div className="expanded-right-content" inert={!sideInteractive("analysis")}>
                {shellMode === "analysis" ? (
                  <AnalysisWorkspace
                    analysis={analysis}
                    status={analysisStatus?.status}
                    phase={analysisPhase}
                    message={loadingMessages[messageIndex]}
                    onBack={openAnalysisBack}
                    onRetry={retryAnalysis}
                    citationContext={citationContext}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {shell.view === "analysis" && analysis && analysisPhase !== "error"
            ? "Analysis ready"
            : announce}
        </p>
      </div>
    </main>
  );
}

function AnalysisWorkspace({
  analysis,
  status,
  phase,
  message,
  onBack,
  onRetry,
  citationContext,
}: {
  analysis: DisplayAnalysis | null | undefined;
  status?: string;
  phase: AnalysisPhase;
  message: string;
  onBack: () => void;
  onRetry: () => void;
  citationContext: CitationDisplayContext;
}) {
  return (
    <section
      className="portfolio-expanded-content analysis-workspace"
      tabIndex={-1}
      aria-label="Analysis"
    >
      {analysis ? (
        <div className="content-enter" key="results">
          <AnalysisToolbar onBack={onBack} />
          <AnalysisContent
            analysis={analysis}
            context={citationContext}
          />
        </div>
      ) : status === "failed" || phase === "error" ? (
        <div className="content-enter" key="error">
          <AnalysisToolbar onBack={onBack} />
          <div className="analysis-state">
            <h1>Analysis failed</h1>
            <p>Something went wrong while analyzing this job description.</p>
            <button type="button" onClick={onRetry}>
              Try again
            </button>
          </div>
        </div>
      ) : (
        <div className="analysis-loading-shell content-enter" key="loading">
          <LoadingState message={message} />
        </div>
      )}
    </section>
  );
}

function PortfolioNav({ onNavigate }: { onNavigate: (target: NavigationTarget) => void }) {
  const items: Array<{ label: string; target: NavigationTarget }> = [
    { label: "Home", target: { view: "home" } },
    { label: "Case Studies", target: { view: "caseStudies" } },
    { label: "How I Work", target: { view: "howIWork" } },
    { label: "Technical Profile", target: { view: "profile", profileType: "technical" } },
    { label: "Downloads", target: { view: "downloads" } },
  ];
  return (
    <nav className="portfolio-nav" aria-label="Primary">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          data-nav-view={item.target.view + (item.target.profileType ? `:${item.target.profileType}` : "")}
          onClick={() => onNavigate(item.target)}
        >
          {item.label}
        </button>
      ))}
      <a href="https://github.com/ReggieSackey" target="_blank" rel="noopener noreferrer">
        GitHub
      </a>
      {candidate.contactEmail ? (
        <a className="mail-link" href={`mailto:${candidate.contactEmail}`} aria-label="Email Reg">
          <span aria-hidden="true">✉</span>
        </a>
      ) : null}
    </nav>
  );
}

type PublishedStudy = {
  _id: string;
  slug: string;
  title: string;
  companyOrProject: string;
  summary: string;
};
type DetailData = {
  caseStudy: { title: string; companyOrProject: string; summary: string };
  sections: Array<{ _id: string; slug: string; heading: string; body: string }>;
} | null | undefined;
type ProfileData = {
  document: { title: string };
  sections: Array<{ _id: string; slug: string; heading: string; body: string }>;
} | null | undefined;

function ExpandedView({
  view,
  caseStudies,
  detail,
  profile,
  onBack,
  onOpenDetail,
}: {
  view: ShellView;
  caseStudies: PublishedStudy[] | undefined;
  detail: DetailData;
  profile: ProfileData;
  onBack: () => void;
  onOpenDetail: (slug: string) => void;
}) {
  const isProfileView = view === "howIWork" || view === "profile";
  const title =
    view === "caseStudyDetail"
      ? (detail?.caseStudy.title ?? "Case study")
      : isProfileView
        ? (profile?.document.title ?? "Profile")
        : view === "downloads"
          ? "Downloads"
          : "Case Studies";
  const sections = view === "caseStudyDetail" ? detail?.sections : isProfileView ? profile?.sections : null;
  return (
    <section className="portfolio-expanded-content content-enter" aria-labelledby="expanded-title">
      <div className="expanded-toolbar">
        <h1 id="expanded-title" tabIndex={-1}>
          {title}
        </h1>
        <button type="button" onClick={onBack}>
          ← Back
        </button>
      </div>
      {view === "caseStudies" ? (
        <div className="case-study-grid">
          {caseStudies?.map((study) => (
            <button
              type="button"
              key={study._id}
              className="case-study-card"
              onClick={() => onOpenDetail(study.slug)}
            >
              <h2>{study.title}</h2>
              <span>{study.companyOrProject}</span>
              <p>{study.summary}</p>
            </button>
          ))}
        </div>
      ) : view === "downloads" ? (
        <div className="expanded-copy">
          <p>Downloadable materials will be available here.</p>
        </div>
      ) : (
        <div className="expanded-sections">
          {detail?.caseStudy ? (
            <>
              <p className="expanded-meta">{detail.caseStudy.companyOrProject}</p>
              <p className="expanded-summary">{detail.caseStudy.summary}</p>
            </>
          ) : null}
          {sections?.map((section) => (
            <article key={section._id} id={section.slug}>
              <h2>{section.heading}</h2>
              <SectionBody body={section.body} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="loading-state">
      <div className="liquid-orb" aria-hidden="true" />
      <p>{message}</p>
      <div className="loading-dots" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <span className="sr-only">Analysis in progress</span>
    </div>
  );
}
