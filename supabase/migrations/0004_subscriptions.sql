-- Subscription gate.
--
-- The pay structure is undecided (monthly / yearly / one-time), so this models
-- all three without committing: a `plan` carries an interval, and `one_time`
-- is just an interval with no renewal. Swapping the decision later is a row
-- change, not a migration.
--
-- Entitlement is deliberately separated from billing. `has_entitlement()` is
-- the only thing the app asks. Whether that entitlement came from a Stripe
-- subscription, a comped account, a student rate or a launch promo is the
-- billing table's problem, not the product's.

create type billing_interval as enum ('month', 'year', 'one_time');
create type subscription_state as enum (
  'trialing', 'active', 'past_due', 'canceled', 'expired', 'comped'
);

create table plans (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  name           text not null,
  description    text,
  interval       billing_interval not null,
  price_cents    int not null,
  currency       char(3) not null default 'USD',
  stripe_price_id text unique,
  trial_days     int not null default 0,
  is_public      boolean not null default true,
  sort_order     int not null default 0
);

-- Placeholder rows covering the three candidate structures. Prices are
-- deliberately round numbers to be replaced, not defaults to ship.
insert into plans (slug, name, description, interval, price_cents, sort_order) values
  ('free',    'Free',        'Your ballot, value matching, and every published trust score.', 'month',    0,    0),
  ('monthly', 'Hush Monthly','Full promise ledgers, side-by-side compare, and claim alerts.', 'month',    500,  1),
  ('yearly',  'Hush Yearly', 'Everything monthly, billed once a year.',                       'year',     4800, 2),
  ('founder', 'Founding member', 'One payment, permanent access.',                            'one_time', 9900, 3);

create table subscriptions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  plan_id        uuid not null references plans(id),
  state          subscription_state not null default 'trialing',
  -- Null for one_time plans: access does not lapse.
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  stripe_customer_id     text,
  stripe_subscription_id text unique,
  started_at     timestamptz not null default now(),
  canceled_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index subscriptions_one_active_per_user
  on subscriptions (user_id)
  where state in ('trialing', 'active', 'past_due', 'comped');

-- Raw webhook log. Kept append-only so a billing dispute can be reconstructed.
create table billing_events (
  id           uuid primary key default gen_random_uuid(),
  provider     text not null default 'stripe',
  event_id     text unique,
  event_type   text not null,
  user_id      uuid references auth.users(id) on delete set null,
  payload      jsonb not null,
  received_at  timestamptz not null default now()
);

/**
 * The single entitlement check the app makes.
 *
 * Returns true when the user has any non-lapsed paid access. One-time plans
 * have a null period end and never lapse; comped accounts bypass billing
 * entirely. Everything else must be inside its paid period.
 */
create or replace function has_entitlement(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from subscriptions s
    join plans p on p.id = s.plan_id
    where s.user_id = p_user
      and (
        s.state = 'comped'
        or (s.state in ('trialing', 'active')
            and (p.interval = 'one_time' or s.current_period_end > now()))
      )
  );
$$;

alter table plans enable row level security;
create policy plans_public_read on plans for select using (is_public);

alter table subscriptions enable row level security;
create policy subscriptions_select_own on subscriptions
  for select using (auth.uid() = user_id);
-- Writes are service-role only: the Stripe webhook handler owns this table.

alter table billing_events enable row level security;
-- No policies: service role only.

create trigger subscriptions_set_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Scoring weights: deliberately world-readable
-- ---------------------------------------------------------------------------

-- The rubric behind every trust score is meant to be public — a score nobody
-- can audit is just another opinion, and docs/ingestion-pipeline.md commits to
-- publishing it. RLS is still switched on with an explicit read policy rather
-- than left off, so the exposure is a decision on the record instead of an
-- oversight. Writes stay service-role only.
alter table scoring_weights enable row level security;
create policy scoring_weights_public_read on scoring_weights for select using (true);
