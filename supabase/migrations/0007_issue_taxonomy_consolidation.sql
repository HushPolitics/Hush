-- Issue taxonomy consolidation: 20 issues, Water folded into Climate.
-- Slugs must equal issueSlug(label) in src/lib/scoring.ts, because the app
-- resolves a ranked issue's name to issues.id by slugifying the label.

-- 1. Renames (same row, new slug + label, so existing references survive).
update issues set slug = 'election-laws-voting-rights',  label = 'Election Laws / Voting Rights'   where slug = 'voting-rights';
update issues set slug = 'climate-environmental-laws',   label = 'Climate / Environmental Laws'    where slug = 'climate';
update issues set slug = 'jobs-labor',                   label = 'Jobs / Labor'                    where slug = 'labor';
update issues set slug = 'crime-public-safety',          label = 'Crime / Public Safety'           where slug = 'criminal-justice';
update issues set slug = 'gun-laws',                     label = 'Gun Laws'                        where slug = 'guns';
update issues set slug = 'abortion-reproductive-rights', label = 'Abortion / Reproductive Rights' where slug = 'reproductive-rights';
update issues set slug = 'infrastructure-transportation',label = 'Infrastructure / Transportation' where slug = 'transit';
update issues set slug = 'cost-of-living-economy',       label = 'Cost of Living / Economy'        where slug = 'economy';

-- 2. Water: move anyone who ranked it onto Climate / Environmental Laws
--    (skipped for a user who already ranked that one), then remove the row.
--    Each moved row keeps its own rank, so the (user_id, rank) unique index
--    can't collide.
update user_issue_weights w
set issue_id = (select id from issues where slug = 'climate-environmental-laws')
where w.issue_id = (select id from issues where slug = 'water')
  and not exists (
    select 1 from user_issue_weights x
    where x.user_id = w.user_id
      and x.issue_id = (select id from issues where slug = 'climate-environmental-laws')
  );

delete from issues where slug = 'water';

-- 3. New issues.
insert into issues (slug, label, sort_order) values
  ('government-spending',      'Government Spending',        14),
  ('taxes',                    'Taxes',                      15),
  ('ai-technology',            'AI / Technology',            16),
  ('medicare-social-security', 'Medicare / Social Security', 17),
  ('lgbtq-rights',             'LGBTQ+ Rights',              18),
  ('data-centers',             'Data Centers',               19),
  ('foreign-policy',           'Foreign Policy',             20)
on conflict (slug) do nothing;

-- 4. Display order for all 20.
update issues set sort_order = v.n
from (values
  ('healthcare', 1), ('housing', 2), ('election-laws-voting-rights', 3),
  ('climate-environmental-laws', 4), ('education', 5), ('jobs-labor', 6),
  ('immigration', 7), ('crime-public-safety', 8), ('gun-laws', 9),
  ('abortion-reproductive-rights', 10), ('infrastructure-transportation', 11),
  ('veterans', 12), ('cost-of-living-economy', 13), ('government-spending', 14),
  ('taxes', 15), ('ai-technology', 16), ('medicare-social-security', 17),
  ('lgbtq-rights', 18), ('data-centers', 19), ('foreign-policy', 20)
) as v(slug, n)
where issues.slug = v.slug;
