# Live benchmark results — October 6, 2026

Three synthetic roles are committed in `src/lib/ai/__tests__/benchmarkJobs.ts`: product engineering, AI application engineering, and infrastructure engineering. All runs used the configured Z.AI `glm-5.3-flash` model at low reasoning effort and the same published development corpus. This is a small exploratory benchmark, **not a statistically controlled quality or latency evaluation**.

## Retained default: targeted evidence with the original writing guidance

| Role            | Baseline total | Targeted total | Decision | Synthesis | Baseline → targeted input tokens | Baseline → targeted output tokens | Valid baseline → targeted |
| --------------- | -------------: | -------------: | -------: | --------: | -------------------------------: | --------------------------------: | ------------------------- |
| Product         |       72.040 s |       58.417 s |  7.991 s |  50.425 s |                    9,396 → 7,765 |                     3,067 → 2,882 | yes → yes                 |
| AI applications |       99.119 s |       62.106 s | 10.340 s |  51.765 s |                   11,756 → 8,286 |                     5,058 → 2,780 | no → yes                  |
| Infrastructure  |       58.286 s |       54.983 s | 11.890 s |  43.092 s |                    9,454 → 7,216 |                     2,488 → 2,429 | no → yes                  |

Files: `baseline.json`, `targeted.json`. Baseline model calls were 2 / 3 / 2, including 0 / 1 / 0 repairs. Targeted calls were 2 / 2 / 2 with no repairs. Failed baseline attempts are retained and must not be presented as successful-result latency. On the one role that completed in both paths, elapsed time fell **18.9%** and input tokens fell **17.4%**. Across all attempts, input-token reductions were 17.4%, 29.5%, and 23.7%.

The baseline includes live public corpus retrieval, model calls, and deterministic validation. It uses the instrumented original extraction/full-corpus algorithm, with explicit no-retry and resource caps added for safe measurement. It is not a byte-for-byte replay of the earlier SDK retry defaults.

Targeted measurements include the actual matcher, actual synthesis, and validation. Capability proposals were generated once from the published corpus and validated against actual section identities. For a reproducible comparison **the proposal registry and evidence resolution were held in memory**, not approved into the live registry. Thus the targeted figures exclude the Convex snapshot/retrieval network calls. Both paths exclude HTTP parsing, rate admission, creation, persistence, and rendering. The public route separately instruments those stages; production end-to-end latency remains unmeasured.

## Selection quality and registry review

The proposal artifact contains 18 durable concepts with verified canonical references; there are no hand-coded technology labels or vector search. Selection was qualitatively plausible:

- Product: ownership under ambiguity, integration, debugging, data modeling, consumer products, learning, and production ownership; 13 sections / 10,765 body characters.
- AI: application AI, context/retrieval, model-independent architecture, integrations, data, debugging, and ownership; 15 sections / 11,875 characters.
- Infrastructure: adjacent production ownership, cross-system debugging, background workflows and technical judgment; 11 sections / 8,510 characters. Selecting adjacent capabilities is not proof of direct Kubernetes/AWS/Kafka experience. The retained profile limitations matter here.

There is no labeled relevance gold set or recall metric. Some generated concepts overlap (whole-system reasoning, implementation judgment, ownership; and several AI concepts). They need administrator consolidation before production activation. The benchmark does **not** silently approve or replace the live registry.

The small corpus is still scanned in Convex for fingerprint correctness. This avoids stale caches when canonical records are edited directly. Only selected evidence is sent to synthesis; the model does not search the full corpus. A vector database is not justified by these measurements.

## Rejected latency tuning

`targeted-concise.json`: tighter 3–6 theme / shorter paragraph guidance reduced times to **40.759 / 40.111 / 34.402 seconds**, but the AI role failed grounding validation. The precise grounding subtype was not captured in that run.

`targeted-final.json` (historical experiment filename, **not the final chosen configuration**): preferring identifier-only citations yielded **40.326 / 32.220 / 47.030 seconds**. Product failed requirement coverage; infrastructure exhausted the single shared repair allowance. Only AI completed. These instructions were reverted. No extra repair was added to hide those failures.

`analysis-*.json` contains successful synthetic outputs captured during these tuning runs, not necessarily the retained-default run. They allow qualitative inspection, and are not approved candidate content or a claim of semantic correctness.

The final code retains the initial targeted writing guidance and bumps the contract version to invalidate experimental caches. Tiny one-run-per-role samples cannot prove a stable error rate; broaden quality evaluation before public rollout.

## Cache hit measurements

`cache.json` measures five live HTTPS queries to the protected completed-cache lookup on the configured **development** Convex deployment: **174, 94, 330, 97, 97 ms**; median **97 ms**. No model calls or repairs occurred. A validated synthetic result was stored with a unique `benchmark:` key, which cannot collide with the public SHA-256 cache keys. One synthetic result remains in development; no raw JD was stored.

This is **database lookup latency**, not full HTTP cache-hit latency: admission, the current evidence fingerprint, hashing, transport to the web server, and rendering add time. The test reserves three units under the real daily guard before persisting its fixture, even though it makes no provider calls.

## Remaining bottlenecks

