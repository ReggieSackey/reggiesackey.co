import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const toolbarPath = fileURLToPath(new URL("../../../components/AnalysisToolbar.tsx", import.meta.url));
const source = readFileSync(toolbarPath, "utf8");

describe("analysis toolbar icons", () => {
  it("no longer uses unicode glyph icons", () => {
    for (const glyph of ["▧", "▣", "♧", "⌄", "⌘", "✉", "←"]) {
      expect(source).not.toContain(glyph);
    }
  });

  it("renders inline SVG icons for every action", () => {
    for (const icon of ["DownloadIcon", "CopyIcon", "ShareIcon", "ChevronDownIcon", "LinkIcon", "MailIcon", "ArrowLeftIcon"]) {
      expect(source).toContain(`function ${icon}`);
    }
    // Consistent stroke system across the set
    const strokes = source.match(/strokeWidth="1\.75"/g) ?? [];
    expect(strokes.length).toBeGreaterThanOrEqual(7);
    expect(source).not.toContain('fill="currentColor"');
  });

  it("icons are hidden from assistive tech (labels carry meaning)", () => {
    const ariaHidden = source.match(/aria-hidden="true"/g) ?? [];
    expect(ariaHidden.length).toBeGreaterThanOrEqual(7);
  });

  it("share button has menu semantics and a flex-aligned caret", () => {
    expect(source).toContain('aria-haspopup="menu"');
    expect(source).toContain('aria-expanded={open}');
    expect(source).toMatch(/toolbar-share-button/);
    expect(source).toMatch(/<span className="toolbar-caret">\s*<ChevronDownIcon \/>/);
  });
});

describe("email analysis mailto", () => {
  it("builds the mailto with the exact subject and body copy", () => {
    expect(source).toContain('const subject = "Check out Reggie\'s profile"');
    expect(source).toContain('"I thought you might want to take a look at this analysis of Reggie\'s fit for the role:"');
    expect(source).toMatch(/join\("\\n"\)/);
  });

  it("uses the live browser URL, not a model-generated or relative one", () => {
    expect(source).toContain("window.location.href");
    expect(source).not.toMatch(/analysis\.\$|data\.id.*mailto/);
  });

  it("encodes subject and body via encodeURIComponent", () => {
    expect(source).toMatch(/mailto:\?subject=\$\{encodeURIComponent\(subject\)\}&body=\$\{encodeURIComponent\(body\)\}/);
  });

  it("is a plain anchor — no form submission, no window.open, no API call", () => {
    expect(source).toMatch(/<a role="menuitem" href=\{emailHref\}/);
    expect(source).not.toContain("window.open");
    expect(source).not.toMatch(/fetch\(|\/api\//);
  });
});
