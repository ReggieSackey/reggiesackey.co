# reggiesackey.co

Reg Sackey-Addo's site. Not a traditional portfolio — the primary public
experience lets a hiring manager paste a job description and receive a
grounded analysis of fit, backed by case studies and profile documents.

## Stack

- Next.js (App Router) + TypeScript
- Convex backend
- WorkOS AuthKit (`@workos-inc/authkit-nextjs` + `@convex-dev/workos`)
- Tailwind CSS v4
- Deployed on Vercel
- Vercel AI SDK + GLM (via an OpenAI-compatible provider) — planned, not wired up yet

## Architecture

### Analysis pipeline

`POST /api/analyze` runs the two-stage grounded pipeline:

1. **Validate input** — normalize, 100–15,000 chars.
2. **Extract requirements** (model call 1) — JD only; the corpus is
   deliberately withheld so the model can't tailor extraction to the
   candidate. The JD is treated as untrusted data, never instructions.
3. **Load public corpus** — every published case-study/profile section.
4. **Evaluate fit** (model call 2) — grounded only in the corpus.
5. **Validate citations server-side** — citations must reference real
   supplied sections; quotes must be verbatim excerpts. Invented
   citations are dropped; fully ungrounded requirements are downgraded
   to `insufficient_evidence`.
6. **Persist** to `jobAnalyses` (status `complete`) and redirect to
   `/analysis/[id]`.

Failures mark the row `failed` and the results page shows a generic
message. `/analysis/dev-fixture` (development only) renders a
hard-coded result for visual regression.

Model access is GLM via Z.AI's OpenAI-compatible API, configured with
`ZAI_API_KEY`, `ZAI_BASE_URL`, `ZAI_MODEL` — server-side only.

1. **Case studies and profile documents are the canonical factual source
   material.** There is no manually maintained claims store; nothing about
   Reg's experience exists only as marketing copy.
2. **Case studies are split into stable sections with stable slugs**
   (`caseStudies` → `caseStudySections`, and `profileDocuments` →
   `profileSections`). Slugs are the stable addressing scheme for retrieval
   and citation.
3. **Future AI analysis will dynamically derive evidence from those
   sections** at query time. The pipeline will be: job description →
   extract requirements → retrieve relevant case study/profile sections →
   generate evidence-backed analysis → validate citations → render.
4. **Generated analysis cites source section IDs, not arbitrary URLs.** A
   claim is only valid if it points at a concrete section document; section
   IDs are resolved to trusted deep links at render time (e.g.
   `/work/[slug]#section-slug`), never taken from model output.
5. **Application code resolves section IDs into trusted deep links.** The
   renderer owns URL construction; the model only ever emits section IDs.
6. **Public AI analysis will be a constrained pipeline, not an autonomous
   agent.** It runs a fixed sequence of steps with validation between them,
   rather than free-form tool use.
7. **Admin is authenticated.** `/admin` and everything under it requires a
   WorkOS AuthKit session (see `src/proxy.ts` and the server-side checks in
   `src/app/admin/layout.tsx` and `convex/adminAuth.ts`). Public routes are
   open to everyone; there is no public login button.
8. **Public analysis stays anonymous** — no account needed to run one. It
   will later receive rate limiting, caching, token limits, and abuse
   protection before the AI pipeline ships.

## Getting started

```bash
npm install
npx convex dev        # in one terminal — pushes schema + auth config
npm run dev           # in another terminal — Next.js on :3000
```

Copy `.env.example` → `.env.local` and fill in the WorkOS and Convex
values. `.env.local` is gitignored — never commit real secrets.

### One-time first-admin bootstrap

The first admin is claimed from the authenticated WorkOS session — no
manual database insert needed:

1. Set the bootstrap flag on the dev deployment (dev only, temporary):
   ```bash
   npx convex env set ADMIN_BOOTSTRAP_ENABLED 1
   ```
2. Push so the config is live: `npx convex dev`
3. Visit `/admin` and click **Become admin**. Identity (authId/email)
   is derived server-side from your WorkOS session token.
4. Remove the flag immediately:
   ```bash
   npx convex env remove ADMIN_BOOTSTRAP_ENABLED
   ```

The mutation refuses once any admin exists, and refuses entirely
without the flag — it is not a permanent onboarding flow. Additional
admins are managed later via admin tooling.

### Development content seed

Development content (CModel case study + Technical Profile) comes from
a gated internal mutation:

```bash
npx convex env set ALLOW_DEV_SEED 1     # dev deployment only
npx convex run seed:seedDevContent
npx convex env remove ALLOW_DEV_SEED
```

The seed upserts by slug — safe to re-run. To replace the content
later, delete rows by slug in the Convex dashboard or re-run with
edited `convex/seed.ts`.

### Required WorkOS Dashboard configuration

- Redirect URI for the dev environment: `http://localhost:3000/callback`
- (Production: `https://reggiesackey.co/callback` when the domain is live)

### Required Convex configuration

- Set `WORKOS_CLIENT_ID` on the Convex deployment:
  `npx convex env set WORKOS_CLIENT_ID client_…`
- Re-run `npx convex dev` after changing `convex/auth.config.ts`.

## Routes

Public: `/`, `/work`, `/work/[slug]`, `/profile/[type]`, `/about`,
`/analysis/[id]` (dev fixture), `/application/[slug]`
Admin (auth required): `/admin`, `/admin/work`, `/admin/profile`,
`/admin/applications`

## Scripts

- `npm run dev` — Next.js dev server
- `npx convex dev` — Convex dev loop (schema + functions)
- `npm run lint` — ESLint
- `npm run build` — production build
