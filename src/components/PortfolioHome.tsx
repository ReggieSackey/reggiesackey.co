"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { candidate } from "@/config/candidate";
import { MAX_JD_LENGTH } from "@/lib/ai/jd";

const MAX_LENGTH = MAX_JD_LENGTH;
const loadingMessages = [
  "Contacting language model…",
  "Interpreting requirements…",
  "Gathering evidence…",
  "Comparing capabilities…",
  "Preparing analysis…",
];

type Phase = "idle" | "expanding" | "loading" | "error";

export function PortfolioHome() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (phase !== "loading" && phase !== "expanding") return;
    const timer = window.setInterval(
      () => setMessageIndex((current) => (current + 1) % loadingMessages.length),
      2600,
    );
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => () => requestRef.current?.abort(), []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!value.trim() || phase !== "idle") return;
    setError(null);
    setMessageIndex(0);
    setPhase("expanding");
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
      if (!response.ok || !data.id) {
        setError(data.error ?? "Analysis failed. Please try again.");
        setPhase("error");
        return;
      }
      setPhase("loading");
      window.setTimeout(() => router.push(`/analysis/${data.id}`), 700);
    } catch (caught) {
      if ((caught as Error).name === "AbortError") return;
      setError("Something went wrong. Check your connection and try again.");
      setPhase("error");
    }
  }

  const expanded = phase !== "idle";
  const showLoading = phase === "expanding" || phase === "loading";

  return (
    <main className="portfolio-frame">
      <div className={`portfolio-card ${expanded ? "is-expanded" : ""}`}>
        <aside className="portfolio-sidebar">
          <Link href="/" className="portfolio-name">{candidate.name}</Link>
          <p className="portfolio-bio">
            Non-traditional, self-taught product developer and builder.
            <br /><br />
            I use AI and software to turn ideas into real products, learn new domains quickly, and solve practical problems.
          </p>
          <div className="portfolio-rule" />
          <nav className="portfolio-nav" aria-label="Primary">
            <Link href="/">Home</Link>
            <Link href="/work">Case Studies</Link>
            <a href="https://github.com/reggiesackey">GitHub</a>
            <a href="/downloads">Downloads</a>
            {candidate.contactEmail ? <a className="mail-link" href={`mailto:${candidate.contactEmail}`} aria-label="Email Reg"><span aria-hidden="true">✉</span></a> : null}
          </nav>
        </aside>

        <section className={`portfolio-takeover ${expanded ? "is-active" : ""}`} aria-live="polite">
          {showLoading ? (
            <LoadingState message={loadingMessages[messageIndex]} />
          ) : (
            <div className="portfolio-form-wrap">
              <h1>Paste a job description</h1>
              <p>Get a clear, honest analysis of how my experience fits this role, based on real work I’ve done.</p>
              <form onSubmit={submit} className="job-form">
                <div className="job-textarea-wrap">
                  <label htmlFor="job-description" className="sr-only">Job description</label>
                  <textarea id="job-description" value={value} onChange={(event) => setValue(event.target.value)} maxLength={MAX_LENGTH} placeholder="Paste the job description here…" rows={8} />
                  <span>{value.length}/{MAX_LENGTH}</span>
                </div>
                {error ? <div className="form-error" role="alert"><span>{error}</span><button type="button" onClick={() => setPhase("idle")}>Try again</button></div> : null}
                <button className="analyze-button" type="submit" disabled={!value.trim() || phase !== "idle"}>Analyze Fit</button>
              </form>
            </div>
          )}
        </section>
      </div>
    </main>
  );
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
