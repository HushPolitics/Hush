# The Hush ingestion pipeline

This is the part that makes or breaks the product. Everything else is a
well-built CRUD app; this is the thing that has to be right, because the whole
pitch is "an unbiased stream of data" and a pipeline that quietly marks an
unmet promise against someone who met it destroys that in one screenshot.

The design below is built around one rule: **the model never writes a published
row.** It writes an assessment, with its evidence and its confidence, into a
table no voter can read. Promotion to something a voter sees is a separate step
with its own criteria and an audit trail.

---

## 1. What the pipeline actually has to do

Working backwards from the four screens:

| Screen | Needs | Hardest part |
|---|---|---|
| Feed / Profile | Positions per issue | Turning campaign prose into a signed position score |
| Trust ledger | Promises with statuses and dates | Deciding a promise is *resolved*, not just discussed |
| Fact check | Claims with verdicts and sources | Not being wrong |
| Compare | Stances across politicians | Consistency between officials |

Two of those are extraction problems (find the promise, find the claim). Two are
judgment problems (did they keep it, is it true). They deserve different
treatment, and the pipeline splits accordingly.

---

## 2. Stages

```
 ┌──────────────┐
 │  discover    │  who exists, which districts, which offices
 └──────┬───────┘  → politicians, offices, candidacies
        │
 ┌──────▼───────┐
 │   collect    │  official site + news sweep + primary records
 └──────┬───────┘  → sources (raw_text, reliability, content_hash)
        │
 ┌──────▼───────┐
 │   resolve    │  which politician does this source actually mention
 └──────┬───────┘  → politician_mentions (match_confidence)
        │
 ┌──────▼───────┐
 │   extract    │  pull promises, claims, positions out of text
 └──────┬───────┘  → promises / claims / policy_positions (state='draft')
        │
 ┌──────▼───────┐
 │    assess    │  verify each claim, re-status each promise
 └──────┬───────┘  → claim_assessments / promise_assessments (never public)
        │
 ┌──────▼───────┐
 │   promote    │  confidence + agreement + review → published
 └──────┬───────┘  → fact_checks.state='published'
        │
 ┌──────▼───────┐
 │    score     │  recompute trust, refresh materialized view
 └──────────────┘  → politician_scores
```

Each stage is a row in `ingest_jobs` with its own `kind`, so a failure at
`assess` does not force a re-crawl, and the cost of each stage is measurable per
politician (`tokens_in` / `tokens_out` are recorded on the job).

---

## 3. Stage detail

### 3.1 Discover

Not an AI problem — it is a data-loading problem, and the free public sources
are good. In rough order of usefulness:

- **Congress**: the `unitedstates/congress-legislators` dataset (public domain,
  YAML on GitHub) gives every federal legislator with bioguide IDs, terms,
  parties and official URLs. This is the single best free seed for the federal
  layer.
- **State**: Open States (`v3` API) covers state legislators and their bills for
  all 50 states.
- **Local**: no national dataset exists. Local coverage has to be built
  market-by-market from county clerk and city sites. **Plan for this** — it is
  the real cost of "every race on your ballot," and it is why launching in one
  metro first is the right call.
- **Districts and ballots**: the Google Civic Information API resolves an
  address to districts and, near an election, to a ballot. It is the fastest way
  to make the ZIP lookup real.

Keep the external IDs (`bioguide_id`, `openstates_id`, `fec_candidate_id`). They
are what lets you re-import a source later without creating duplicate people.

### 3.2 Collect

Two feeds per politician:

**Their own site.** Cadence: weekly. Fetch, extract main content, hash it. If
the hash matches, stop — no tokens spent. This is where stated positions and
campaign pledges come from, and it is a *primary* source: what they say they
believe is not in dispute, only whether they acted on it.

**Articles naming them.** Cadence: daily. Query a news API by name plus
disambiguator (office, district, state). Candidates worth pricing: GDELT (free,
enormous, noisy), NewsAPI, and direct RSS from the outlets that actually cover
the district — for local races the county paper matters more than any national
wire.

Every fetch writes one `sources` row with `raw_text` kept. That matters twice:
re-assessment without re-fetching, and the ability to still quote a source after
a page is edited or pulled.

**Reliability** is assigned at collect time, per domain, on a rubric that lives
in code and is reviewable:

| Kind | Reliability | Examples |
|---|---|---|
| `primary_record` | 0.95 | Roll calls, bill text, agency filings, court dockets, budgets |
| `official_site` | 0.80 | The politician's own site (authoritative for *stated* positions only) |
| `article` (news desk) | 0.60–0.75 | Wire services, established local dailies |
| `press_release` | 0.50 | Advocacy and campaign releases |
| `article` (opinion) | 0.30 | Editorials, columns |
| `social` | 0.20 | Posts, unless the claim *is* the post |

A verdict's confidence is capped by the best source supporting it. A "False" on
nothing but opinion columns cannot publish.

### 3.3 Resolve

Name collisions are the quiet killer here — two Rep. Smiths, a state senator and
a city councilor with the same surname, a national figure sharing a name with a
local trustee. Attributing a false claim to the wrong person is the single worst
failure mode this product has.

So resolution is explicit and scored: match on full name plus at least one
corroborator (office title, district, state, party, or a known alias) before
writing a `politician_mentions` row. Below 0.8 confidence the mention is stored
but no extraction runs on it.

### 3.4 Extract

Cheap model, tight schema, one job per source. Ask for:

