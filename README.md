# reggiesackey.co

A single-candidate portfolio where a hiring manager pastes a job description and receives a truthful, evidence-backed hiring narrative. **Be conservative about facts. Be generous about interpretation.**

Next.js App Router, React, TypeScript, Convex, WorkOS AuthKit, Vercel AI SDK, Zod, and Z.AI / GLM. Hosted on Vercel. No vector database or mandatory additional model provider.

## Local setup

Use Node 24 and npm. Copy `.env.example` to `.env.local`; replace placeholders with your own development credentials. Never commit actual environment files.

```sh
npm ci
npx convex dev
# In a separate terminal:
npm run dev
```

1. Create a Convex project and personal development deployment. `npx convex dev` writes its deployment/URL into `.env.local` and installs the rate-limiter component defined by `convex/convex.config.ts`.
2. Configure WorkOS AuthKit: client ID, API key, random cookie password (32+ characters), and redirect URI `http://localhost:3000/callback`. Set that exact redirect in the WorkOS dashboard. Set `WORKOS_CLIENT_ID` on the matching Convex deployment for JWT verification.
3. Set `ZAI_API_KEY`. Default model is `glm-5.3-flash`, default reasoning effort `low`; JSON mode and reasoning configuration are applied by `src/lib/ai/model.ts`. `ZAI_BASE_URL` is optional server configuration, never client input.
4. Generate two independent random values (32+ characters): `ANALYSIS_SERVER_SECRET` and `ANALYSIS_IP_SALT`. Put both in Next.js environment; put the identical server secret on Convex. The helper below only targets a personal **development** deployment and does not print values:

```sh
node scripts/configure-dev-analysis.mjs
```

5. Bootstrap the first administrator: temporarily set `ADMIN_BOOTSTRAP_ENABLED=1` on your dev Convex deployment, visit `/admin`, sign in through WorkOS, and use **Become admin**. Immediately remove the flag. Identity comes from the verified session, not a supplied email. In production, keep bootstrap disabled outside the controlled initial setup window.
6. Add your published source content, then visit `/admin/capabilities` and synchronize the source-controlled canonical registry. The pipeline fails closed with 503 until active capabilities exist. Production rollout must include this reviewed synchronization before switching the public route.

## Candidate content and fork setup

Edit `src/config/candidate.ts` for name, short name, headline, pronouns, site URL, and optional contact email. It drives shared branding, metadata, and advocacy identity. Actual portfolio facts live in canonical Convex content; changing the name alone does not replace someone else's experience.

Replace `convex/seedData.ts` and `convex/portfolioCaseStudy.ts` with your own factual content or edit the canonical tables through the Convex dashboard. Stable source identities are `caseStudies.slug` / `profileDocuments.type` plus section `slug`; preserve these once cited. Do not blindly rename existing citations.

To seed **development** content:

```sh
npx convex env set ALLOW_DEV_SEED 1
npx convex run seed:seedDevContent
npx convex env remove ALLOW_DEV_SEED
```

This upserts named documents and replaces their sections. Review the seed before running it; it is not a production migration. The portfolio case study is included in the seed. For production, use a reviewed dashboard/import operation scoped to the intended documents; do not enable the development seed as a deployment shortcut.

The generic application engine does not require a taxonomy of particular technologies. Keep a compact capability map (typically tens of concepts). Candidate-specific demo result content in `src/lib/devAnalysis.ts` is development-only; replace it for your own visual fixture.

## Capability administration

`/admin/capabilities` generates proposals from current published sections. Generation is admin-only and uses the same daily/concurrency budget as public analysis. Proposals are stored as pending, leaving the active registry untouched.

The 12 entries in `convex/canonicalCapabilities.ts` are manually reviewed source-controlled records. **Sync canonical registry** validates their published evidence references and idempotently makes the active runtime registry match them. This operation does not approve or otherwise consume generated proposals.

Inspect and edit the proposal JSON, including exact evidence references. Approve a new concept, reject it, or select an existing capability for a merge. A merge preloads the union of both evidence sets; approval explicitly replaces the target with the edited fields shown. Deactivation removes a concept from matching. A rejected proposal does not affect the active registry. Approval revalidates published source identities and rejects stale corpus versions. Regenerate after material source edits; approval never copies source bodies into relationships.

The benchmark proposal artifact in `docs/benchmarks/capability-proposals.json` is reviewable research output, **not an automatically approved registry**. Some proposed concepts overlap and should be consolidated before activation. The UI can generate fresh proposals against your current deployment.

## Request-time architecture

```text
Published case-study/profile sections (canonical facts)
    → reviewed capabilities (interpretation)
    → capabilityEvidence (canonical section references)

POST /api/analyze
    → shared admission quota + bounded JSON/JD parsing
    → normalized JD hash + current snapshot fingerprint
    → compatible completed cache lookup
    → atomic daily-call/concurrency reservation (deduplicates running JDs)
    → structured job extraction + capability matching (one GLM decision call)
    → application code resolves selected canonical evidence + profile context
    → one GLM narrative synthesis call
    → JSON + Zod + requirement coverage + grounding/quote checks
    → persist and render
```

