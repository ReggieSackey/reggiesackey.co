"use client";
import { useState } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { capabilityProposalSchema } from "@/lib/ai/capabilitySchemas";

export default function CapabilitiesPage() {
  const { isAuthenticated } = useConvexAuth();
  const data = useQuery(
    api.capabilities.adminList,
    isAuthenticated ? {} : "skip",
  );
  const review = useMutation(api.capabilities.review);
  const deactivate = useMutation(api.capabilities.deactivate);
  const stageCanonical = useMutation(api.capabilities.stageCanonicalBootstrap);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [merges, setMerges] = useState<
    Record<string, Id<"capabilities"> | undefined>
  >({});
  async function generate() {
    setBusy(true);
    setMessage("Generating proposals from published evidence…");
    try {
      const response = await fetch("/api/admin/capabilities", {
        method: "POST",
      });
      const body = await response.json();
      setMessage(
        response.ok ? `${body.count} proposals ready for review.` : body.error,
      );
    } catch {
      setMessage("Generation failed. Try again later.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Capabilities</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Review interpretations of published evidence. Generation never
          replaces the active registry. Edit the JSON fields and references
          before approval; merge related concepts explicitly.
        </p>
      </div>
      <button
        disabled={busy}
        onClick={generate}
        className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
      >
        Generate proposals
      </button>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const result = await stageCanonical({});
            setMessage(`${result.staged} canonical capabilities staged for review; ${result.skipped} already pending.`);
          } catch {
            setMessage("Unable to stage the canonical registry. Verify published evidence references.");
          } finally {
            setBusy(false);
          }
        }}
        className="ml-3 rounded border border-neutral-300 px-4 py-2 disabled:opacity-50"
      >
        Stage canonical registry
      </button>
      <p role="status" className="text-sm">
        {message}
      </p>
      {!data ? (
        <p>Loading…</p>
      ) : (
        <>
          <h2 className="text-lg font-semibold">
            Pending review ({data.proposals.length})
          </h2>
          {data.proposals.map((p) => {
            const original = {
              slug: p.slug,
              title: p.title,
              description: p.description,
              tags: p.tags,
              evidence: p.evidence,
            };
            const text = drafts[p._id] ?? JSON.stringify(original, null, 2);
            async function decide(decision: "approve" | "reject") {
              setBusy(true);
              try {
                const edited = capabilityProposalSchema.parse(
                  JSON.parse(
                    decision === "reject" ? JSON.stringify(original) : text,
                  ),
                );
                await review({
                  id: p._id,
                  decision,
                  edited,
                  mergeInto: merges[p._id],
                });
                setMessage(decision === "approve" ? "Approved." : "Rejected.");
              } catch {
                setMessage(
                  "Review failed. Check JSON, duplicate slugs, published references, and whether the corpus changed.",
                );
              } finally {
                setBusy(false);
              }
            }
            return (
              <section
                key={p._id}
                className="space-y-3 rounded border border-neutral-200 p-5"
              >
                <h3 className="font-medium">{p.title}</h3>
                <label className="block text-sm">
                  Capability and evidence references
                  <textarea
                    aria-label={`Edit ${p.title}`}
                    rows={15}
                    className="mt-2 w-full rounded border p-3 font-mono text-xs"
                    value={text}
                    onChange={(e) =>
                      setDrafts({ ...drafts, [p._id]: e.target.value })
                    }
                  />
                </label>
                <label className="block text-sm">
                  Merge into{" "}
                  <select
                    value={merges[p._id] ?? ""}
                    className="ml-2 border p-2"
                    onChange={(e) => {
                      const target = data.capabilities.find(
                        (c) => c.id === e.target.value,
                      );
                      setMerges({ ...merges, [p._id]: target?.id });
                      if (target) {
                        const refs = [...target.evidence, ...p.evidence];
                        const evidence = [
                          ...new Map(
                            refs.map((r) => [
                              JSON.stringify([
                                r.sourceType,
                                r.sourceId,
                                r.sectionId,
                              ]),
                              r,
                            ]),
                          ).values(),
                        ];
                        setDrafts({
                          ...drafts,
                          [p._id]: JSON.stringify(
                            {
                              slug: target.slug,
                              title: target.title,
                              description: target.description,
                              tags: target.tags,
                              evidence,
                            },
                            null,
                            2,
                          ),
                        });
                      } else
                        setDrafts({
                          ...drafts,
                          [p._id]: JSON.stringify(original, null, 2),
                        });
                    }}
                  >
                    <option value="">Create a new capability</option>
                    {data.capabilities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="text-xs text-neutral-500">
                  Merging preloads both evidence sets. Approval replaces the
                  target with the edited fields shown above.
                </p>
                <div className="flex gap-4">
                  <button
                    disabled={busy}
                    className="rounded bg-neutral-900 px-4 py-2 text-white"
                    onClick={() => decide("approve")}
                  >
                    Approve
                  </button>
                  <button disabled={busy} onClick={() => decide("reject")}>
                    Reject
                  </button>
                </div>
              </section>
            );
          })}
          <h2 className="text-lg font-semibold">
            Active registry ({data.capabilities.length})
          </h2>
          {data.capabilities.map((c) => (
            <section key={c.id} className="border-t py-4">
              <h3 className="font-medium">{c.title}</h3>
              <p className="my-2 text-sm">{c.description}</p>
              <ul className="text-xs text-neutral-500">
                {c.evidence.map((e) => (
                  <li key={`${e.sourceType}:${e.sourceId}:${e.sectionId}`}>
                    {e.sourceType} / {e.sourceId} / {e.sectionId}: {e.note}
                  </li>
                ))}
              </ul>
              <button
                className="mt-3 text-sm underline"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await deactivate({ id: c.id });
                    setMessage("Deactivated.");
                  } catch {
                    setMessage("Unable to deactivate.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Deactivate
              </button>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
