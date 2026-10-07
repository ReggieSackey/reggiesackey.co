# Security and threat model

Security does not depend on hiding prompts, schemas, code, or thresholds. This is a single-candidate, anonymous public analysis application with an authenticated content administration surface.

## Boundaries

Untrusted: public HTTP requests, pasted JDs, client state, model responses, and capability proposals. Structured requirements remain semantically untrusted even after shape validation; conversion to JSON does not eliminate prompt injection.

Trusted: server application code, validated deployment configuration, published canonical Convex evidence, and reviewed capability relationships validated against that evidence. Content administrators and deployment operators can change the truth source and must be trusted accordingly.

Only Next.js holds the Z.AI credential. A separate random server credential protects analysis lifecycle, cache, limiter, and lease functions in Convex; knowing public function names or an analysis ID is insufficient to write a result. WorkOS identity and the Convex `users` role authorize every registry administration operation. The first-admin bootstrap must be disabled after initial setup.

## Threats and controls

| Threat                                                           | Implemented boundary                                                                                                                                                                                                              |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prompt injection / requests for secrets or fabricated experience | Bounded structured decision output; exact capability allowlist; application-owned evidence resolution, requirement allocation, fit planning, and citations; synthesis has no tools, secrets in prompts, or side effects. No claim that text instructions alone prevent injection.      |
| Fabricated citations / quotes                                    | Exact composite source identity against the supplied package and whitespace-normalized substring quote verification.                                                                                                              |
| Unsupported advocacy                                             | Reject forged citations, unverifiable quotes, duplicate theme IDs, and non-gap themes with no valid citation. Complete, unique requirement coverage is mandatory. Semantic entailment remains a model-quality risk.               |
| Output injection / XSS                                           | React text rendering; no generated HTML execution or Markdown link/image interpretation. Citation paths are encoded and built from internal IDs.                                                                                  |
| Flooding / credit exhaustion                                     | Shared Convex token buckets before corpus/model work; HMAC client keys; per-minute and hourly refill policies; hard global daily call allowance and global concurrent leases.                                                     |
| Oversized / slow input                                           | JSON-only requests; streamed 96 KB body limit, 10-second read deadline, 100–15,000 raw/normalized JD characters; bounded corpus, registry, retrieval, schemas and model outputs.                                                  |
| Retry amplification                                              | `maxRetries: 0`; at most 3 calls across a request, including one shared serialization/shape repair. Provider, grounding, and coverage failures are not retried.                                                                   |
| Provider failure                                                 | 80-second timeout per call; generic client errors; daily allowance retained; failure circuit breaker; leases expire after 5 minutes.                                                                                              |
| Leaked credentials / private content                             | Server-only model module; ignored environment files; placeholder example; no raw JD persistence on new analyses; allowlisted numeric telemetry; heuristic full-history scan and Gitleaks CI.                                      |
| Stale analysis                                                   | SHA-256 of published bodies/headings/identities and active capabilities/relationships, plus normalized JD hash, contract version, candidate configuration, matcher, model and reasoning settings. Validate snapshot again after synthesis. |

## Rate and budget semantics

On Vercel, use `x-vercel-forwarded-for` only when the platform sets `VERCEL=1`; ignore arbitrary `x-forwarded-for`. IPv6 clients share a /64 quota. Outside Vercel, development shares one local bucket and production fails closed until a trusted adapter is implemented. Never set `VERCEL=1` just to bypass that restriction. A reverse proxy in front of Vercel can group clients under the proxy's address; configure and test your actual ingress. See [Vercel request header semantics](https://vercel.com/docs/headers/request-headers).

Token buckets enforce refill rates, not an exact sliding-window count: an idle client may consume a full bucket and then use replenished tokens. All requests, including cache hits and invalid bodies, consume admission quota. Clean rejections use 429 and `Retry-After`. Budget, concurrency, configuration, and provider unavailability use 503.

Each admitted uncached run atomically reserves **3 model-call units** before spending. The UTC daily allowance is a hard usage ceiling, not a dollar-denominated billing ledger. Reservations are never refunded, even if only two calls were needed or the process died. With bounded input/output sizes and a known provider price this bounds exposure conservatively; provider pricing changes still require review. Admin capability generation shares the same budget and concurrency pool. Completed cache hits consume no model budget; concurrent identical JDs reuse the processing ID.

Expired leases are cleaned opportunistically, and failed processes cannot retain concurrent capacity indefinitely. The circuit opens after configured consecutive failures and allows a new attempt after five minutes; budget and concurrency still apply. It tracks failed analyses rather than perfectly distinguishing provider failures from validation failures.

## Grounding failure decision

The public path rejects an analysis if a non-gap theme lacks citations or any cited identity is forged. Theme membership, fit, and citations are fixed by application code before prose generation; quotes are no longer generated. It does not generate a semantic repair: deleting a theme breaks complete coverage, while generic replacement text weakens advocacy and may leave the overall thesis unsupported. The legacy validator's strip/downgrade behavior remains in the preserved baseline for comparison; `assertGroundedFit` runs first on every new public analysis. Review this quality boundary when evaluating results.

## Residual risks and operations

- A valid citation proves an address exists, not that every narrative claim follows from it. Injection can still influence semantic judgments. Human review and representative evaluations remain necessary.
- Anonymous quotas can be evaded across networks. NAT users share quota. Use Vercel firewall/DDoS controls to protect function and Convex execution costs; application limits do not make infrastructure requests free.
- The small corpus is scanned within Convex to compute a fingerprint. It is bounded and fails on overflow; this is intentionally simpler than a version-update hook that dashboard edits could bypass. No source bodies cross to the synthesis model unless selected.
- Existing analyses are public by unguessable ID, and compatible JDs share results. Job titles/company and model-derived requirements may disclose JD content. Do not paste confidential JDs. New raw JDs are not stored; old rows may still contain them and need an explicit retention/purge decision before a database export or public data release.
- Cache invalidation prevents reuse of stale results; historical result URLs remain snapshots and may cite sources edited later. Versioned archival evidence and a retention UI are deferred.
- HMAC client keys and old result/budget rows require an operational retention policy; automated long-term pruning is deferred. Expired leases are bounded opportunistically. Rotation of the HMAC salt resets per-client buckets.
- Loss of a shared datastore fails closed. A function may time out after its provider request was accepted; the full reservation remains charged.
- The browser admin editor is intentionally compact JSON editing. Never approve generated proposals without inspecting references and merging synonymous concepts.
- Credential scanning is heuristic and CI has not run until pushed. Rotate any credential ever committed; deleting its latest occurrence is insufficient.

Tests cover actual authorization, decision allowlists, request limits, shared quotas, cache invalidation, budgets, concurrency, circuit state, provider failure, single-repair bounds, coverage, citation/quote forgery, and escaped output. They do not assert that a defensive prompt sentence makes a model secure.
