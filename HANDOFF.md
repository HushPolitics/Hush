# Hush — session handoff

Paste the block below into a new Cowork session to bring it up to speed.
Keep this file updated as the project moves.

---

I'm continuing work on **Hush** (hushpolitics.com), a political accountability
platform. This is a handoff from a previous session — here's everything you need.

## What Hush is

A platform that does two things for voters:

1. **Value matching** — matches you with politicians on your ballot by the
   issues you rank as important.
2. **Trust scores** — rates each politician on whether they actually followed
   through on campaign promises.

The goal is an unbiased stream of data so voters can find their political match.
The long-term plan is AI-driven backend jobs that pull each politician's data
from their own site, find articles naming them, and fact-check claims as
true / misleading / false — kept updated automatically.

I'm Corey Briggs, based in St. Pete / Tampa Bay. Pricing is undecided.

## Current state — it's live

- **Live site:** https://hushpolitics.com (HTTPS, serving on the bare domain,
  no www redirect). Running on **seed data**, not the database yet.
- **Vercel:** team `hush-politics`, live project **`hush-live`** (Hobby plan),
  connected to GitHub and auto-deploying from `main`. Three dead projects from
  earlier attempts — `hush`, `hush-app`, `hushpolitics` — are safe to delete.
- **Supabase:** org "Hush Politics", project ref **`ysbgnhgdnmmpgzrsolqn`**,
  region us-east-1. Schema fully applied.
- **GitHub:** `HushPolitics/Hush` — **public**, populated, and wired to Vercel.
  Every push to `main` deploys automatically. This is the source of truth.
- **Local folder:** `~/Downloads/Hush` on my Mac. Same file contents, but its
  git history is unrelated to GitHub's (the code was uploaded through the web
  UI, not pushed). Treat it as a working copy, not as something to push from.
- **Domain:** hushpolitics.com at GoDaddy. `A @ → 76.76.21.21` points at Vercel.

## Stack

Next.js 16 (App Router, React 19, Tailwind 4, TypeScript) · Supabase · Vercel.

## What's built

**Frontend** — all six views as real routes, converted from a Claude Design
canvas and pixel-matched to it:
`/` Feed · `/compare` · `/your-ballot` · `/hush-guide` · `/hush-guide/[raceId]` ·
`/fact-check` · `/profile` · `/politician/[id]` · `/politician/[id]/trust` ·
`/login` · `/pricing` · `/api/ingest`. (`/ballot` and `/voters-guide` redirect
to `/your-ballot`; `/guide` redirects to `/hush-guide`; `/saved` redirects to
`/profile`.)

`/hush-guide` is its own three-step flow (address, then up to 10 issues,
then a tile grid of races) gated on `guideIssues` in prefs, plus a "Bills
Being Considered" section of flip-card tiles at the bottom. No score, no
ranking, no recommendation anywhere in it by design — see the comments atop
`GuideView.tsx`, `GuideRaceView.tsx` and `GuideBills.tsx`. All of its data
(`GUIDE_POSITIONS`, `BILLS`) is illustrative seed data with no real
civic-data or Congress.gov/state-legislature integration yet.
Design system: Barlow + Barlow Condensed, rust `#9C3F32`, navy `#253746`,
cream `#FFFDF9`, tan `#B5A88A`.

**Database** — four migrations in `supabase/migrations/`, all applied:
32 tables, RLS enabled on all 32, 28 policies.
- `0001` core schema — politicians, offices, districts, issues, policy
  positions, promises (with an append-only event log), claims, fact-checks,
  elections, races, per-user tables
- `0002` RLS — public reference data readable but only in a `published` state;
  per-user rows owner-only; writes via service role
- `0003` ingestion queue + `compute_trust_score()` + `compute_match()`
- `0004` billing — models monthly / yearly / one-time behind one
  `has_entitlement()` call, so the pricing decision is a row change

**Pipeline** — `src/lib/pipeline/`. Source reliability rubric, claim assessment
with independent passes, and a promotion gate. Design doc in
`docs/ingestion-pipeline.md`.

## Design decisions to preserve (don't undo these)

