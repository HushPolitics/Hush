/**
 * App content: the editorial and configuration constants Hush ships with.
 *
 * This is not data about politicians. It is the product's own content -- the
 * issue taxonomy, the Issue Finder question bank, the Stance Check statements,
 * and the election calendar -- written by Hush rather than ingested from a
 * records source. It lives here, separate from anything a politician said or
 * did, so "where did this come from" has one answer per file: `repo.ts` for
 * the public record, this file for what Hush itself wrote.
 *
 * It is the surviving half of the old `seed-data.ts`. The other half -- the
 * invented politicians, races, promises, fact-check verdicts and funding
 * figures the design shipped with -- is gone, replaced by real rows out of
 * Supabase. Nothing in this file asserts a fact about a real person.
 */

export const TOPIC_POOL: string[] = [
  "Healthcare",
  "Housing",
  "Voting rights",
  "Climate",
  "Labor",
  "Education",
  "Economy",
  "Immigration",
  "Criminal justice",
  "Guns",
  "Reproductive rights",
  "Transit",
  "Water",
  "Veterans"
];

/**
 * Issue Finder's question bank: 8 specific, in-the-weeds policy
 * details per `TOPIC_POOL` issue (112 total), ordered core-first within each
 * issue's array. Deliberately not generic topic ratings ("how important is
 * gun rights to you") — each one names a specific provision within that
 * umbrella issue, so Issue Finder tests whether someone holds a view on the
 * actual specifics rather than just recognizing a hot-button label.
 *
 * Every question is phrased as a neutral statement of what a policy would
 * do, not an argument for or against it, and asks only how *important* that
 * detail is to the person — not whether they agree with it. That importance
 * framing is what keeps the phrasing from leaning: caring a lot about a
 * specific provision doesn't reveal which side of it someone is on, unlike
 * an agree/disagree scale would. Within a charged issue (e.g. Guns,
 * Reproductive rights, Immigration) the 8 questions are also deliberately
 * split across provisions typically favored by different sides of that
 * issue's usual debate, so the set as a whole doesn't only test one side's
 * preferred reforms.
 *
 * The UI supplies the fixed "How important is it to you that ___?" framing
 * and the fixed four answers (Not important / Somewhat important /
 * Important / Very important) — see IssueFinderView — these strings are
 * just the ___.
 *
 * `lib/issue-finder.ts` picks 2/3/4 of each issue's 8 (Quick/Standard/Thorough)
 * per sitting, unanswered-first, so a retake naturally surfaces fresh ones
 * before cycling back through already-answered questions.
 */
