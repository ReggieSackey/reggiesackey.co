/**
 * Job description normalization (pure, testable).
 *
 * Normalization is deliberately conservative: collapse runaway
 * whitespace runs, strip zero-width/control characters, and trim.
 * We do NOT remove content — the model should see what the user pasted.
 */

export const MAX_JD_LENGTH = 15_000;
export const MIN_JD_LENGTH = 100;

export function normalizeJobDescription(input: string): string {
  return input
    // zero-width and control chars except newline/tab
    .replace(/[\u200B-\u200D\uFEFF\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    // collapse 3+ blank lines to 2
    .replace(/\n{3,}/g, "\n\n")
    // collapse runs of spaces/tabs (not newlines) to one space
    .replace(/[^\S\n]+/g, " ")
    .trim();
}

/** Stable hash of the normalized JD (hex). */
export async function hashJobDescription(normalized: string): Promise<string> {
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
