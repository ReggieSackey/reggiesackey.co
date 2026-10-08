"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export function AnalysisToolbar() {
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

  const emailHref = `mailto:?subject=${encodeURIComponent("Check out Reggie's profile")}&body=${encodeURIComponent(`Check out Reggie's profile:\n\n${typeof window === "undefined" ? "" : window.location.href}`)}`;

  return (
    <div className="analysis-toolbar">
      <Link href="/" className="toolbar-button">← <span>Back to home</span></Link>
      <div className="toolbar-actions">
        <button type="button" className="toolbar-button" onClick={() => window.print()}>▧ <span>Download PDF</span></button>
        <button type="button" className="toolbar-button" onClick={copyAnalysis}>▣ <span>{copied ? "Copied" : "Copy analysis"}</span></button>
        <div ref={menuRef} className="share-wrap">
          <button type="button" className="toolbar-button" aria-expanded={open} onClick={() => setOpen((current) => !current)}>♧ <span>Share</span>⌄</button>
          {open ? <div className="share-menu" role="menu"><button type="button" role="menuitem" onClick={shareUrl}>⌘ <span>Copy link to analysis</span></button><a role="menuitem" href={emailHref} onClick={() => setOpen(false)}>✉ <span>Email analysis</span></a></div> : null}
        </div>
      </div>
    </div>
  );
}