export const ISSUE_FINDER_BANK: Record<string, string[]> = {
  "Healthcare": [
    "health insurers be required to cover pre-existing conditions without charging higher premiums for them",
    "Medicare be allowed to negotiate prescription drug prices directly with drug manufacturers",
    "hospitals be required to publicly post their actual negotiated prices for common procedures",
    "people be allowed to buy into a government-run health plan (a \"public option\") alongside private insurance",
    "Health Savings Accounts be expanded so more people can use pre-tax dollars for medical expenses",
    "insurance companies be allowed to sell health plans across state lines, outside their home state's regulations",
    "non-economic damages (e.g., \"pain and suffering\") in medical malpractice lawsuits be capped by law",
    "Medicaid eligibility be expanded to cover more low-income adults in states that haven't already done so"
  ],
  "Housing": [
    "local governments allow duplexes and triplexes in areas currently zoned for single-family homes only",
    "landlords be required to give tenants a minimum notice period (e.g., 60 days) before a rent increase takes effect",
    "cities require a percentage of units in new large developments to be income-restricted affordable housing",
    "federal housing-voucher funding be expanded to serve more of the low-income households that qualify but don't currently receive one",
    "permitting and environmental-review timelines for new home construction be shortened by law",
    "cities eliminate minimum parking-space requirements that limit how much housing can be built on a lot",
    "local governments be allowed to enact rent control limiting how much annual rent can increase",
    "local property tax increases on a primary residence be capped by law"
  ],
  "Voting rights": [
    "states offer at least two weeks of early in-person voting before every federal election",
    "voters be automatically registered when they get a driver's license, unless they opt out",
    "voters be required to show a government-issued photo ID at the polls",
    "voting rights be automatically restored upon completion of a felony prison sentence, without a separate application process",
    "voters be required to provide proof of citizenship when registering to vote",
    "states limit the number of ballot drop boxes available per county",
    "states be required to count mail ballots postmarked by Election Day even if received after",
    "voters be required to periodically reverify their registration (e.g., every few years) to remove inactive entries from the rolls"
  ],
  "Climate": [
    "new fossil-fuel power plants be required to capture and store a portion of their carbon emissions",
    "the federal government offer tax credits for installing residential solar panels",
    "the federal government put a direct price (a tax or fee) on carbon emissions from large industrial emitters",
    "new gas-powered vehicle sales be phased out by a set future year in favor of electric vehicles",
    "permitting for new nuclear power plants be streamlined to speed up construction",
    "additional federal land be opened for oil and gas drilling leases",
    "fossil fuel companies be held legally liable for a share of climate-related disaster costs (e.g., through a state climate superfund)",
    "insurance companies be allowed to price policies based on a property's specific wildfire or flood risk, without state price caps"
  ],
  "Labor": [
    "gig-economy workers (e.g., rideshare and delivery drivers) be classified as employees eligible for benefits, rather than independent contractors",
    "the federal minimum wage be indexed to inflation so it rises automatically each year",
    "private-sector workers be guaranteed a minimum number of paid sick days per year by federal law",
    "non-compete agreements be banned for hourly and low-wage workers",
    "\"right-to-work\" laws be in effect nationwide, so no worker can be required to join or pay dues to a union as a condition of employment",
    "businesses with fewer than a set number of employees (e.g., 50) be exempt from certain federal labor-law reporting requirements",
    "federal law guarantee workers a minimum number of weeks of paid family and medical leave",
    "unemployment insurance require recipients to document a set number of job applications per week to remain eligible"
  ],
  "Education": [
    "public funding follow a student to the public, charter, or private school their family chooses",
    "federal student loan borrowers have access to income-driven repayment plans that cap payments at a percentage of income",
    "public school teacher salaries be tied to a state-set minimum, adjusted for local cost of living",
    "a portion of federal student loan debt be forgiven for borrowers who make a set number of years of on-time payments",
    "funding for vocational and trade-school programs be increased as an alternative to four-year college",
    "colleges and universities share financial responsibility when their graduates default on federal student loans",
    "free community college be available to any state resident who wants to attend",
    "standardized state testing results be used to hold individual schools accountable, including potential funding consequences for chronic low performance"
  ],
  "Economy": [
    "corporations with over $1 billion in annual profit pay a minimum federal tax rate, regardless of deductions",
    "the federal government impose tariffs on imported goods in industries facing foreign competition, even if it raises prices for U.S. consumers",
    "capital gains on investments held over a year be taxed at a lower rate than wage income",
    "the estate tax apply only to inheritances above a multi-million-dollar threshold, exempting smaller estates entirely",
    "the \"carried interest\" tax treatment allowing investment fund managers to pay a lower capital-gains rate on part of their income be eliminated",
    "the IRS receive increased funding specifically to audit high-income earners and large corporations",
    "federal regulations on new small-business formation (e.g., licensing requirements) be reduced",
    "the federal government reduce its budget deficit primarily through spending cuts rather than tax increases"
  ],
  "Immigration": [
    "undocumented immigrants who have lived in the U.S. for a set number of years with no serious criminal record be given a path to legal status",
    "employers be required to use E-Verify to confirm a new hire's work eligibility",
    "the number of employment-based visas issued each year be increased for occupations with documented labor shortages",
    "unaccompanied minors who arrive at the border be guaranteed a government-appointed attorney for their immigration court proceedings",
    "funding for physical barriers and surveillance technology along the U.S.-Mexico border be increased",
    "federal funding be withheld from \"sanctuary\" jurisdictions that limit local police cooperation with federal immigration enforcement",
    "Deferred Action for Childhood Arrivals (DACA)-style protections be codified into permanent federal law for people brought to the U.S. as children",
    "the annual number of legal immigration visas be tied to a formula based on U.S. labor-market needs, reviewed periodically"
  ],
  "Criminal justice": [
    "judges retain discretion to release a defendant without cash bail for non-violent offenses",
    "police body-camera footage be released to the public within a set number of days after a use-of-force incident",
    "mandatory minimum sentences be eliminated for non-violent drug offenses, restoring judicial discretion",
    "police departments be required to report use-of-force incidents to a public state or federal database",
    "federal funding for local police department hiring and equipment be increased",
    "mandatory minimum sentences be increased for repeat violent offenders",
    "juveniles charged with serious violent crimes be eligible to be tried as adults",
    "\"three-strikes\" laws requiring significantly longer sentences for a third felony conviction remain in effect"
  ],
  "Guns": [
    "background checks apply to private gun sales between individuals, not just sales through licensed dealers",
    "there be a minimum waiting period between purchasing a firearm and taking possession of it",
    "a person be required to complete a safety training course before purchasing a firearm",
    "gun owners in households with minors be required to store firearms in a locked container or with a trigger lock when not in use",
    "concealed-carry permits issued in one state be automatically recognized in every other state (national reciprocity)",
    "firearm manufacturers and dealers be protected from being held liable for crimes committed by third parties using their products",
    "states be prohibited from imposing a longer firearm-purchase waiting period than federal law requires",
    "magazine capacity (the number of rounds a magazine can hold) be left unregulated by state law"
  ],
  "Reproductive rights": [
    "any abortion restriction include an explicit exception for when the pregnant person's life or physical health is at risk",
    "health insurance plans be required to cover contraception with no out-of-pocket cost",
    "minors be required to obtain parental consent before receiving an abortion, absent a judicial waiver",
    "public funding (e.g., Medicaid) be allowed to cover abortion services for low-income patients",
    "abortion providers be required to offer patients the opportunity to view an ultrasound before the procedure",
    "a waiting period (e.g., 24 hours) be required between an initial consultation and an abortion procedure",
    "federal law guarantee a right to abortion up to fetal viability, regardless of state law",
    "health care providers be legally protected from being investigated or prosecuted by another state for providing legal abortion care to a patient who traveled there"
  ],
  "Transit": [
    "cities dedicate a portion of new road-construction budgets to dedicated bus lanes",
    "transit agencies be allowed to charge lower fares during off-peak hours and higher fares during peak demand",
    "new highway-widening projects include a dedicated passenger rail or bus-rapid-transit line as part of the same funding package",
    "transit systems receive dedicated, guaranteed funding (e.g., from a gas tax or fee) rather than competing annually against other budget priorities",
    "state transportation funding prioritize highway and road-capacity expansion over new transit projects",
    "private companies be allowed to operate toll lanes or transit routes competitively instead of a government transit agency",
    "a portion of gas-tax revenue be redirected specifically to fund public transit rather than roads alone",
    "local transit systems be required to cover a minimum percentage of operating costs through fares rather than public subsidy"
  ],
  "Water": [
    "municipal water utilities be required to test for and publicly disclose PFAS (\"forever chemicals\") levels in drinking water",
    "municipalities be required to replace lead water pipes on a fixed public timeline",
    "agricultural operations be subject to limits on water withdrawal from shared rivers and aquifers during drought conditions",
    "water utilities be required to cap what they can charge low-income households as a percentage of monthly income",
    "water infrastructure upgrades be funded primarily through public-private partnerships rather than raising utility rates or taxes",
    "permitting for new reservoir and water-storage infrastructure projects be streamlined",
    "water utility rate-setting remain under local and state control rather than new federal mandates or subsidy programs",
    "industrial facilities be required to publicly disclose the chemicals they discharge into local waterways"
  ],
  "Veterans": [
    "veterans be able to see a private-sector doctor at government expense when VA wait times exceed a set threshold",
    "veterans exposed to documented toxic hazards (e.g., burn pits) be presumed eligible for related disability benefits without individually proving causation",
    "a portion of federal contracts be set aside specifically for veteran-owned small businesses",
    "student veterans be allowed to transfer unused GI Bill education benefits to a spouse or child",
    "direct investment in VA hospital staffing and infrastructure be prioritized over expanding referrals to private-sector care",
    "veterans be given a fixed dollar amount they can choose to use at either VA or private facilities",
    "veterans' disability claims be processed within a guaranteed maximum timeframe (e.g., 125 days)",
    "active-duty service members receive automatic, expedited processing of home-loan applications through the VA loan program"
  ]
};

