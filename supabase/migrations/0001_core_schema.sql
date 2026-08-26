-- Hush core schema
--
-- Design principles carried through every table:
--   1. Nothing shown to a voter is stored without a citable source. Trust
--      scores, promise statuses and fact-check verdicts all hang off rows in
--      `sources`, and the UI is expected to surface them.
--   2. AI output is never written straight to a public table. Ingestion writes
--      to `claim_assessments` with a model name, a confidence and the evidence
--      it used; a row is only promoted to a published verdict when it clears
--      review. See migration 0003.
--   3. Public reference data is world-readable. Anything tied to a person is
--      locked to that person by RLS.

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type gov_level as enum ('Local', 'State', 'Federal');
create type party_code as enum ('D', 'R', 'I', 'L', 'G', 'Other');
create type promise_status as enum ('Delivered', 'In progress', 'No movement', 'Unrated');
create type verdict as enum ('True', 'Mostly true', 'Misleading', 'False', 'Unverifiable');
create type stance_tag as enum ('Aligned', 'Partial', 'Opposed', 'No record');
create type review_state as enum ('draft', 'in_review', 'published', 'rejected', 'retracted');

-- ---------------------------------------------------------------------------
-- Geography and offices
-- ---------------------------------------------------------------------------

create table jurisdictions (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,          -- 'Travis County', 'Texas', 'United States'
  level        gov_level not null,
  parent_id    uuid references jurisdictions(id) on delete set null,
  state_code   char(2),
  created_at   timestamptz not null default now()
);

create table districts (
  id              uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references jurisdictions(id) on delete cascade,
  slug            text unique not null, -- 'tx-35', 'd-14', 'austin-citywide'
  name            text not null,        -- 'TX-35'
  kind            text not null,        -- 'congressional', 'state_senate', 'school_board', 'citywide'
  created_at      timestamptz not null default now()
);

-- ZIP-to-district is many-to-many: a ZIP can straddle district lines.
create table zip_districts (
  zip          char(5) not null,
  district_id  uuid not null references districts(id) on delete cascade,
  primary key (zip, district_id)
);