There are **two primary model requests**, not one total: a structured decision and a generative synthesis. At most **one shared repair** is allowed, for three calls total. SDK retries are disabled. The matcher implements `CapabilityMatcher.interpretAndMatch`; swap this adapter without giving the prose model control over retrieval. The current adapter is `zai-structured-v1` using the configured GLM model at low reasoning effort. **Jev is not integrated and no Jev key is required.**

The old full-corpus two-stage implementation is preserved as a nonpublic benchmark runner in `src/lib/ai/baseline.ts`. There is no silent public full-corpus fallback. Missing registry or oversized packages fail closed. Selected evidence is bounded to 30 sections / 65,000 body characters; the registry is bounded to 60 active concepts.

Complete requirement coverage, `strong / relevant / gap`, hiring themes, material gaps only, and at most three interview questions remain the product contract. See [security and grounding decisions](docs/security.md).

## Cache and versions

The effective key hashes normalized JD + exact published-content/active-registry fingerprint + candidate configuration + model/reasoning settings + `ANALYSIS_CONTRACT_VERSION`. Bump that constant when prompt, schema, matching, retrieval, or validation behavior changes. Full bodies are read inside a bounded Convex snapshot to catch direct dashboard edits; only selected evidence is returned to the synthesis path. No timestamp-maintenance discipline is required for correctness.

An optional `jobAnalyses.cacheKey` and compound cache/status index are additive. Old analyses are not reused automatically. No factual-data backfill is required; synchronize the reviewed canonical registry before serving analysis traffic. Existing result URLs remain historical snapshots. New rows do not persist raw JDs; existing rows may still hold them.

## Limits and telemetry

Set these optional values **on Convex**, not just in `.env.local`:

| Variable                 | Default | Meaning                                                    |
| ------------------------ | ------: | ---------------------------------------------------------- |
| `ANALYSIS_BURST`         |       3 | Per-client bucket capacity and refill per minute           |
| `ANALYSIS_HOURLY`        |      12 | Per-client bucket capacity and refill per hour             |
| `ANALYSIS_DAILY_CALLS`   |     300 | Hard UTC daily reserved model calls; 3 per run, no refunds |
| `ANALYSIS_CONCURRENCY`   |       4 | Global active five-minute leases                           |
| `ANALYSIS_FAILURE_LIMIT` |       5 | Consecutive failures before a five-minute circuit pause    |

`[analyze:metrics]` and `[ai:usage]` contain timings, outcome categories, model/provider names, numeric usage and repair counts. They contain no JDs, source bodies, model output, provider response bodies, API keys, or reasoning text. Provider failures may lack token counts; budget reservations remain consumed.

Vercel sets `VERCEL=1`; only then is its sanitized IP header accepted. Production on another host needs a reviewed trusted-ingress adapter and otherwise returns 503. See the [threat model](docs/security.md) for proxy, token-bucket, retention, and semantic-grounding limits.

## Verification and benchmarks

```sh
npm test
npm run typecheck
npm run lint
npm run build
python3 scripts/scan-secrets.py --history
npm audit
```

Live benchmarks are explicitly opted in and spend provider tokens. Use synthetic representative JDs, never confidential inputs. They read your configured published corpus; targeted benchmarking creates a reviewable in-memory proposal registry without activating it:

```sh
LIVE_BASELINE=1 npm test -- src/lib/ai/__tests__/benchmark.live.test.ts
LIVE_TARGETED=1 npm test -- src/lib/ai/__tests__/targeted.live.test.ts
```

Preserve earlier JSON reports before rerunning; `BENCHMARK_OUTPUT` selects a different targeted report filename. Results and scope limitations are in [benchmark notes](docs/benchmarks/README.md). Stage-level measurements are not an end-to-end hosted latency guarantee.

## Production rollout

1. Review code, source content, dependency/credential scans, and `docs/security.md`. Never publish private logs, real env files, database exports, or old JD rows with the repository.
2. Deploy the additive Convex schema/component changes to the intended production project; configure WorkOS and independent production analysis credentials/thresholds there and on Vercel.
3. Keep the existing frontend deployment available while synchronizing the canonical capability registry through a protected preview pointed at the intended deployment. Do not switch anonymous traffic to a route with an empty registry.
4. Add the portfolio case study through a reviewed, scoped content import. Generate capabilities **after** intended content changes. No production content is changed by this code-only update.
5. Deploy the frontend; use direct trusted Vercel ingress, configure firewall controls, and smoke-test one valid analysis, cache reuse, and rejection paths. Check that the frontend and Convex share the server credential.
6. Observe validation failures, repair frequency, model latency, quota/circuit events, and spend. Adjust limits deliberately. Rotate secrets, disable bootstrap/dev seed, and adopt result/client-key retention rules.

The schema update is additive. Existing analyses remain readable; old cache entries are ineligible. The security fix makes old unauthenticated lifecycle calls fail, so coordinate frontend/backend rollout or use a short maintenance window rather than weakening authorization for compatibility.