- **Promises**: a future commitment attributable to this politician, with the
  date it was made and a target date if stated. Not "supports X" — a *commitment
  to do* X.
- **Claims**: a checkable factual assertion they made. Not opinion, not
  prediction, not values. "Rent has fallen every year since I took office" is
  checkable. "We need to do better on housing" is not.
- **Positions**: their stance on a tracked issue, with a signed score.

Everything lands `state='draft'`. Near-duplicate promises across sources are
merged on similarity (the `pg_trgm` index is there for this) rather than
creating a second ledger row for the same pledge.

### 3.5 Assess — the part that has to be right

Two separate jobs, different rubrics.

**Claim assessment.** Given the claim and a retrieved evidence set, produce a
verdict, a finding paragraph, a confidence, and — required — a
`disconfirming_note`: what evidence would change this verdict. A verdict with no
articulable falsifier is a red flag and is routed to review automatically.

Three practices matter more than the prompt:

1. **Retrieve before judging.** The evidence set is assembled first, from
   `sources`, ranked by reliability. The model judges the claim *against those
   documents* and cites which ones it used. It is never asked what it knows.
2. **Independent passes, then compare.** Run the assessment more than once with
   different evidence orderings, or with a second model. Agreement raises
   confidence; disagreement routes straight to `review_queue` with
   `reason='disagreement'`. Disagreement is signal, not noise — it is exactly
   the set of claims where a human should look.
3. **Verdict granularity.** `Unverifiable` is a first-class outcome, not a
   failure. A pipeline that always returns True/Misleading/False will invent
   certainty on claims that do not have any. Most political claims that feel
   slippery are *misleadingly framed true statements*, which is why
   `Misleading` needs to be as easy to reach as `False`.

**Promise assessment.** Different question: has the world changed such that this
pledge is now kept or unmet? Evidence is weighted toward primary records — a
roll call, a budget line, an agency report. The model proposes a status; the
promotion rule requires a primary source for any transition to `Kept` or
`Not fulfilled`, because those are the transitions that move the trust score.

The `In progress` trap deserves a note. An official can keep a pledge
permanently "in progress" and never take a hit. The scoring function counts an
`In progress` promise past its `target_date` against the score at partial
weight, which is why `target_date` is worth extracting carefully.

### 3.6 Promote

A draft becomes public only when **all** hold:

- confidence ≥ 0.75
- at least one supporting source with reliability ≥ 0.6
- for `False` verdicts and for `Kept`/`Not fulfilled` promise transitions: at least one
  `primary_record` source
- independent passes agree
- the politician is not in a contested window (see below)

Everything else goes to `review_queue`. Plus a **random audit sample** — a fixed
percentage of auto-published rows queued for human review regardless of
confidence. Without it, there is no way to know the auto-publish threshold is
still calibrated.

**Contested windows.** In the last 30 days before an election, claims about
candidates in that race get a lower auto-publish threshold and a higher review
priority. That is when a wrong verdict does the most damage and when the
incentive to game the pipeline is highest.

### 3.7 Score

`compute_trust_score()` in migration 0003, refreshed into the
`politician_scores` materialized view. The weights live in the
`scoring_weights` table rather than in code, so a rubric change is a dated row
and the UI can always explain the number on screen.

---

## 4. Bias — the thing the product is actually promising

"Unbiased" is a strong claim, and the honest version of it is not "our AI has no
opinions." It is **"you can check our work."** Concretely:

1. **Every published verdict cites sources the reader can open.** No source, no
   publication. This alone does most of the work.
2. **Symmetry testing.** Run the same claim text attributed to politicians of
   different parties and compare verdicts. If they differ, the rubric is
   leaking. This should be a scheduled job, not a one-time check.
3. **Publish the rubric.** The scoring weights and the verdict criteria should
   be a public page. A trust score no one can audit is just another opinion.
4. **Balance the source diet.** Track the partisan lean distribution of sources
   per politician. If the evidence set for one party's officials skews toward
   hostile outlets, the verdicts will too, honestly derived and still unfair.
5. **A correction path.** A visible way for a politician's office or a reader to
   contest a verdict, and a `retracted` state that is already in the enum. Being
   correctable is more credible than being right.
6. **Rate by claim, not by person.** Never let an aggregate score feed back into
   how an individual claim is judged. That is how a feedback loop starts.

Worth saying plainly: a fully automatic fact-checker with no human in the loop
is not a solved problem, and shipping one as though it were is the main way this
product could hurt people. The architecture here is built so that the
human-review budget is a dial, not a rewrite — you can launch with heavy review
on a small market and open the threshold as the calibration data comes in.

## 5. Legal and practical notes

- **Defamation risk is real.** Publishing "this official broke their promise" or
  "this claim is false" about a named living person is exactly the shape of a
  defamation claim. Public figures must prove actual malice, which is a high
  bar — but a documented review process, cited sources, and a correction policy
  are what make that bar hold. Worth a lawyer's hour before launch, and worth
  the retraction path being real rather than nominal.
- **Respect robots.txt and rate limits** when crawling official sites. Store the
  crawl timestamp and the `etag`.
- **Cost control.** Content hashing before extraction is the single biggest
  saver — most crawls find nothing new. Cheap model for extract, stronger model
  for assess.
- **Start narrow.** One metro, one election cycle, deep coverage. A shallow
  national rollout produces exactly the thin, occasionally-wrong data that would
  sink the trust proposition.