Synthesis dominates at 43–52 seconds in the retained-default run; matching takes 8–12 seconds. There are still two sequential GLM requests. The architecture reduces input and enables instant model-free reuse, but **dramatically faster uncached analysis is not yet demonstrated**. A genuinely low-latency decision model, a shorter reliable synthesis contract, and larger quality/latency evaluation are the next measurement-driven options. Jev was not integrated; no authenticated Jev configuration was available or necessary for the existing-provider implementation.

## Performance pass — October 7, 2026

The retained files above were not changed. New `performance-*` files record each experiment, including exact deterministic failure codes. The final implementation builds a typed plan in application code: every requirement is assigned once; the matcher marks each requirement `direct`, `transferable`, or `gap`; theme titles, fit values, material-gap membership, and citation identities are fixed before prose generation. The model returns only an overall narrative, one narrative keyed by each planned theme ID, and up to three interview questions. Citations contain no generated quotes and are attached from the theme's reviewed evidence allowlist.

| Role | Retained targeted total | Final total | Matcher | Synthesis | Input tokens | Output tokens | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Product | 58.417 s | 14.008 s | 5.296 s | 8.707 s | 5,799 | 1,692 | pass |
| AI applications | 62.106 s | 15.264 s | 5.732 s | 9.530 s | 6,122 | 1,923 | pass |
| Infrastructure | 54.983 s | 20.775 s | 11.316 s | 9.458 s | 3,968 | 1,496 | pass |

Against the retained targeted run, total latency fell 76.0%, 75.4%, and 62.2%; synthesis latency fell 82.7%, 81.6%, and 78.1%. All final runs passed coverage and citation validation with two provider calls and no repair. The infrastructure result now reports an overall gap and preserves eight unmatched specialized requirements instead of treating generic learning or production ownership as direct Kubernetes/AWS/Terraform/Kafka evidence.

`performance-zai-planned.json`, `performance-zai-planned-v2.json`, and `performance-zai-planned-v3.json` preserve failed intermediate contracts. Their exact failures were `synthesis_theme_contract` and `forged_planned_citation`; those failures drove removal of model-owned theme allocation and citation selection. `performance-zai-planned-final.json` is the successful reduced-contract run on GLM-5.3-Flash. `performance-zai-flashx.json` compares the same contract on GLM-5.3-FlashX. `performance-final.json` is the definitive FlashX run with typed requirement fit decisions.

The [official Z.AI model documentation](https://docs.z.ai/guides/vlm/glm-5.3-flash) identifies `glm-5.3-flashx` as the same model family served at up to 200 tokens/second and supports JSON structured output, so it is now the default synthesis/matcher model. The public route keeps `maxDuration = 300`: the shared safety contract still permits three bounded 80-second provider calls (two primary calls and one repair), plus retrieval and persistence. Lowering the route limit below that worst-case bound would create an avoidable platform timeout before the application can fail closed.

The optional Jev matcher follows TypeSafe's current [`/v1/systemone` OpenAPI contract](https://api.typesafe.ai/docs) and defaults to `jev-latest`. It uses one request containing narrow `noul` and `choice` questions, then converts answers into the same `Decision` contract. No TypeSafe credential was configured, so `performance-jev.json` records `configuration_unavailable`; there are no invented Jev latency or quality numbers. Z.AI remains the matcher default until Jev completes the same live comparison.

## Success-profile iteration — October 7, 2026

This iteration replaces the generated benchmark proposal registry with the fixed 12-capability ontology. Matching now returns a job-level mission, concrete work, success drivers, conservative hard constraints, per-requirement fit, and compact role relevance for at most eight capabilities. Application code builds 3–6 value themes from work needs and capability combinations. Explicitly not-required skills are removed, stated preferences are not promoted to hard constraints, and unmatched preferred items cannot turn a supported core theme into a gap.

| Role | Previous final | Success-profile final | Matcher | Plan | Synthesis | Calls / repairs | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Product | 14.008 s | 19.526 s | 7.729 s | 3 ms | 11.790 s | 3 / 1 | pass |
| AI applications | 15.264 s | 16.349 s | 8.090 s | 3 ms | 8.255 s | 2 / 0 | pass |
| Infrastructure | 20.775 s | 22.251 s | 7.919 s | 3 ms | 14.327 s | 3 / 1 | pass |

The richer decision contract regressed total latency by 39.4% for Product and 7.1% for both AI and Infrastructure in this small sample. Planning remained effectively free. All three consolidated final results passed deterministic coverage and grounding; Product and Infrastructure used the one allowed structured-output repair. An additional full-run infrastructure attempt failed at `schema_validation`, demonstrating that the larger matcher contract remains less serialization-stable than the previous performance contract. The successful focused rerun is preserved rather than hiding that failure. See `success-profile-final-consolidated.json` and the source artifacts named inside it.

The representative broader live subset is in `success-profile-broad-final.json`: forward-deployed technical 17.699 s, technical product manager 16.577 s, automation systems 15.266 s, deep infrastructure 24.047 s, credentialed profession 8.599 s, and emerging agent-workflow role 16.462 s. All six passed deterministic validation. The unfamiliar emerging title produced four strong value themes; the credentialed and deep-infrastructure roles remained overall gaps with blocking constraints. The 15-fixture human-authored expectation set remains a conceptual evaluation suite rather than a claim that six live samples establish production accuracy.