/**
 * One specific, debatable policy statement per `TOPIC_POOL` issue, for
 * Stance Check. Deliberately a single concrete claim rather than the issue
 * name itself — "Housing" the topic covers a dozen debates; "Local
 * governments should eliminate single-family-only zoning" is one a
 * candidate can actually agree or disagree with. Every `TOPIC_POOL` entry
 * has a statement here so any subset of `topics` (the shared issue list
 * Stance Check reuses) always has something to ask about.
 */
export const STANCE_STATEMENTS: Record<string, string> = {
  "Healthcare": "Medicare should be allowed to negotiate directly with drug manufacturers over prescription drug prices.",
  "Housing":
    "Local governments should ease single-family-only zoning to allow duplexes and small apartment buildings in more neighborhoods.",
  "Voting rights": "Voters should be required to show valid photo ID to cast a ballot.",
  "Climate": "State governments should be able to phase out sales of new gas-powered cars by 2035, as California has.",
  "Labor": "The federal minimum wage should be raised for the first time since 2009.",
  "Education":
    "Public education funding should be able to follow a student to the public, charter, or private school their family chooses.",
  "Economy": "The federal government should raise taxes on household income above $400,000 a year to help reduce the deficit.",
  "Immigration":
    "Undocumented immigrants who have lived in the U.S. for years without a criminal record should have a path to citizenship.",
  "Criminal justice": "Cash bail should be ended for nonviolent, low-risk offenses.",
  "Guns": "Federal law should require a background check for every firearm sale, including private sales at gun shows.",
  "Reproductive rights":
    "States should be able to restrict abortion after the point of fetal viability, with exceptions for the mother's life and health.",
  "Transit":
    "Cities facing traffic congestion should invest new transportation funding in public transit rather than expanding highway lanes.",
  "Water":
    "Water utilities should be required to replace all remaining lead service lines within a set deadline, funded by federal infrastructure dollars.",
  "Veterans":
    "Veterans should have the option to receive private-doctor care at government expense when VA wait times or distance don't meet certain standards.",
};

/**
 * Optional one- or two-sentence context for why a `STANCE_STATEMENTS` claim
 * is a live debate -- rendered under the question, above the answer chips,
 * only for an issue that has an entry here. Empty today: no explainer copy
 * has been written yet, so nothing renders until entries are added, same
 * convention as a candidate with no key in `STANCE_POSITIONS`.
 */
export const STANCE_WHY_MATTERS: Record<string, string> = {};

/** Election the prototype counts down to. */
export const ELECTION_ISO = "2026-11-03T19:00:00-06:00";

export const KEY_DATES = [
  { label: "Register by", value: "Oct 5", detail: "Be sure you're registered to vote." },
  { label: "Early voting", value: "Oct 19 - 30", detail: "Vote early, in person, ahead of Election Day." },
  { label: "Mail ballot request", value: "Oct 23", detail: "Request by this date to vote by mail." },
] satisfies { label: string; value: string; detail: string }[];
