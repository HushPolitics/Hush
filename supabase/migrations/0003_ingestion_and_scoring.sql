-- Ingestion, AI assessment, review queue, and derived scores.
--
-- The load-bearing idea: the AI never writes a published row. It writes an
-- assessment with its evidence, its model, and its confidence. Promotion to a
-- published verdict is a separate, auditable step. That is what lets Hush claim
-- an unbiased stream of data without asking voters to trust a black box.

-- ---------------------------------------------------------------------------
-- Crawl scheduling
-- ---------------------------------------------------------------------------

create type ingest_job_kind as enum (
  'official_site',   -- crawl the politician's own site for positions and pledges
  'news_sweep',      -- find articles naming the politician
  'claim_extract',   -- pull checkable claims out of a source
  'claim_assess',    -- verify a claim against evidence
  'promise_update',  -- look for evidence a tracked promise moved
  'score_refresh'    -- recompute trust and term scores
);

create type ingest_job_state as enum ('queued', 'running', 'succeeded', 'failed', 'skipped');

create table ingest_sources (
  id             uuid primary key default gen_random_uuid(),
  politician_id  uuid references politicians(id) on delete cascade,
  kind           text not null,   -- 'website' | 'rss' | 'newsapi' | 'roll_call' | 'press'
  url            text not null,
  -- How often this feed is worth revisiting, in hours.
  cadence_hours  int not null default 24,
  last_crawled_at timestamptz,
  last_status    text,
  etag           text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (politician_id, url)
);

create table ingest_jobs (
  id             uuid primary key default gen_random_uuid(),
  kind           ingest_job_kind not null,
  politician_id  uuid references politicians(id) on delete cascade,
  source_id      uuid references sources(id) on delete cascade,
  claim_id       uuid references claims(id) on delete cascade,
  promise_id     uuid references promises(id) on delete cascade,
  payload        jsonb not null default '{}'::jsonb,
  state          ingest_job_state not null default 'queued',
  attempts       int not null default 0,
  last_error     text,
  -- Cost accounting so the pipeline's spend is visible per politician.
  tokens_in      int,
  tokens_out     int,
  run_at         timestamptz not null default now(),
  started_at     timestamptz,
  finished_at    timestamptz,
  created_at     timestamptz not null default now()
);

create index ingest_jobs_ready on ingest_jobs (run_at) where state = 'queued';
create index ingest_jobs_politician on ingest_jobs (politician_id, kind, state);

-- ---------------------------------------------------------------------------
-- AI assessments: never public, always cited
-- ---------------------------------------------------------------------------

create table claim_assessments (
  id             uuid primary key default gen_random_uuid(),
  claim_id       uuid not null references claims(id) on delete cascade,
  model          text not null,           -- e.g. 'claude-sonnet-4-6'
  prompt_version text not null,           -- bump when the rubric changes
  verdict        verdict not null,
  finding        text not null,
  confidence     numeric(3,2) not null,
  -- Every source id the model was shown, with what it concluded from each.
  evidence       jsonb not null default '[]'::jsonb,
  -- The model's own account of what would change its mind. Surfaced to
  -- reviewers; a verdict with no falsifier is a red flag.
  disconfirming_note text,
  created_at     timestamptz not null default now()
);

create index claim_assessments_claim on claim_assessments (claim_id, created_at desc);

