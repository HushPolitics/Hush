# Hush

Value matching and promise-tracking trust scores for every race on your ballot.
[hushpolitics.com](https://hushpolitics.com)

Next.js 16 (App Router) · Supabase · Vercel

---

## Running it

```bash
npm install
cp .env.example .env.local   # optional — the app runs without it
npm run dev
```

With no env vars the app serves the seed dataset in `src/lib/seed-data.ts`.
That is intentional: the first deploy works before the backend exists, and the
same fixtures are what the ingestion pipeline is tested against.

## Layout

```
src/
  app/                    routes — one per view in the design
    page.tsx              Feed
    compare/              Vote compare + stance grid
    voters-guide/         Countdown, races, polling place
    fact-check/           Claims and verdicts
    profile/              The "you" surface (topics, ranked issues, saved)
    politician/[id]/      Profile
    politician/[id]/trust Promise ledger
    login/ pricing/       Auth and the (not yet live) membership page
    api/ingest/           Cron-driven ingestion worker
    auth/callback/        Magic-link exchange
  components/
    AppShell.tsx          Sidebar, top bar, footer
    ui.tsx                Design-system primitives
    Gate.tsx              Subscription gate (off until pricing is decided)
    views/                One component per screen
  lib/
    theme.ts              Design tokens, ported from the Claude Design canvas
    types.ts              Domain types
    seed-data.ts          Generated fixtures — do not hand-edit
    repo.ts               Data access seam: swap to Supabase here, views unchanged
    scoring.ts            Trust and value-match maths (mirrors the SQL)
    prefs.tsx             Per-user state (ranked issues, saved, ZIP)
    supabase/             Browser, server and service-role clients
    pipeline/             Source rubric + claim assessment
supabase/migrations/      0001 schema · 0002 RLS · 0003 ingestion+scoring · 0004 billing
docs/ingestion-pipeline.md   How the AI data layer works and why
```

## The one architectural rule

Views never import `seed-data` directly — they go through `lib/repo.ts`. When
the Supabase tables are populated, each function in `repo.ts` swaps its body for
a query and nothing in `components/` changes.

## Applying the migrations

Supabase dashboard → SQL Editor → run `supabase/migrations/*.sql` in order.
Or with the CLI:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

## The trust score

60% promises kept, 25% recency, 15% promise significance. The weights live in
the `scoring_weights` table rather than in code, so a rubric change is a dated
row and the number on screen can always be explained. See
`compute_trust_score()` in migration 0003.

## The ingestion cron

`vercel.json` runs `/api/ingest` once daily at 06:00 UTC (2am ET). That cadence
is a plan constraint, not a design choice: **Vercel Hobby allows one cron run
per day**, and anything more frequent fails the build outright with
`would run more than once per day`. On Pro, raise it — every 4 hours
(`0 */4 * * *`) is the intended cadence once there are real sources to crawl.

Note also that `vercel.json` rejects unknown keys inside a cron entry, so the
schedule cannot carry an inline comment. Hence this section.

## The fact-check pipeline

The model never writes a published row. It writes to `claim_assessments` with
its evidence and confidence; `shouldAutoPublish()` in
`src/lib/pipeline/assess.ts` decides whether that clears the bar or goes to
`review_queue`. Read `docs/ingestion-pipeline.md` before changing any of it —
the bias and defamation notes in there are load-bearing, not boilerplate.
