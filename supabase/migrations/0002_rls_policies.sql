-- Row level security.
--
-- The split is simple: public reference data (who holds office, what they
-- promised, what was fact-checked) is readable by anyone, signed in or not.
-- Anything attached to a person is readable and writable only by that person.
-- Every write to reference data goes through the service role, which the
-- ingestion jobs use and which bypasses RLS.

-- ---------------------------------------------------------------------------
-- Public reference data: read-only to anon and authenticated
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'jurisdictions', 'districts', 'zip_districts', 'offices',
    'politicians', 'politician_offices', 'issues',
    'sources', 'politician_mentions',
    'elections', 'races', 'candidacies'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I_public_read on %I for select using (true)', t, t);
  end loop;
end $$;

-- Editorial tables expose published rows only. Drafts stay invisible until a
-- human promotes them, so an unreviewed AI verdict can never reach a voter.

alter table policy_positions enable row level security;
create policy policy_positions_public_read on policy_positions
  for select using (state = 'published');

alter table promises enable row level security;
create policy promises_public_read on promises
  for select using (state = 'published');

alter table promise_sources enable row level security;
create policy promise_sources_public_read on promise_sources
  for select using (
    exists (select 1 from promises p where p.id = promise_id and p.state = 'published')
  );

alter table promise_events enable row level security;
create policy promise_events_public_read on promise_events
  for select using (
    exists (select 1 from promises p where p.id = promise_id and p.state = 'published')
  );

alter table claims enable row level security;
create policy claims_public_read on claims
  for select using (
    exists (
      select 1 from fact_checks f
      where f.claim_id = claims.id and f.state = 'published'
    )
  );

alter table fact_checks enable row level security;
create policy fact_checks_public_read on fact_checks
  for select using (state = 'published');

alter table fact_check_sources enable row level security;
create policy fact_check_sources_public_read on fact_check_sources
  for select using (
    exists (select 1 from fact_checks f where f.id = fact_check_id and f.state = 'published')
  );

-- ---------------------------------------------------------------------------
-- Per-user data: owner only
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;

create policy profiles_select_own on profiles
  for select using (auth.uid() = id);
create policy profiles_insert_own on profiles
  for insert with check (auth.uid() = id);
create policy profiles_update_own on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

do $$
declare t text;
begin
  foreach t in array array[
    'user_issue_weights', 'saved_politicians', 'user_ballot_marks'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I_own on %I for all using (auth.uid() = user_id)
       with check (auth.uid() = user_id)', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Profile bootstrap: every new auth user gets a profiles row
-- ---------------------------------------------------------------------------

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
