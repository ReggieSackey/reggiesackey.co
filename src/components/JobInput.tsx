"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MAX_LENGTH = 15_000;

export function JobInput() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  const disabled = status === "submitting";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (disabled) return;

    setError(null);
    setStatus("submitting");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: value }),
      });
      const data = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !data.id) {
        setError(data.error ?? "Analysis failed. Please try again.");
        setStatus("idle");
        return;
      }
      router.push(`/analysis/${data.id}`);
    } catch {
      setError("Something went wrong. Check your connection and try again.");
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative">
        <label htmlFor="job-description" className="sr-only">
          Job description
        </label>
        <textarea
          id="job-description"
          name="job-description"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste the job description here…"
          rows={12}
          maxLength={MAX_LENGTH}
          disabled={disabled}
          className="job-input w-full rounded-sm border border-neutral-300 bg-white px-4 py-3.5 text-[15px] leading-7 text-neutral-900 placeholder:text-neutral-400 disabled:opacity-60"
        />
        <span className="absolute bottom-3 right-4 text-[12px] tabular-nums text-neutral-400">
          {value.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
        </span>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-neutral-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={disabled || value.trim().length === 0}
          className="inline-flex h-11 items-center justify-center rounded-sm bg-neutral-900 px-6 text-sm font-medium text-white disabled:opacity-50"
        >
          {disabled ? "Analyzing…" : "Analyze"}
        </button>
        <button
          type="button"
          title="File upload coming later"
          className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-sm border border-neutral-300 bg-white px-6 text-sm font-medium text-neutral-400"
        >
          Upload file
        </button>
      </div>
    </form>
  );
}
