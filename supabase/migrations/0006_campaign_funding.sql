-- Campaign funding: FEC filings, aggregate individual totals, and named
-- committee/PAC contributions.
--
-- Content rules this schema exists to enforce structurally, not just by
-- convention in application code:
--   1. Individual donors are never named. `funding_filings` carries only an
--      aggregate `individual_contributions_total` -- there is no per-person
--      table, and `funding_contributors` has no way to represent one (its
--      `contributor_type` check constraint has no 'individual' option).
--   2. Committees and PACs ARE named individually in `funding_contributors`,
--      since that's public, non-personal information about an organization.
--   3. Nothing here is characterized (no verdict/rating column anywhere) --
--      funding data is reported, not judged, unlike claims/fact_checks.
--
-- `funding_sync_runs` replaces `ingest_jobs` for this data source on purpose:
-- a funding sync has nothing to route through an assessment/verdict gate
-- (see 0003_ingestion_and_scoring.sql's header comment on that design), so it
-- doesn't belong in the `ingest_job_kind` enum built for that gate. The sync
-- job checks this table directly for a recent successful run instead of
-- pulling a job off the queue -- see the new branch in /api/ingest.

create table funding_filings (
  id                              uuid primary key default gen_random_uuid(),
  politician_id                   uuid not null references politicians(id) on delete cascade,
  fec_filing_id                   text not null,
  period_label                    text not null, -- e.g. "Q2 2026", "Pre-General 2026"
  coverage_start                  date,
  coverage_end                    date,
  total_raised                    numeric,
  total_spent                     numeric,
  cash_on_hand                    numeric,
  -- Aggregate only -- see header comment. This is the entire individual-
  -- giving picture this schema ever stores.
  individual_contributions_total  numeric,
  filed_at                        timestamptz,
  source_url                      text not null,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now(),
  unique (politician_id, fec_filing_id)
);

create index funding_filings_politician_idx on funding_filings(politician_id);

-- One row per committee/PAC contribution named in a filing. Deliberately no
-- 'individual' contributor_type -- see header comment.
create table funding_contributors (
  id                 uuid primary key default gen_random_uuid(),
  funding_filing_id  uuid not null references funding_filings(id) on delete cascade,
  committee_name     text not null,
  committee_fec_id   text,
  amount             numeric not null,
  contributor_type   text not null check (contributor_type in ('pac', 'party_committee', 'other_committee')),
  created_at         timestamptz not null default now()
);

create index funding_contributors_filing_idx on funding_contributors(funding_filing_id);

-- One row per sync attempt. The route checks for a 'succeeded' row within
-- its freshness window before calling the FEC API again, rather than
-- tracking state per-politician the way ingest_jobs tracks state per-job.
create table funding_sync_runs (
  id                  uuid primary key default gen_random_uuid(),
  started_at          timestamptz not null default now(),
  finished_at         timestamptz,
  state               text not null default 'running' check (state in ('running', 'succeeded', 'failed')),
  politicians_checked int not null default 0,
  filings_created     int not null default 0,
  filings_updated     int not null default 0,
  error               text
);

create index funding_sync_runs_state_idx on funding_sync_runs(state, started_at);

-- RLS: same public-reference-data pattern as 0002_rls_policies.sql. Funding
-- data has no draft/published split the way editorial tables do -- a synced
-- filing is a fact about a public FEC record, not a judgment call, so
-- there's no "in_review" state to hide behind a `state = 'published'` filter.
alter table funding_filings enable row level security;
create policy funding_filings_public_read on funding_filings for select using (true);

alter table funding_contributors enable row level security;
create policy funding_contributors_public_read on funding_contributors for select using (true);

-- funding_sync_runs is operational, not public: service role only (no policy
-- means no access under RLS for anon/authenticated, same as ingest_jobs).
alter table funding_sync_runs enable row level security;