create table promise_assessments (
  id             uuid primary key default gen_random_uuid(),
  promise_id     uuid not null references promises(id) on delete cascade,
  model          text not null,
  prompt_version text not null,
  proposed_status promise_status not null,
  rationale      text not null,
  confidence     numeric(3,2) not null,
  evidence       jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Review queue
-- ---------------------------------------------------------------------------

create table review_queue (
  id             uuid primary key default gen_random_uuid(),
  subject_kind   text not null,    -- 'fact_check' | 'promise' | 'policy_position'
  subject_id     uuid not null,
  -- Why it needs a human: 'low_confidence' | 'disagreement' | 'high_impact'
  -- | 'contested' | 'random_audit'
  reason         text not null,
  priority       int not null default 3,
  assigned_to    uuid references auth.users(id) on delete set null,
  resolved_at    timestamptz,
  resolution     text,
  created_at     timestamptz not null default now()
);

create index review_queue_open on review_queue (priority, created_at) where resolved_at is null;

alter table ingest_sources enable row level security;
alter table ingest_jobs enable row level security;
alter table claim_assessments enable row level security;
alter table promise_assessments enable row level security;
alter table review_queue enable row level security;
-- No policies: these tables are service-role only. RLS on with zero policies
-- denies anon and authenticated outright.

-- ---------------------------------------------------------------------------
-- Trust scoring
-- ---------------------------------------------------------------------------

-- Weights live in a table, not in code, so a rubric change is a data change
-- with a date on it. The UI reads these to explain the score.
create table scoring_weights (
  id             uuid primary key default gen_random_uuid(),
  effective_from date not null default current_date,
  kept_weight    numeric(4,3) not null default 0.600,
  recency_weight numeric(4,3) not null default 0.250,
  significance_weight numeric(4,3) not null default 0.150,
  -- Promises older than this contribute at a decayed rate.
  recency_half_life_days int not null default 730,
  note           text
);

insert into scoring_weights (note) values ('Initial rubric shipped with launch.');

/**
 * Trust score for one politician.
 *
 * Kept component:   share of resolved promises kept, weighted by significance.
 * Recency component: the same, but weighting recent resolutions more heavily
 *                    on a half-life decay, so an old record does not mask a
 *                    current pattern in either direction.
 * Significance component: performance on the promises that mattered most
 *                    (significance 4-5) considered on its own.
 *
 * "In progress" promises are excluded entirely while they are still inside
 * their target date. Once overdue they enter the denominator at half weight —
 * an unfinished pledge is not as damning as an abandoned one, but an official
 * cannot park a promise in progress forever to dodge a "not fulfilled" mark.
 */
create or replace function compute_trust_score(p_politician uuid)
returns numeric
language plpgsql
stable
as $$
declare
  w              record;
  kept_component numeric := 0;
  recency_component numeric := 0;
  signif_component  numeric := 0;
  total_weight   numeric := 0;
  score          numeric;
begin
  select * into w from scoring_weights
  where effective_from <= current_date
  order by effective_from desc limit 1;

  if w is null then return null; end if;

  -- Significance-weighted kept share over resolved promises. An overdue
  -- "in progress" enters the denominator at half weight and never the
  -- numerator, so it drags the score down without counting as fully unmet.
  select
    coalesce(
      sum(case when status = 'Delivered' then significance else 0 end)::numeric
      / nullif(sum(
          case when status = 'In progress' then significance * 0.5 else significance end
        ), 0) * 100,
      0),
    coalesce(sum(
      case when status = 'In progress' then significance * 0.5 else significance end
    ), 0)
  into kept_component, total_weight
  from promises
  where politician_id = p_politician
    and state = 'published'
    and (
      status in ('Delivered', 'No movement')
      or (status = 'In progress' and target_date is not null and target_date < current_date)
    );

  if total_weight = 0 then return null; end if;

  -- Recency-decayed variant of the same ratio.
  select coalesce(
    sum(
      case when status = 'Delivered' then significance else 0 end
      * exp(-ln(2) * greatest(current_date - coalesce(status_changed_at, promised_at, current_date), 0)
            / w.recency_half_life_days)
    )
    / nullif(sum(
      significance
      * exp(-ln(2) * greatest(current_date - coalesce(status_changed_at, promised_at, current_date), 0)
            / w.recency_half_life_days)
    ), 0) * 100, 0)
  into recency_component
  from promises
  where politician_id = p_politician
    and state = 'published'
    and status in ('Delivered', 'No movement');

  -- Flagship and near-flagship promises considered alone.
  select coalesce(
    count(*) filter (where status = 'Delivered')::numeric
    / nullif(count(*) filter (where status in ('Delivered', 'No movement')), 0) * 100,
    kept_component)
  into signif_component
  from promises
  where politician_id = p_politician
    and state = 'published'
    and significance >= 4;

  score := w.kept_weight * kept_component
         + w.recency_weight * recency_component
         + w.significance_weight * signif_component;

  return round(least(100, greatest(0, score)), 1);
end;
$$;

-- Materialised so the feed can sort eight thousand politicians by trust
-- without recomputing. Refreshed by the score_refresh job.
create materialized view politician_scores as
select
  p.id                       as politician_id,
  compute_trust_score(p.id)  as trust_score,
  count(*) filter (where pr.status = 'Delivered')        as kept_count,
  count(*) filter (where pr.status = 'In progress') as in_progress_count,
  count(*) filter (where pr.status = 'No movement')      as broken_count,
  -- count(pr.id), not count(*): the left join yields one null row for a
  -- politician with no promises, and count(*) would report that as 1 tracked.
  count(pr.id)                                      as tracked_count,
  max(pr.updated_at)                                as last_promise_update
from politicians p
left join promises pr
  on pr.politician_id = p.id and pr.state = 'published'
group by p.id;

create unique index politician_scores_pk on politician_scores (politician_id);

create or replace function refresh_politician_scores()
returns void
language sql
security definer
as $$
  refresh materialized view concurrently politician_scores;
$$;

-- ---------------------------------------------------------------------------
-- Value match
-- ---------------------------------------------------------------------------

/**
 * Value match for one user against one politician, 0-100.
 *
 * Rank weights fall off linearly (top issue counts most). For each shared
 * issue, agreement is the distance between the user's position and the
 * politician's on the same -100..100 axis, so opposing a policy the user also
 * opposes scores as agreement.
 *
 * Coverage matters as much as agreement. An official with one position on file
 * that happens to align perfectly is not a better match than one who aligns
 * closely across every issue the voter ranked — but a raw average would score
 * them 100 and put them at the top of the feed. So the raw score is shrunk
 * toward neutral (50) in proportion to how much of the voter's ranked weight
 * is actually evidenced. Both numbers are returned: `coverage` is what lets the
 * UI say plainly how much of a match is backed by a published position.
 */
create or replace function compute_match(p_user uuid, p_politician uuid)
returns table (match_score numeric, coverage numeric, raw_score numeric)
language sql
stable
as $$
  with ranked as (
    select
      w.issue_id,
      w.position_score as user_pos,
      (select count(*) from user_issue_weights x where x.user_id = p_user) - w.rank + 1 as weight
    from user_issue_weights w
    where w.user_id = p_user
  ),
  joined as (
    select
      r.weight,
      r.user_pos,
      pp.position_score as pol_pos
    from ranked r
    left join policy_positions pp
      on pp.issue_id = r.issue_id
     and pp.politician_id = p_politician
     and pp.state = 'published'
  ),
  agg as (
    select
      coalesce(
        sum(weight * (100 - abs(coalesce(user_pos, 0) - pol_pos) / 2))
          filter (where pol_pos is not null)
        / nullif(sum(weight) filter (where pol_pos is not null), 0),
        0) as raw,
      coalesce(
        sum(weight) filter (where pol_pos is not null)
        / nullif(sum(weight), 0),
        0) as cov
    from joined
  )
  select
    round(raw * cov + 50 * (1 - cov), 1),
    round(cov, 2),
    round(raw, 1)
  from agg;
$$;