create table offices (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,        -- 'U.S. Representative'
  level           gov_level not null,
  district_id     uuid references districts(id) on delete set null,
  term_years      int,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Politicians
-- ---------------------------------------------------------------------------

create table politicians (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,   -- 'marchetti'
  full_name         text not null,
  display_name      text not null,          -- 'Rep. Delia Marchetti'
  party             party_code,
  bio               text,
  portrait_url      text,
  official_site_url text,                   -- the ingestion pipeline's primary seed
  campaign_site_url text,
  wikipedia_url     text,
  -- Stable external ids so records can be reconciled across data sources.
  bioguide_id       text unique,
  fec_candidate_id  text,
  openstates_id     text unique,
  ballotpedia_slug  text,
  in_office_since   int,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index politicians_name_trgm on politicians using gin (display_name gin_trgm_ops);

create table politician_offices (
  id             uuid primary key default gen_random_uuid(),
  politician_id  uuid not null references politicians(id) on delete cascade,
  office_id      uuid not null references offices(id) on delete cascade,
  term_start     date not null,
  term_end       date,
  is_current     boolean generated always as (term_end is null) stored,
  -- Trust recomputed per term so a bad first term does not follow someone forever.
  term_trust_score numeric(5,2),
  created_at     timestamptz not null default now(),
  unique (politician_id, office_id, term_start)
);

create index politician_offices_current on politician_offices (politician_id) where term_end is null;

-- ---------------------------------------------------------------------------
-- Issues and positions
-- ---------------------------------------------------------------------------

create table issues (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,     -- 'healthcare'
  label       text not null,            -- 'Healthcare'
  description text,
  sort_order  int not null default 0
);

create table policy_positions (
  id             uuid primary key default gen_random_uuid(),
  politician_id  uuid not null references politicians(id) on delete cascade,
  issue_id       uuid not null references issues(id) on delete cascade,
  stance         stance_tag not null,
  summary        text not null,         -- one sentence, shown on the profile
  -- -100..100. Signed so a user's own position can be matched in either
  -- direction rather than assuming one side of every issue is "aligned".
  position_score numeric(5,2) not null,
  confidence     numeric(3,2) not null default 0.5,  -- 0..1
  as_of          date not null default current_date,
  state          review_state not null default 'published',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (politician_id, issue_id)
);

-- ---------------------------------------------------------------------------
-- Sources: the citation spine everything else references
-- ---------------------------------------------------------------------------

create table sources (
  id             uuid primary key default gen_random_uuid(),
  url            text not null,
  canonical_url  text,
  domain         text not null,
  title          text,
  publisher      text,
  author         text,
  published_at   timestamptz,
  retrieved_at   timestamptz not null default now(),
  -- Full text kept so a claim can be re-checked without refetching, and so a
  -- source that later disappears can still be quoted.
  raw_text       text,
  content_hash   text,
  -- 0..1. Primary records (roll calls, agency filings, court dockets) score
  -- highest; opinion and aggregator pages lowest. Feeds verdict confidence.
  reliability    numeric(3,2) not null default 0.5,
  source_kind    text not null default 'article',
    -- 'article' | 'primary_record' | 'official_site' | 'press_release'
    -- | 'transcript' | 'social' | 'dataset'
  created_at     timestamptz not null default now(),
  unique (content_hash)
);

create index sources_domain_idx on sources (domain);
create index sources_published_idx on sources (published_at desc);

create table politician_mentions (
  id             uuid primary key default gen_random_uuid(),
  source_id      uuid not null references sources(id) on delete cascade,
  politician_id  uuid not null references politicians(id) on delete cascade,
  -- Guards against name collisions: a mention is only acted on above threshold.
  match_confidence numeric(3,2) not null default 0.5,
  snippet        text,
  created_at     timestamptz not null default now(),
  unique (source_id, politician_id)
);

-- ---------------------------------------------------------------------------
-- Promises: the trust score's evidence base
-- ---------------------------------------------------------------------------

create table promises (
  id                uuid primary key default gen_random_uuid(),
  politician_id     uuid not null references politicians(id) on delete cascade,
  issue_id          uuid references issues(id) on delete set null,
  term_id           uuid references politician_offices(id) on delete set null,
  text              text not null,
  -- Where the promise was made. A promise with no origin source is not tracked.
  origin_source_id  uuid references sources(id) on delete set null,
  promised_at       date,
  target_date       date,
  status            promise_status not null default 'Unrated',
  status_changed_at date,
  -- 0-100. How far along the pledge is, shown as a bar in the ledger.
  -- The constraint below keeps the bar and the label from ever disagreeing:
  -- a promise cannot read "Delivered" at 60%, or "No movement" at 40%.
  progress          int not null default 0 check (progress between 0 and 100),
  constraint promise_progress_matches_status check (
    (status = 'Delivered'   and progress = 100) or
    (status = 'No movement' and progress = 0)   or
    (status = 'In progress' and progress between 0 and 99) or
    (status = 'Unrated')
  ),
  -- 1..5. Scales the promise's weight in the trust score: a signature campaign
  -- pledge counts for more than a procedural commitment.
  significance      int not null default 3 check (significance between 1 and 5),
  is_flagship       boolean not null default false,
  state             review_state not null default 'published',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index promises_politician_idx on promises (politician_id, status);
create unique index promises_one_flagship
  on promises (politician_id) where is_flagship and state = 'published';

create table promise_sources (
  promise_id uuid not null references promises(id) on delete cascade,
  source_id  uuid not null references sources(id) on delete cascade,
  -- 'origin' | 'progress' | 'resolution' | 'contradiction'
  role       text not null default 'progress',
  primary key (promise_id, source_id, role)
);

-- Each status change is an append-only event, so the timeline on the trust
-- page is derived rather than hand-maintained, and no edit is silent.
create table promise_events (
  id           uuid primary key default gen_random_uuid(),
  promise_id   uuid not null references promises(id) on delete cascade,
  occurred_on  date not null,
  label        text not null,
  new_status   promise_status,
  source_id    uuid references sources(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index promise_events_promise_idx on promise_events (promise_id, occurred_on);

-- ---------------------------------------------------------------------------
-- Claims and fact-checks
-- ---------------------------------------------------------------------------

create table claims (
  id             uuid primary key default gen_random_uuid(),
  politician_id  uuid not null references politicians(id) on delete cascade,
  issue_id       uuid references issues(id) on delete set null,
  claim_text     text not null,
  -- Where the politician said it.
  stated_at      timestamptz,
  stated_in_source_id uuid references sources(id) on delete set null,
  context        text,
  created_at     timestamptz not null default now()
);

create index claims_politician_idx on claims (politician_id, stated_at desc);

create table fact_checks (
  id             uuid primary key default gen_random_uuid(),
  claim_id       uuid not null references claims(id) on delete cascade,
  verdict        verdict not null,
  finding        text not null,          -- the paragraph shown under the claim
  -- 0..1, derived from source reliability and assessment agreement.
  confidence     numeric(3,2) not null default 0.5,
  state          review_state not null default 'draft',
  published_at   timestamptz,
  reviewed_by    uuid references auth.users(id) on delete set null,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index fact_checks_published_idx on fact_checks (published_at desc) where state = 'published';

create table fact_check_sources (
  fact_check_id uuid not null references fact_checks(id) on delete cascade,
  source_id     uuid not null references sources(id) on delete cascade,
  -- 'supports' | 'contradicts' | 'context'
  role          text not null default 'supports',
  quote         text,
  primary key (fact_check_id, source_id)
);

-- ---------------------------------------------------------------------------
-- Elections, races, ballots
-- ---------------------------------------------------------------------------

create table elections (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  election_date date not null,
  polls_close_at timestamptz,
  register_by   date,
  early_voting_start date,
  early_voting_end   date,
  mail_request_by    date,
  state_code    char(2)
);

create table races (
  id           uuid primary key default gen_random_uuid(),
  election_id  uuid not null references elections(id) on delete cascade,
  office_id    uuid not null references offices(id) on delete cascade,
  title        text not null,
  is_ballot_measure boolean not null default false,
  measure_text text,
  unique (election_id, office_id)
);

create table candidacies (
  id             uuid primary key default gen_random_uuid(),
  race_id        uuid not null references races(id) on delete cascade,
  politician_id  uuid references politicians(id) on delete set null,
  -- Challengers with no record yet get a name but no politician row.
  display_name   text not null,
  party          party_code,
  is_incumbent   boolean not null default false,
  withdrew       boolean not null default false,
  unique (race_id, display_name)
);

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  zip           char(5),
  home_district_id uuid references districts(id) on delete set null,
  onboarded_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Ranked issues. `rank` 1 is the user's top priority; weight falls off by rank.
create table user_issue_weights (
  user_id   uuid not null references auth.users(id) on delete cascade,
  issue_id  uuid not null references issues(id) on delete cascade,
  rank      int not null check (rank > 0),
  -- -100..100: which side of the issue the user is on, not just that they care.
  position_score numeric(5,2),
  primary key (user_id, issue_id)
);

create unique index user_issue_rank_unique on user_issue_weights (user_id, rank);

create table saved_politicians (
  user_id       uuid not null references auth.users(id) on delete cascade,
  politician_id uuid not null references politicians(id) on delete cascade,
  note          text,
  created_at    timestamptz not null default now(),
  primary key (user_id, politician_id)
);

create table user_ballot_marks (
  user_id     uuid not null references auth.users(id) on delete cascade,
  race_id     uuid not null references races(id) on delete cascade,
  state       text not null default 'needs_review',
    -- 'reviewed' | 'needs_review' | 'no_match'
  leaning_candidacy_id uuid references candidacies(id) on delete set null,
  updated_at  timestamptz not null default now(),
  primary key (user_id, race_id)
);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'politicians', 'policy_positions', 'promises', 'fact_checks', 'profiles'
  ] loop
    execute format(
      'create trigger %I_set_updated_at before update on %I
       for each row execute function set_updated_at()', t, t);
  end loop;
end $$;
