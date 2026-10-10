"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/* Lightweight inline icon set — consistent stroke system, no icon
 * library dependency. Labels carry the meaning; icons are decorative. */

function DownloadIcon({ size = 18 }: { size?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function CopyIcon({ size = 18 }: { size?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

function ShareIcon({ size = 18 }: { size?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="m8.2 10.8 7.6-4.4" />
      <path d="m8.2 13.2 7.6 4.4" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 10 4 4 4-4" />
    </svg>
  );
}

function LinkIcon({ size = 18 }: { size?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" />
    </svg>
  );
}

function MailIcon({ size = 18 }: { size?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function ArrowLeftIcon({ size = 18 }: { size?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

export function AnalysisToolbar({ onBack }: { onBack?: () => void } = {}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // The mailto is built when the menu opens — always the live browser
  // URL of the persistent analysis, read at interaction time.
  const emailHref = useMemo(() => {
    const url = typeof window === "undefined" ? "" : window.location.href;
    const subject = "Check out Reggie's profile";
    const body = [
      "I thought you might want to take a look at this analysis of Reggie's fit for the role:",
      "",
      url,
    ].join("\n");
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function copyAnalysis() {
    const content = document.getElementById("analysis-content");
    if (!content) return;
    const html = content.innerHTML;
    const text = content.innerText;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) })]);
    } catch {
      await navigator.clipboard.writeText(text);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function shareUrl() {
    void navigator.clipboard.writeText(window.location.href);
    setOpen(false);
  }

  return (
    <div className="analysis-toolbar">
      {onBack ? (
        <button type="button" onClick={onBack} className="toolbar-button">
          <ArrowLeftIcon />
          <span>Back to home</span>
        </button>
      ) : (
        <Link href="/" className="toolbar-button">
          <ArrowLeftIcon />
          <span>Back to home</span>
        </Link>
      )}
      <div className="toolbar-actions">
        <button type="button" className="toolbar-button" onClick={() => window.print()}>
          <DownloadIcon />
          <span>Download PDF</span>
        </button>
        <button type="button" className="toolbar-button" onClick={copyAnalysis}>
          <CopyIcon />
          <span>{copied ? "Copied" : "Copy analysis"}</span>
        </button>
        <div ref={menuRef} className="share-wrap">
          <button
            type="button"
            className="toolbar-button toolbar-share-button"
            aria-expanded={open}
            aria-haspopup="menu"
            onClick={() => setOpen((current) => !current)}
          >
            <ShareIcon />
            <span>Share</span>
            <span className="toolbar-caret">
              <ChevronDownIcon />
            </span>
          </button>
          {open ? (
            <div className="share-menu" role="menu">
              <button type="button" role="menuitem" onClick={shareUrl}>
                <LinkIcon />
                <span>Copy link to analysis</span>
              </button>
              <a role="menuitem" href={emailHref} onClick={() => setOpen(false)}>
                <MailIcon />
                <span>Email analysis</span>
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
