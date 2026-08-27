-- Account creation & onboarding.
--
-- Three changes:
--   1. `profiles` grows the columns the signup wizard collects: name (for a
--      real greeting instead of a hardcoded placeholder), street-level
--      address (see note below), and a marketing opt-in.
--   2. `handle_new_user()` is extended to also seed first/last name from the
--      metadata `signUp()` passes at account creation.
--   3. `issues` gets seeded from the app's existing TOPIC_POOL
--      (src/lib/seed-data.ts) so `user_issue_weights.issue_id` has real rows
--      to point at — nothing seeded this table before now, which meant the
--      "rank up to 5 issues" step had no FK target to write to.
--
-- Note on precision: `profiles.zip` (added in 0001) is what the rest of the
-- app reads for district/ballot lookups today — city/state/street_address
-- here capture what the signup form actually asks ("where do you live?") at
-- full precision, but nothing currently geocodes street_address into a more
-- precise district than the zip-based lookup already provides. It's stored
-- so it's not thrown away, not yet consumed beyond that.

alter table profiles
  add column first_name text,
  add column last_name  text,
  add column street_address text,
  add column city   text,
  add column state  char(2),
  add column marketing_email_opt_in boolean not null default false;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, first_name, last_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Seed `issues` from TOPIC_POOL (src/lib/seed-data.ts), in the same order, so
-- ranked-issue writes (onboarding Step 3, and Profile's existing "Your top
-- issues" panel once it moves off Prefs-only) have real issue_id rows to
-- reference. Slugs are hand-picked to match the app's existing kebab-case
-- convention ('tx-35', 'austin-citywide') rather than derived at insert time.
insert into issues (slug, label, sort_order) values
  ('healthcare',           'Healthcare',           1),
  ('housing',               'Housing',              2),
  ('voting-rights',         'Voting rights',        3),
  ('climate',                'Climate',              4),
  ('labor',                  'Labor',                5),
  ('education',              'Education',            6),
  ('economy',                'Economy',              7),
  ('immigration',            'Immigration',          8),
  ('criminal-justice',       'Criminal justice',     9),
  ('guns',                   'Guns',                10),
  ('reproductive-rights',    'Reproductive rights', 11),
  ('transit',                'Transit',             12),
  ('water',                  'Water',               13),
  ('veterans',               'Veterans',            14)
on conflict (slug) do nothing;