- **Views never import `seed-data` directly** — everything goes through
  `src/lib/repo.ts`. That's the seam: swap each function's body for a Supabase
  query and no component changes. This is why the site deploys with no backend.
- **The model never writes a published row.** It writes to `claim_assessments`
  with its evidence, confidence, and a required "what would change my mind"
  note. `shouldAutoPublish()` in `src/lib/pipeline/assess.ts` gates promotion on
  confidence, source quality, a primary record for the severe verdicts, and a
  random audit slice. Disagreement between passes routes to human review.
- **Promise wording is "Delivered / In progress / No movement"** — never
  "broken". Each states an observable fact rather than characterising intent.
  The ledger shows a progress bar and percentage; `promises.progress` (0-100)
  has a check constraint pinning Delivered to 100 and No movement to 0, so the
  bar and its caption can never disagree.
- **Value match is shrunk toward neutral by coverage.** A politician with one
  position on file that aligns perfectly must not outrank one who aligns closely
  across every ranked issue — otherwise cherry-picked records top the feed,
  which is the exact failure the product exists to prevent.
- **Scoring weights live in the `scoring_weights` table**, not in code, so a
  rubric change is a dated row and the number on screen can be explained.
- **Seed data names are fictional** (Marchetti, Pike, Vance, Ainsley,
  Bellweather, Osei-Hart, Torrance, Hollis) and every screen carries a
  disclaimer footer.

## Gotchas that cost time last session

- **Vercel Hobby allows exactly one cron run per day.** Anything more frequent
  fails the build. `vercel.json` is daily at 06:00 UTC. It also rejects unknown
  keys inside a cron entry — no inline comments.
- **Deploys are automatic now.** Any commit to `main` on GitHub triggers a
  Vercel build. To ship a change without Corey touching a terminal: edit the
  file, then upload it at
  `github.com/HushPolitics/Hush/upload/main/<directory>` and commit. Vercel
  picks it up within seconds. Do NOT use Vercel Drop — it can only create new
  projects, which is how three dead ones accumulated.
- **Corey does not want to use his Mac terminal.** Respect that; the GitHub web
  upload path above is the agreed workflow.
- **The Supabase migrations were run through the SQL editor, so there is no
  migration history.** Do **not** connect the GitHub→Supabase integration — it
  would try to re-run all four on push and fail.
- **`device_bash` can't delete files** without a permission prompt, and git
  leaves `.lock` files and `tmp_obj_*` behind in the mounted folder when it
  can't unlink. Clear them or the next git command fails.
- **Direct `git push` still won't work from a session** — no credentials, and
  the local history diverged from GitHub's anyway. Use the web upload path.

## Known issues

- **My SPF record is wrong.** `v=spf1 include:secureserver.net -all` points at
  GoDaddy, but my MX is Microsoft 365. Mail I send through M365 fails SPF, and
  `-all` is a hard fail. It probably wants `include:spf.protection.outlook.com`.
  This is pre-existing and unrelated to Hush — the domain runs live M365 email,
  so only the one A record was ever touched.

## What's next

1. ~~Push to GitHub and connect Vercel~~ — done. Deploys are automatic.
2. Connect the **Supabase→Vercel** integration — it injects the env vars,
   including the service role key, so nobody copies secrets by hand.
3. Point `repo.ts` at Supabase instead of seed data.
4. Load real politicians. Start with the federal layer from the public
   `unitedstates/congress-legislators` dataset, then Open States for state
   level. Local has no national dataset — that's the real cost.

## Open decisions

- **Pricing** — monthly, yearly, or one-time. All three are already modelled.
- **Launch market** — one metro covered deeply beats a thin national rollout.
- **Human review budget** — how many verdicts get eyes before publishing.
- **Legal review** — publishing "this official didn't deliver" about a named
  living person is defamation-shaped. Public figures face a high bar, but what
  holds it up is a documented review process, cited sources, and a real
  correction path. Worth a lawyer's hour before real names go in.

## How I like to work

Be direct and honest, push back when I'm wrong. Prefer surgical patches over
rewrites. No em dashes or bold in anything I'll send as myself.
