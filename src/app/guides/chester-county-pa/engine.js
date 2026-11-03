/* eslint-disable */
// Chester County, PA ballot guide engine. This is the attached pa-ballot-guide.html script,
// copied unchanged apart from five mechanical edits: it receives the container element
// instead of looking it up, scrolls the app shell's scroll area instead of the window,
// registers its click handler by name, returns a cleanup function, and keeps picks under
// its own localStorage key (chesterPaBallotIssues) so it does not share them with the
// Fort Collins guide.
export function mountGuide(app, scroller) {
var races = [
 {
  "title": "Governor and Lieutenant Governor",
  "sub": "Elect one pair. Also on the ballot: Ken Krawchuk and John Thomas (Libertarian), and Tony Dastra and Craig Bolton (Green). We researched the two largest tickets.",
  "cands": [
   {
    "name": "Josh Shapiro",
    "party": "Democratic, with Austin Davis",
    "items": [],
    "none": ""
   },
   {
    "name": "Stacy Garrity",
    "party": "Republican, with Jason Richey",
    "items": [],
    "none": ""
   }
  ]
 },
 {
  "title": "U.S. House, District 6",
  "sub": "",
  "cands": [
   {
    "name": "Chrissy Houlahan",
    "party": "Democratic, incumbent",
    "items": [],
    "none": ""
   },
   {
    "name": "Marty Young",
    "party": "Republican",
    "items": [],
    "none": ""
   }
  ]
 },
 {
  "title": "Pennsylvania Senate, District 44",
  "sub": "",
  "cands": [
   {
    "name": "Katie Muth",
    "party": "Democratic, incumbent",
    "items": [],
    "none": ""
   },
   {
    "name": "Melissa Dicranian",
    "party": "Republican",
    "items": [],
    "none": ""
   }
  ]
 },
 {
  "title": "Pennsylvania House, District 167",
  "sub": "",
  "cands": [
   {
    "name": "Kristine Howard",
    "party": "Democratic, incumbent",
    "items": [],
    "none": ""
   },
   {
    "name": "Joe Lewis",
    "party": "Republican",
    "items": [],
    "none": ""
   }
  ]
 }
];
var measures = [];
var QROWS = [{"candidate": "Chrissy Houlahan", "issue": "Healthcare", "otherTopic": "", "quote": "Healthcare is a right, not a privilege. I am working to lower costs, expand access, and improve care for every American.", "type": "candidate_words", "ctx": "", "title": "Health Care | U.S. Representative Chrissy Houlahan", "url": "https://houlahan.house.gov/Issues/Issue/?IssueID=14896", "stype": "Official record"}, {"candidate": "Chrissy Houlahan", "issue": "Housing", "otherTopic": "", "quote": "Safe, stable, and affordable housing is essential for families and communities to thrive. I am championing efforts to expand access, reduce costs, and invest in solutions that keep people in their homes.", "type": "candidate_words", "ctx": "", "title": "Housing | U.S. Representative Chrissy Houlahan", "url": "https://houlahan.house.gov/Issues/Issue/?IssueID=15136", "stype": "Official record"}, {"candidate": "Chrissy Houlahan", "issue": "Election Laws / Voting Rights", "otherTopic": "", "quote": "Your vote is your voice. Every eligible American should be able to participate in our most fundamental American right: to cast their vote and make their voice heard at the ballot box.", "type": "candidate_words", "ctx": "", "title": "Voting & Elections | U.S. Representative Chrissy Houlahan", "url": "https://houlahan.house.gov/Issues/Issue/?IssueID=14902", "stype": "Official record"}, {"candidate": "Chrissy Houlahan", "issue": "Climate / Environmental Laws", "otherTopic": "", "quote": "We must leave a healthier planet for future generations--and that requires policy that addresses both the energy needs of our country and the environmental realities facing the globe.", "type": "candidate_words", "ctx": "", "title": "Energy & Environment | U.S. Representative Chrissy Houlahan", "url": "https://houlahan.house.gov/Issues/Issue/?IssueID=14814", "stype": "Official record"}, {"candidate": "Chrissy Houlahan", "issue": "Education", "otherTopic": "", "quote": "Education is the key to opportunity. I am championing efforts to strengthen our schools, support our educators, and expand access to learning.", "type": "candidate_words", "ctx": "", "title": "Education | U.S. Representative Chrissy Houlahan", "url": "https://houlahan.house.gov/Issues/Issue/?IssueID=14892", "stype": "Official record"}, {"candidate": "Chrissy Houlahan", "issue": "Immigration", "otherTopic": "", "quote": "We can and must have a system that is both fair and secure. I am pressing for comprehensive immigration reform that reflects our values.", "type": "candidate_words", "ctx": "", "title": "Immigration | U.S. Representative Chrissy Houlahan", "url": "https://houlahan.house.gov/Issues/Issue/?IssueID=14894", "stype": "Official record"}, {"candidate": "Chrissy Houlahan", "issue": "Gun Laws", "otherTopic": "", "quote": "I refuse to accept gun violence as a fact of life in America. I believe we can protect both public safety and constitutional rights.", "type": "candidate_words", "ctx": "", "title": "Gun Violence | U.S. Representative Chrissy Houlahan", "url": "https://houlahan.house.gov/Issues/Issue/?IssueID=15138", "stype": "Official record"}, {"candidate": "Chrissy Houlahan", "issue": "Abortion / Reproductive Rights", "otherTopic": "", "quote": "Ensure women can choose what’s best for their own bodies – not politicians.", "type": "candidate_words", "ctx": "", "title": "Health Care | U.S. Representative Chrissy Houlahan", "url": "https://houlahan.house.gov/Issues/Issue/?IssueID=14896", "stype": "Official record"}, {"candidate": "Chrissy Houlahan", "issue": "Infrastructure / Transportation", "otherTopic": "", "quote": "Pennsylvanians deserve safe, modern infrastructure. I am working to make smart, lasting investments in our roads, bridges, transit, and broadband.", "type": "candidate_words", "ctx": "", "title": "Transportation & Infrastructure | U.S. Representative Chrissy Houlahan", "url": "https://houlahan.house.gov/Issues/Issue/?IssueID=14900", "stype": "Official record"}, {"candidate": "Chrissy Houlahan", "issue": "Veterans", "otherTopic": "", "quote": "We have a sacred duty to care for those who served. I am working tirelessly to ensure veterans receive the support and respect they’ve earned.", "type": "candidate_words", "ctx": "", "title": "Veterans | U.S. Representative Chrissy Houlahan", "url": "https://houlahan.house.gov/Issues/Issue/?IssueID=14901", "stype": "Official record"}, {"candidate": "Chrissy Houlahan", "issue": "Taxes", "otherTopic": "", "quote": "Close tax loopholes and revoke government benefits for American companies that move U.S.-based jobs overseas in order to access cheaper labor.", "type": "candidate_words", "ctx": "", "title": "Tariffs, Trade and Taxes | U.S. Representative Chrissy Houlahan", "url": "https://houlahan.house.gov/Issues/Issue/?IssueID=14891", "stype": "Official record"}, {"candidate": "Chrissy Houlahan", "issue": "Medicare / Social Security", "otherTopic": "", "quote": "Strengthen the Affordable Care Act, Medicare, and Medicaid", "type": "candidate_words", "ctx": "", "title": "Health Care | U.S. Representative Chrissy Houlahan", "url": "https://houlahan.house.gov/Issues/Issue/?IssueID=14896", "stype": "Official record"}, {"candidate": "Chrissy Houlahan", "issue": "LGBTQ+ Rights", "otherTopic": "", "quote": "I am the proud mother of a gay daughter, and I have fought to ensure equality for her, for our fellow LGBTQ+ Americans, and for every Pennsylvanian.", "type": "candidate_words", "ctx": "", "title": "Civil Rights | U.S. Representative Chrissy Houlahan", "url": "https://houlahan.house.gov/Issues/Issue/?IssueID=14959", "stype": "Official record"}, {"candidate": "Chrissy Houlahan", "issue": "Foreign Policy", "otherTopic": "", "quote": "America is strongest when we pair our values with clear-eyed leadership on the world stage.", "type": "candidate_words", "ctx": "", "title": "Foreign Policy | U.S. Representative Chrissy Houlahan", "url": "https://houlahan.house.gov/Issues/Issue/?IssueID=15137", "stype": "Official record"}, {"candidate": "Marty Young", "issue": "Healthcare", "otherTopic": "", "quote": "That is why I support guaranteeing healthcare coverage for children, young adults, and expectant mothers in a way that reduces costs for families and employers and improves long-term outcomes.", "type": "candidate_words", "ctx": "", "title": "Healthcare - Marty Young for Congress", "url": "https://www.voteyoung.com/healthcare", "stype": "Campaign site"}, {"candidate": "Marty Young", "issue": "Housing", "otherTopic": "", "quote": "My plan fixes that by offering true 0% interest loans for starter homes up to the local median home price, giving working families and young buyers a real opportunity to achieve homeownership and build generational wealth.", "type": "candidate_words", "ctx": "", "title": "Young Americans Housing Plan - Marty Young for Congress", "url": "https://www.voteyoung.com/fix-housing", "stype": "Campaign site"}, {"candidate": "Marty Young", "issue": "Election Laws / Voting Rights", "otherTopic": "", "quote": "I support a version of the SAVE Act that requires a state or federally issued ID, with the same transparency standard Pennsylvania already has: full and public disclosure of who voted.", "type": "candidate_words", "ctx": "From his answers to nine questions posed by his opponent's campaign.", "title": "Invite to Congresswoman Houlahan for a Community Forum (The Nine Answers, On the Record)", "url": "https://www.voteyoung.com/openforum", "stype": "Campaign site"}, {"candidate": "Marty Young", "issue": "Jobs / Labor", "otherTopic": "", "quote": "Workers have the right to organize and to bargain.", "type": "candidate_words", "ctx": "From his answers to nine questions posed by his opponent's campaign.", "title": "Invite to Congresswoman Houlahan for a Community Forum (The Nine Answers, On the Record)", "url": "https://www.voteyoung.com/openforum", "stype": "Campaign site"}, {"candidate": "Marty Young", "issue": "Immigration", "otherTopic": "", "quote": "Washington should do the work only Washington can do: the border, the cartels, human trafficking, and serious criminal offenders.", "type": "candidate_words", "ctx": "He does not address ICE directly. From his answers to nine questions posed by his opponent's campaign.", "title": "Invite to Congresswoman Houlahan for a Community Forum (The Nine Answers, On the Record)", "url": "https://www.voteyoung.com/openforum", "stype": "Campaign site"}, {"candidate": "Marty Young", "issue": "Crime / Public Safety", "otherTopic": "", "quote": "I believe law enforcement must be properly funded, well-trained, and equipped with the tools they need to prevent violent crime, respond quickly in emergencies, and protect the people they serve.", "type": "candidate_words", "ctx": "", "title": "Law and Order and Public Safety - Marty Young for Congress", "url": "https://www.voteyoung.com/law-and-order", "stype": "Campaign site"}, {"candidate": "Marty Young", "issue": "Abortion / Reproductive Rights", "otherTopic": "", "quote": "My position is the current TRICARE rule: coverage when the life of the mother is at risk, and in cases of rape or incest. I will not vote for a national ban.", "type": "candidate_words", "ctx": "From his answers to nine questions posed by his opponent's campaign.", "title": "Invite to Congresswoman Houlahan for a Community Forum (The Nine Answers, On the Record)", "url": "https://www.voteyoung.com/openforum", "stype": "Campaign site"}, {"candidate": "Marty Young", "issue": "Veterans", "otherTopic": "", "quote": "I will fight for better VA healthcare, stronger mental health resources, seamless transitions to civilian jobs, and protections for military families.", "type": "candidate_words", "ctx": "", "title": "Strengthen National Security and Support Our Military - Marty Young for Congress", "url": "https://www.voteyoung.com/military", "stype": "Campaign site"}, {"candidate": "Marty Young", "issue": "Cost of Living / Economy", "otherTopic": "", "quote": "Lowering costs requires restoring fiscal discipline, aligning policy with how people actually live and work, and removing barriers that drive prices higher.", "type": "candidate_words", "ctx": "", "title": "Lower Costs for Families and Small Businesses - Marty Young for Congress", "url": "https://www.voteyoung.com/affordable", "stype": "Campaign site"}, {"candidate": "Marty Young", "issue": "Government Spending", "otherTopic": "", "quote": "In Congress, I will work to cut wasteful deficit spending that fuels inflation, including unnecessary foreign aid and funding streams to unaccountable non-government organizations.", "type": "candidate_words", "ctx": "", "title": "Lower Costs for Families and Small Businesses - Marty Young for Congress", "url": "https://www.voteyoung.com/affordable", "stype": "Campaign site"}, {"candidate": "Marty Young", "issue": "Taxes", "otherTopic": "", "quote": "I support eliminating federal taxes on tips so service workers can keep more of what they earn.", "type": "candidate_words", "ctx": "", "title": "Lower Costs for Families and Small Businesses - Marty Young for Congress", "url": "https://www.voteyoung.com/affordable", "stype": "Campaign site"}, {"candidate": "Marty Young", "issue": "Medicare / Social Security", "otherTopic": "", "quote": "Social Security benefits should not be taxed away from seniors who rely on them.", "type": "candidate_words", "ctx": "", "title": "Lower Costs for Families and Small Businesses - Marty Young for Congress", "url": "https://www.voteyoung.com/affordable", "stype": "Campaign site"}, {"candidate": "Marty Young", "issue": "Foreign Policy", "otherTopic": "", "quote": "I will confront adversaries like China and rebuild our military strength to deter aggression and protect American interests.", "type": "candidate_words", "ctx": "", "title": "Strengthen National Security and Support Our Military - Marty Young for Congress", "url": "https://www.voteyoung.com/military", "stype": "Campaign site"}, {"candidate": "Marty Young", "issue": "", "otherTopic": "Congressional term limits and ethics", "quote": "I support term limits, banning insider trading by members of Congress, and ending the revolving door that allows elected officials to cash in after leaving office.", "type": "candidate_words", "ctx": "", "title": "Competent Leadership, Not Career Politics - Marty Young for Congress", "url": "https://www.voteyoung.com/blank", "stype": "Campaign site"}, {"candidate": "Marty Young", "issue": "", "otherTopic": "Personal debt and bankruptcy reform", "quote": "In 2005, Congress made a major mistake by making it nearly impossible to discharge private student loans, credit card debt, and many medical debts in bankruptcy. My plan rolls back those changes and restores the pre-2005 bankruptcy protections, giving Americans a true fresh start when debt becomes unmanageable.", "type": "candidate_words", "ctx": "", "title": "Young Americans Fresh Start Program - Marty Young for Congress", "url": "https://www.voteyoung.com/fix-consumer-debt", "stype": "Campaign site"}, {"candidate": "Katie Muth", "issue": "Healthcare", "otherTopic": "", "quote": "We need to work together in Harrisburg to protect the availability of quality, accessible care options in all communities across the Commonwealth and this legislation is an important first step in that process.", "type": "candidate_words", "ctx": "From an August 2022 press release.", "title": "Sen. Muth, House Dems Announce Legislation on Hospital Acquisitions and Price Transparency", "url": "https://www.senatormuth.com/sen-muth-house-dems-announce-bills-on-hospital-acquisitions-and-price-transparency/", "stype": "Official record"}, {"candidate": "Katie Muth", "issue": "Election Laws / Voting Rights", "otherTopic": "", "quote": "The ability to cast a vote is one of the cornerstones of our democracy and I was grateful to have bipartisan participation in our Policy Committee hearing to highlight some of the ways we can make our elections more accessible, transparent, and efficient,", "type": "candidate_words", "ctx": "From a September 2024 press release.", "title": "Senate Dems Highlight Need for Election Reforms at Capitol Hearing - Senator Katie Muth", "url": "https://www.senatormuth.com/senate-dems-highlight-need-for-election-reforms-at-capitol-hearing/", "stype": "Official record"}, {"candidate": "Katie Muth", "issue": "Immigration", "otherTopic": "", "quote": "I introduced Senate Bill 1125 which would require school districts to implement procedures for responding to immigration enforcement at schools by limiting ICE enforcement on school grounds, protecting student privacy, and reaffirming that education is accessible to all students.", "type": "candidate_words", "ctx": "", "title": "Fall Newsletter 2026 - Senator Katie Muth", "url": "https://www.senatormuth.com/fall2026newsletter/", "stype": "Official record"}, {"candidate": "Katie Muth", "issue": "Gun Laws", "otherTopic": "", "quote": "Universal background checks are a necessity.", "type": "candidate_words", "ctx": "From an undated page on her site, apparently 2019 or 2020.", "title": "Sen. Muth Calls for Policy & Change to Combat the Gun Violence Epidemic - Senator Katie Muth", "url": "https://www.senatormuth.com/sen-muth-calls-for-policy-change-to-combat-the-gun-violence-epidemic/", "stype": "Official record"}, {"candidate": "Katie Muth", "issue": "Abortion / Reproductive Rights", "otherTopic": "", "quote": "If we cannot trust the Court to protect the rights of Pennsylvanians, then it is up to us in the state legislature to defend our rights to make decisions about our own bodies. We cannot and we will never back down in the fight to protect our rights, our bodies, and our right to choice.", "type": "candidate_words", "ctx": "From a June 2022 press release.", "title": "Senate Democrats to Introduce Legislation to Codify Roe v Wade Protections in PA Law", "url": "https://www.senatormuth.com/senate-democrats-to-introduce-legislation-to-codify-roe-v-wade-protections-in-pa-law/", "stype": "Official record"}, {"candidate": "Katie Muth", "issue": "Veterans", "otherTopic": "", "quote": "We have been fighting in the Senate to recognize survivors of MST since 2019 with several resolutions and now we are advocating for a bill to have an annual day each year to recognize these survivors.", "type": "candidate_words", "ctx": "From an October 2023 press release.", "title": "Sen. Muth, Sen. Williams Join Veterans, Elected Officials to Urge Support for MST Survivors", "url": "https://www.senatormuth.com/sen-muth-sen-williams-join-veterans-elected-officials-to-urge-support-for-mst-survivors/", "stype": "Official record"}, {"candidate": "Katie Muth", "issue": "Cost of Living / Economy", "otherTopic": "", "quote": "As inflation and the cost of living continue to outpace the earnings of so many families across our Commonwealth, it is imperative that we enhance state programs and benefits like the Child and Dependent Care Enhancement.", "type": "candidate_words", "ctx": "", "title": "Fall Newsletter 2026 - Senator Katie Muth", "url": "https://www.senatormuth.com/fall2026newsletter/", "stype": "Official record"}, {"candidate": "Katie Muth", "issue": "Government Spending", "otherTopic": "", "quote": "I voted against the budget contained in House Bill 2400 because Pennsylvanians deserve more than a budget that simply kicks our biggest challenges down the road. This budget fails to confront the issues families are facing every day: rising energy costs, affordable housing, public transportation, emergency services, and protecting our environment.", "type": "candidate_words", "ctx": "", "title": "Fall Newsletter 2026 - Senator Katie Muth", "url": "https://www.senatormuth.com/fall2026newsletter/", "stype": "Official record"}, {"candidate": "Katie Muth", "issue": "Taxes", "otherTopic": "", "quote": "Senate Bill 1208 would close corporate tax loopholes by establishing a system of combined reporting; Senate Bill 1199 would establish a tax on digital advertisements; and Senate Bill 1314 would make billionaires pay their fair share by establishing a tax on passive income.", "type": "candidate_words", "ctx": "", "title": "Fall Newsletter 2026 - Senator Katie Muth", "url": "https://www.senatormuth.com/fall2026newsletter/", "stype": "Official record"}, {"candidate": "Katie Muth", "issue": "Data Centers", "otherTopic": "", "quote": "Senate Bill 1359, which I introduced at the beginning of June, establishes a MANDATORY, statewide three-year moratorium on hyperscale data centers and their related infrastructure, including power generation facilities, and applies to both state and local approvals.", "type": "candidate_words", "ctx": "", "title": "Fall Newsletter 2026 - Senator Katie Muth", "url": "https://www.senatormuth.com/fall2026newsletter/", "stype": "Official record"}, {"candidate": "Melissa Dicranian", "issue": "Education", "otherTopic": "", "quote": "Every graduate must be fully educated to enter trade schools, colleges, universities, the armed forces, and self business starters opportunities in Pennsylvania.", "type": "candidate_words", "ctx": "", "title": "Senate 44 (melissafor44.com home page)", "url": "https://melissafor44.com/", "stype": "Campaign site"}, {"candidate": "Melissa Dicranian", "issue": "Jobs / Labor", "otherTopic": "", "quote": "My concern with something like a $15 minimum wage, for example, is what happens to a business that has already lost money for two years and suddenly has another mandated cost.", "type": "candidate_words", "ctx": "She states a concern about a $15 minimum wage. She does not say how she would vote on a bill. From a local news Q&A that the outlet says was edited for clarity and brevity.", "title": "Q&A: Melissa Dicranian Talks Economy, Energy, and Her State Senate Campaign", "url": "https://www.springford.press/article/q-a-melissa-dicranian-talks-economy-energy-and-her-state-senate-campaign", "stype": "News report"}, {"candidate": "Melissa Dicranian", "issue": "Cost of Living / Economy", "otherTopic": "", "quote": "Energy costs go into housing, goods, and transportation. Insurance costs go into operating a business. Regulations have costs. Litigation has costs. Taxes have costs.", "type": "candidate_words", "ctx": "From a local news Q&A that the outlet says was edited for clarity and brevity.", "title": "Q&A: Melissa Dicranian Talks Economy, Energy, and Her State Senate Campaign", "url": "https://www.springford.press/article/q-a-melissa-dicranian-talks-economy-energy-and-her-state-senate-campaign", "stype": "News report"}, {"candidate": "Melissa Dicranian", "issue": "Government Spending", "otherTopic": "", "quote": "We need legislation that is people-centric, business-centric, and economy-centric, and that looks at the cause of a problem instead of assuming government spending is always the solution.", "type": "candidate_words", "ctx": "From a local news Q&A that the outlet says was edited for clarity and brevity.", "title": "Q&A: Melissa Dicranian Talks Economy, Energy, and Her State Senate Campaign", "url": "https://www.springford.press/article/q-a-melissa-dicranian-talks-economy-energy-and-her-state-senate-campaign", "stype": "News report"}, {"candidate": "Melissa Dicranian", "issue": "Taxes", "otherTopic": "", "quote": "I think we have to say we’re open for business and serious about it. That means looking at redundant regulations, taxation, the corporate net income tax, and how Pennsylvania handles net operating losses.", "type": "candidate_words", "ctx": "From a local news Q&A that the outlet says was edited for clarity and brevity.", "title": "Q&A: Melissa Dicranian Talks Economy, Energy, and Her State Senate Campaign", "url": "https://www.springford.press/article/q-a-melissa-dicranian-talks-economy-energy-and-her-state-senate-campaign", "stype": "News report"}, {"candidate": "Melissa Dicranian", "issue": "Data Centers", "otherTopic": "", "quote": "I don’t believe a complete three-year statewide moratorium is where we need to be. There may be communities elsewhere in Pennsylvania, particularly places with brownfields or areas looking for investment, that decide a data center makes sense for them.", "type": "candidate_words", "ctx": "From a local news Q&A that the outlet says was edited for clarity and brevity.", "title": "Q&A: Melissa Dicranian Talks Economy, Energy, and Her State Senate Campaign", "url": "https://www.springford.press/article/q-a-melissa-dicranian-talks-economy-energy-and-her-state-senate-campaign", "stype": "News report"}, {"candidate": "Melissa Dicranian", "issue": "", "otherTopic": "Energy", "quote": "Pennsylvania is an energy producer; that energy should benefit our citizens first!", "type": "candidate_words", "ctx": "", "title": "Senate 44 (melissafor44.com home page)", "url": "https://melissafor44.com/", "stype": "Campaign site"}, {"candidate": "Melissa Dicranian", "issue": "", "otherTopic": "Manufacturing", "quote": "Pennsylvania used to be a manufacturing powerhouse. We have energy, we have a workforce, and we have people willing to invest here.", "type": "candidate_words", "ctx": "From a local news Q&A that the outlet says was edited for clarity and brevity.", "title": "Q&A: Melissa Dicranian Talks Economy, Energy, and Her State Senate Campaign", "url": "https://www.springford.press/article/q-a-melissa-dicranian-talks-economy-energy-and-her-state-senate-campaign", "stype": "News report"}, {"candidate": "Joe Lewis", "issue": "Healthcare", "otherTopic": "", "quote": "From new technology to smart legal reforms, incentives, and increased competition, Joe will look for every responsible way to keep quality care, hospitals, and local doctors within reach for Pennsylvania families.", "type": "candidate_words", "ctx": "Campaign site text written about him in the third person.", "title": "Joe Lewis for State Representative | PA House District 167", "url": "https://votejoelewis.com/", "stype": "Campaign site"}, {"candidate": "Joe Lewis", "issue": "Education", "otherTopic": "", "quote": "By staying focused on accountability, investment, and innovation, Joe wants every student to leave school with the tools they need to succeed, and every parent to have the say they deserve in choosing the right path for their child.", "type": "candidate_words", "ctx": "Campaign site text written about him in the third person.", "title": "Joe Lewis for State Representative | PA House District 167", "url": "https://votejoelewis.com/", "stype": "Campaign site"}, {"candidate": "Joe Lewis", "issue": "Crime / Public Safety", "otherTopic": "", "quote": "Joe stands behind the police officers, firefighters, and EMS providers who answer the call every day, and he’ll work to bring residents and law enforcement closer together so our communities can build the trust that keeps everyone safe.", "type": "candidate_words", "ctx": "Campaign site text written about him in the third person.", "title": "Joe Lewis for State Representative | PA House District 167", "url": "https://votejoelewis.com/", "stype": "Campaign site"}, {"candidate": "Joe Lewis", "issue": "Cost of Living / Economy", "otherTopic": "", "quote": "By unleashing the assets that already make this state strong, our schools, our healthcare research institutions, and our energy sector, Harrisburg can spark the kind of growth and innovation that brings costs down for everyone.", "type": "candidate_words", "ctx": "Campaign site text written about him in the third person.", "title": "Joe Lewis for State Representative | PA House District 167", "url": "https://votejoelewis.com/", "stype": "Campaign site"}, {"candidate": "Joe Lewis", "issue": "Government Spending", "otherTopic": "", "quote": "Joe will focus the state budget on our shared priorities: education, public safety, job creation, and economic growth, so Pennsylvania spends wisely instead of just spending more.", "type": "candidate_words", "ctx": "Campaign site text written about him in the third person.", "title": "Joe Lewis for State Representative | PA House District 167", "url": "https://votejoelewis.com/", "stype": "Campaign site"}, {"candidate": "Joe Lewis", "issue": "Data Centers", "otherTopic": "", "quote": "Joe supports a moratorium on new data center development until real guardrails are in place, ones that protect residents’ voices, preserve local control, and safeguard the environmental assets that make our communities special. No family in the 167th should see their utility bill climb to subsidize energy for a massive data center down the road.", "type": "candidate_words", "ctx": "Campaign site text written about him in the third person.", "title": "Joe Lewis for State Representative | PA House District 167", "url": "https://votejoelewis.com/", "stype": "Campaign site"}, {"candidate": "Kristine Howard", "issue": "Healthcare", "otherTopic": "", "quote": "Kristine is committed to working diligently and across party lines to negotiate with insurance lobbyists and big pharma to create affordable healthcare options and reduce the cost of prescription medication.", "type": "candidate_words", "ctx": "Campaign site text, apparently written for an earlier campaign (it refers to 2019 events) and not updated for 2026.", "title": "Our Priorities - Kristine Howard for State Representative", "url": "https://kristinehoward.com/our-priorities/", "stype": "Campaign site"}, {"candidate": "Kristine Howard", "issue": "Climate / Environmental Laws", "otherTopic": "", "quote": "In addition, she is committed to a green energy future that does not rely on carbon-based energy sources and the pipelines needed to transport oil and gas to distant market.", "type": "candidate_words", "ctx": "Campaign site text, apparently written for an earlier campaign (it refers to 2019 events) and not updated for 2026.", "title": "Our Priorities - Kristine Howard for State Representative", "url": "https://kristinehoward.com/our-priorities/", "stype": "Campaign site"}, {"candidate": "Kristine Howard", "issue": "Education", "otherTopic": "", "quote": "Kristine is committed to ensuring Chester County students are afforded every opportunity to receive the highest level of education possible and the state lives up to its constitutional duty to fully fund a public education system that works for everyone.", "type": "candidate_words", "ctx": "Campaign site text, apparently written for an earlier campaign (it refers to 2019 events) and not updated for 2026.", "title": "Our Priorities - Kristine Howard for State Representative", "url": "https://kristinehoward.com/our-priorities/", "stype": "Campaign site"}, {"candidate": "Kristine Howard", "issue": "Gun Laws", "otherTopic": "", "quote": "Kristine is actively working to bring red flag law legislation to a vote.", "type": "candidate_words", "ctx": "Campaign site text, apparently written for an earlier campaign (it refers to 2019 events) and not updated for 2026.", "title": "Our Priorities - Kristine Howard for State Representative", "url": "https://kristinehoward.com/our-priorities/", "stype": "Campaign site"}, {"candidate": "Kristine Howard", "issue": "Abortion / Reproductive Rights", "otherTopic": "", "quote": "My legislation, the Reproductive Freedom Act, would eliminate this law and replace it with a much more perfect statutory scheme, a more rational and compassionate model positioning Pennsylvania as a leader in reproductive rights.", "type": "candidate_words", "ctx": "From an April 2025 House Democratic Caucus news release.", "title": "Powell, Howard, Daley & Shusterman advocate for reproductive rights in Harrisburg", "url": "https://www.pahouse.com/Howard/InTheNews/NewsRelease/?id=138023", "stype": "Official record"}, {"candidate": "Kristine Howard", "issue": "Taxes", "otherTopic": "", "quote": "In any event, whether Restore PA ever becomes law or not, I believe it is imperative to enact a shale gas extraction tax.", "type": "candidate_words", "ctx": "Her own post, dated Oct 10, 2019.", "title": "Frackers Must Be Taxed - Kristine Howard for State Representative", "url": "https://kristinehoward.com/frackers-must-be-taxed/", "stype": "Candidate's own words in an op-ed or survey"}, {"candidate": "Kristine Howard", "issue": "AI / Technology", "otherTopic": "", "quote": "The resolution, sponsored by state Rep. Kristine Howard, D-Chester, would urge the U.S. Congress to provide protections for workers in the creative sector against displacement by artificial intelligence, or AI, technology.", "type": "reporter_description", "ctx": "From an April 2025 House news release.", "title": "PA House Communications & Technology Committee unanimously approves measure calling on Congress to protect creative sector workers against displacement by AI", "url": "https://www.pahouse.com/Howard/InTheNews/NewsRelease/?id=138304", "stype": "Official record"}, {"candidate": "Josh Shapiro", "issue": "Healthcare", "otherTopic": "", "quote": "I believe that every Pennsylvanian deserves access to affordable, high-quality healthcare no matter their zip code.", "type": "candidate_words", "ctx": "", "title": "Governor | Voter Guide: 2026 Pennsylvania General Election (Pennsylvania Capital-Star)", "url": "https://penncapital-star.com/voter-guides/contests/2026-general-governor/", "stype": "Candidate's own words in an op-ed or survey"}, {"candidate": "Josh Shapiro", "issue": "Housing", "otherTopic": "", "quote": "This plan meets Pennsylvania’s housing needs head-on — building more homes, cutting red tape, protecting renters and homeowners, and ensuring our Commonwealth remains the place for people to put down roots, live with the dignity they deserve, and build a future of real opportunity.", "type": "candidate_words", "ctx": "From a governor.pa.gov press release.", "title": "Governor Shapiro Unveils Pennsylvania’s First-Ever Housing Action Plan (governor.pa.gov press release)", "url": "https://www.pa.gov/governor/newsroom/2026-press-releases/governor-shapiro-unveils-pennsylvania-s-first-ever-housing-actio", "stype": "Official record"}, {"candidate": "Josh Shapiro", "issue": "Election Laws / Voting Rights", "otherTopic": "", "quote": "As long as I’m Governor, we will continue to have free, fair, safe, and secure elections in the Commonwealth and my Administration will continue to protect our elections in the face of threats from Donald Trump and his allies.", "type": "candidate_words", "ctx": "", "title": "Governor | Voter Guide: 2026 Pennsylvania General Election (Pennsylvania Capital-Star)", "url": "https://penncapital-star.com/voter-guides/contests/2026-general-governor/", "stype": "Candidate's own words in an op-ed or survey"}, {"candidate": "Josh Shapiro", "issue": "Education", "otherTopic": "", "quote": "Now, when children in Pennsylvania go to school, they can get free breakfast and there are more mental health counselors and resources available when they need them.", "type": "candidate_words", "ctx": "From his campaign site, about his record.", "title": "Meet Josh - Shapiro For Governor", "url": "https://joshshapiro.org/meet-josh/", "stype": "Campaign site"}, {"candidate": "Josh Shapiro", "issue": "Jobs / Labor", "otherTopic": "", "quote": "I am proud of the work we’ve done to deliver for the people of Pennsylvania, but there is a lot more work to do – from lowering utility costs and building more housing, to cutting more red tape, creating more jobs, and raising the minimum wage so more Pennsylvanians can get ahead.", "type": "candidate_words", "ctx": "", "title": "Governor | Voter Guide: 2026 Pennsylvania General Election (Pennsylvania Capital-Star)", "url": "https://penncapital-star.com/voter-guides/contests/2026-general-governor/", "stype": "Candidate's own words in an op-ed or survey"}, {"candidate": "Josh Shapiro", "issue": "Crime / Public Safety", "otherTopic": "", "quote": "Over the last three years, we’ve funded nearly 2,000 more cops on the beat and expanded afterschool programs and violence intervention initiatives centered in our communities.", "type": "candidate_words", "ctx": "From his 2026-27 budget address, about his record.", "title": "Governor Shapiro’s 2026-27 Budget Address as Prepared for Delivery (governor.pa.gov)", "url": "https://www.pa.gov/governor/newsroom/2026-press-releases/governor-shapiro-s-2026-27-budget-address-as-prepared-for-delive", "stype": "Official record"}, {"candidate": "Josh Shapiro", "issue": "Abortion / Reproductive Rights", "otherTopic": "", "quote": "As long as I’m your Governor, abortion will remain safe and legal here in Pennsylvania", "type": "candidate_words", "ctx": "His post on X, as quoted by Spotlight PA.", "title": "How Garrity and Shapiro differ on abortion access in PA (Spotlight PA)", "url": "https://www.spotlightpa.org/news/2026/06/josh-shapiro-stacy-garrity-abortion-access-medicaid-guide-governor-race-elections/", "stype": "News report"}, {"candidate": "Josh Shapiro", "issue": "Infrastructure / Transportation", "otherTopic": "", "quote": "This budget calls for sustainable, recurring funding for mass transit to begin in 2027.", "type": "candidate_words", "ctx": "A proposal in his 2026-27 budget address, not enacted policy.", "title": "Governor Shapiro’s 2026-27 Budget Address as Prepared for Delivery (governor.pa.gov)", "url": "https://www.pa.gov/governor/newsroom/2026-press-releases/governor-shapiro-s-2026-27-budget-address-as-prepared-for-delive", "stype": "Official record"}, {"candidate": "Josh Shapiro", "issue": "Cost of Living / Economy", "otherTopic": "", "quote": "My Administration is standing up to Donald Trump and his enablers’ chaos, cruelty, and corruption and fighting to put money back in Pennsylvanians’ pockets, lower costs, and create good-paying jobs for working families.", "type": "candidate_words", "ctx": "", "title": "Governor | Voter Guide: 2026 Pennsylvania General Election (Pennsylvania Capital-Star)", "url": "https://penncapital-star.com/voter-guides/contests/2026-general-governor/", "stype": "Candidate's own words in an op-ed or survey"}, {"candidate": "Josh Shapiro", "issue": "Taxes", "otherTopic": "", "quote": "Since taking office, we’ve delivered ten tax cuts, including creating the Working Pennsylvanians Tax Credit, which has provided tax relief to more than 876,000 Pennsylvanians, as well as expanding the Property Tax/Rent Rebate (PTRR) Program to help more than 513,000 seniors and people with disabilities struggling with rising costs receive over $315 million last year.", "type": "candidate_words", "ctx": "Describes his record as governor.", "title": "Governor | Voter Guide: 2026 Pennsylvania General Election (Pennsylvania Capital-Star)", "url": "https://penncapital-star.com/voter-guides/contests/2026-general-governor/", "stype": "Candidate's own words in an op-ed or survey"}, {"candidate": "Josh Shapiro", "issue": "AI / Technology", "otherTopic": "", "quote": "Let’s require age verification and parental consent, because some kids are just too young to understand the difference between AI and a real person.", "type": "candidate_words", "ctx": "About AI companion chatbots for children, from his budget address.", "title": "Governor Shapiro’s 2026-27 Budget Address as Prepared for Delivery (governor.pa.gov)", "url": "https://www.pa.gov/governor/newsroom/2026-press-releases/governor-shapiro-s-2026-27-budget-address-as-prepared-for-delive", "stype": "Official record"}, {"candidate": "Josh Shapiro", "issue": "LGBTQ+ Rights", "otherTopic": "", "quote": "Shapiro often posts on social media saying Pennsylvanians should be allowed to marry who they want, and that he would defend that right if it were threatened.", "type": "reporter_description", "ctx": "", "title": "PA election: Where Garrity, Shapiro stand on LGBTQ rights (Spotlight PA)", "url": "https://www.spotlightpa.org/news/2026/09/pennsylvania-governor-race-elections-lgbtq-transgender-fairness-marriage-shapiro-garrity/", "stype": "News report"}, {"candidate": "Josh Shapiro", "issue": "Data Centers", "otherTopic": "", "quote": "We have a responsibility to protect local communities from unwelcome projects and ensure data center development does not come at a cost to Pennsylvanians or threaten the land and resources Pennsylvania families depend on.", "type": "candidate_words", "ctx": "", "title": "Governor | Voter Guide: 2026 Pennsylvania General Election (Pennsylvania Capital-Star)", "url": "https://penncapital-star.com/voter-guides/contests/2026-general-governor/", "stype": "Candidate's own words in an op-ed or survey"}, {"candidate": "Josh Shapiro", "issue": "", "otherTopic": "Recreational marijuana legalization", "quote": "It’s time for Pennsylvania to catch up with nearly all of our neighbors and legalize recreational marijuana to move our Commonwealth forward and bring in critical revenues for our schools, law enforcement, and more.", "type": "candidate_words", "ctx": "", "title": "Governor | Voter Guide: 2026 Pennsylvania General Election (Pennsylvania Capital-Star)", "url": "https://penncapital-star.com/voter-guides/contests/2026-general-governor/", "stype": "Candidate's own words in an op-ed or survey"}, {"candidate": "Stacy Garrity", "issue": "Healthcare", "otherTopic": "", "quote": "A Garrity Richey Administration will work to lower insurance premiums by implementing five common sense reforms to reduce the government mandates, legal costs, and bureaucracy that makes insurance more expensive - not by imposing government price controls.", "type": "candidate_words", "ctx": "", "title": "Governor | Voter Guide: 2026 Pennsylvania General Election", "url": "https://penncapital-star.com/voter-guides/contests/2026-general-governor/", "stype": "Candidate's own words in an op-ed or survey"}, {"candidate": "Stacy Garrity", "issue": "Housing", "otherTopic": "", "quote": "The plan also supports first-time homebuyers through a new program in which the Commonwealth covers up to 3% of mortgage interest rates.", "type": "candidate_words", "ctx": "", "title": "Issues - Stacy Garrity for Governor", "url": "https://garrityforpa.com/turnaroundpa/", "stype": "Campaign site"}, {"candidate": "Stacy Garrity", "issue": "Election Laws / Voting Rights", "otherTopic": "", "quote": "I believe it should be easy to vote, but hard to cheat. To help restore confidence in our elections, I will sign commonsense legislation to require Voter ID.", "type": "candidate_words", "ctx": "", "title": "Governor | Voter Guide: 2026 Pennsylvania General Election", "url": "https://penncapital-star.com/voter-guides/contests/2026-general-governor/", "stype": "Candidate's own words in an op-ed or survey"}, {"candidate": "Stacy Garrity", "issue": "Climate / Environmental Laws", "otherTopic": "", "quote": "On day one, Stacy Garrity will lift the ban on new drilling sites that is holding Pennsylvania back and call a Special Session on Energy to fast-track permits for natural gas production, pipelines, and power plants; eliminate duplicative and outdated regulations; set firm timelines for approvals; roll back costly mandates; and reform or pause renewable energy and efficiency mandates.", "type": "candidate_words", "ctx": "", "title": "Issues - Stacy Garrity for Governor", "url": "https://garrityforpa.com/turnaroundpa/", "stype": "Campaign site"}, {"candidate": "Stacy Garrity", "issue": "Education", "otherTopic": "", "quote": "Students need opportunity, and parents need to be in control of their children’s education by passing Lifeline Scholarships, investing in and expanding the state’s existing scholarship programs (Education Improvement Tax Credit and Opportunity Scholarship Tax Credit), and opting in to the Federal Education Tax Credit scholarship program.", "type": "candidate_words", "ctx": "", "title": "Issues - Stacy Garrity for Governor", "url": "https://garrityforpa.com/turnaroundpa/", "stype": "Campaign site"}, {"candidate": "Stacy Garrity", "issue": "Abortion / Reproductive Rights", "otherTopic": "", "quote": "In a statement to Spotlight PA, Garrity said she is “pro-life, with exceptions for rape, incest, and life of the mother.”", "type": "reporter_description", "ctx": "", "title": "How Garrity and Shapiro differ on abortion access in PA", "url": "https://www.spotlightpa.org/news/2026/06/josh-shapiro-stacy-garrity-abortion-access-medicaid-guide-governor-race-elections/", "stype": "News report"}, {"candidate": "Stacy Garrity", "issue": "Veterans", "otherTopic": "", "quote": "Among the policies that Garrity spoke about while at the event was the plan for a $3,000 annual tax credit for businesses that hire veterans on a full-time basis. There would also be a credit for part-time hires that would also renew each year.", "type": "reporter_description", "ctx": "", "title": "Stacy Garrity Pitches Veteran Plan During Local Campaign Stop", "url": "https://newtownpanow.com/2026/07/28/stacy-garrity-pitches-veteran-plan-during-local-campaign-stop/", "stype": "News report"}, {"candidate": "Stacy Garrity", "issue": "Cost of Living / Economy", "otherTopic": "", "quote": "We have an affordability crisis because of Josh Shapiro’s failures. It’s not just the taxes, it’s the spending, it’s the over regulation, and it’s hurting Pennsylvania families and businesses.", "type": "candidate_words", "ctx": "", "title": "Governor | Voter Guide: 2026 Pennsylvania General Election", "url": "https://penncapital-star.com/voter-guides/contests/2026-general-governor/", "stype": "Candidate's own words in an op-ed or survey"}, {"candidate": "Stacy Garrity", "issue": "Government Spending", "otherTopic": "", "quote": "The Garrity–Richey Administration will require reform plans before funding is approved; audit state agencies from top to bottom; identify and eliminate waste and fraud; hold bad actors accountable; and use savings to reduce the deficit and lower the burden on taxpayers.", "type": "candidate_words", "ctx": "", "title": "Issues - Stacy Garrity for Governor", "url": "https://garrityforpa.com/turnaroundpa/", "stype": "Campaign site"}, {"candidate": "Stacy Garrity", "issue": "Taxes", "otherTopic": "", "quote": "HOPE for PA will reduce the property tax burden by one-third within the first two years and rein in the growth of government that drives up local property taxes.", "type": "candidate_words", "ctx": "", "title": "Issues - Stacy Garrity for Governor", "url": "https://garrityforpa.com/turnaroundpa/", "stype": "Campaign site"}, {"candidate": "Stacy Garrity", "issue": "Data Centers", "otherTopic": "", "quote": "In a Garrity Richey Administration, data center development will be restricted to brownfields and old industrial sides, not on our precious farmland. Data centers must bring their own water and bring their own energy so ratepayers are not on the hook.", "type": "candidate_words", "ctx": "", "title": "Governor | Voter Guide: 2026 Pennsylvania General Election", "url": "https://penncapital-star.com/voter-guides/contests/2026-general-governor/", "stype": "Candidate's own words in an op-ed or survey"}, {"candidate": "Stacy Garrity", "issue": "", "otherTopic": "Girls' sports", "quote": "Allowing biological males to compete in girls’ sports is unfair and unsafe. We will end it.", "type": "candidate_words", "ctx": "", "title": "Issues - Stacy Garrity for Governor", "url": "https://garrityforpa.com/turnaroundpa/", "stype": "Campaign site"}];

function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
function ext(t, u, cls) { return '<a' + (cls ? ' class="' + cls + '"' : "") + ' href="' + u + '" target="_blank" rel="noopener">' + t + "</a>"; }

var RETRIEVED = "Nov 3, 2026";
var REPORT_URL = "https://hushpolitics.com/contact?topic=feedback";
var MAXPICK = 10;
var ISSUES = ["Healthcare", "Housing", "Election Laws / Voting Rights", "Climate / Environmental Laws", "Education", "Jobs / Labor", "Immigration", "Crime / Public Safety", "Gun Laws", "Abortion / Reproductive Rights", "Infrastructure / Transportation", "Veterans", "Cost of Living / Economy", "Government Spending", "Taxes", "AI / Technology", "Medicare / Social Security", "LGBTQ+ Rights", "Data Centers", "Foreign Policy"];
var STATE_OFFICE = ISSUES.filter(function (i) { return i !== "Foreign Policy" && i !== "Medicare / Social Security"; });
var SCOPE = {
  "Governor and Lieutenant Governor": STATE_OFFICE,
  "U.S. House, District 6": ISSUES,
  "Pennsylvania Senate, District 44": STATE_OFFICE,
  "Pennsylvania House, District 167": STATE_OFFICE
};
var RACE_META = {
  "Governor and Lieutenant Governor": { slug: "governor", label: "Pennsylvania \u00b7 Governor", level: "Statewide", names: ["Josh Shapiro", "Stacy Garrity", "Ken Krawchuk", "Tony Dastra"] },
  "U.S. House, District 6": { slug: "us-house-6", label: "Pennsylvania \u00b7 U.S. House, District 6", level: "Federal", names: ["Chrissy Houlahan", "Marty Young"] },
  "Pennsylvania Senate, District 44": { slug: "senate-44", label: "Pennsylvania Senate, District 44", level: "State legislature", names: ["Katie Muth", "Melissa Dicranian"] },
  "Pennsylvania House, District 167": { slug: "house-167", label: "Pennsylvania House, District 167", level: "State legislature", names: ["Kristine Howard", "Joe Lewis"] }
};
var TOPIC = {};
var MEASURE_ISSUES = {};
var MORE = [];


(function () {
  var byName = {};
  races.forEach(function (r) { r.cands.forEach(function (c) { byName[c.name] = { c: c, r: r }; }); });
  QROWS.forEach(function (q) {
    var hit = byName[q.candidate]; if (!hit) return;
    var label = ISSUES.indexOf(q.issue) >= 0 ? q.issue : (q.otherTopic || q.issue);
    if (!label) return;
    var tags = ISSUES.indexOf(label) >= 0 ? [label] : [];
    var it = [label, "", q.title, q.url, tags];
    it.q = { quote: q.quote, type: q.type, title: q.title, url: q.url, stype: q.stype, ctx: q.ctx };
    hit.c.items.push(it);
  });
  races.forEach(function (r) {
    var sc = SCOPE[r.title] || ISSUES;
    r.cands.forEach(function (c) {
      var have = {}; c.items.forEach(function (i) { (i[4] || []).forEach(function (x) { have[x] = 1; }); });
      c.none = sc.filter(function (x) { return !have[x]; }).join(", ");
    });
  });
})();

races.forEach(function (r) { var m = RACE_META[r.title]; r.slug = m.slug; r.label = m.label; r.level = m.level; r.names = m.names; });
measures.forEach(function (m) { m.slug = m.id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); });

var sel = [];
try { var saved = JSON.parse(localStorage.getItem("chesterPaBallotIssues") || "[]"); if (Array.isArray(saved)) sel = saved.filter(function (x) { return ISSUES.indexOf(x) >= 0; }).slice(0, MAXPICK); } catch (e) {}
function persist() { try { localStorage.setItem("chesterPaBallotIssues", JSON.stringify(sel)); } catch (e) {} }

function issuesOf(item) { return item[4] || TOPIC[item[0]] || []; }
function rankOf(list) { var best = -1; list.forEach(function (i) { var k = sel.indexOf(i); if (k >= 0 && (best < 0 || k < best)) best = k; }); return best; }
function srcType(label) { return /^Campaign site|op-ed|survey/i.test(label) ? "Candidate's own words" : "News report"; }
function scopeOf(r) { return SCOPE[r.title] || ISSUES; }
function selInScope(r) { var sc = scopeOf(r); return sel.filter(function (x) { return sc.indexOf(x) >= 0; }); }
function hasItem(r, issue) { return r.cands.some(function (c) { return c.items.some(function (i) { return issuesOf(i).indexOf(issue) >= 0; }); }); }

/* ---------- pick view ---------- */
function pickView() {
  var h = '<div class="pick"><p class="kick">HUSH. Ballot Guide · Chester County, Pennsylvania</p><h1 class="h1">What matters most to you?</h1>' +
    '<p class="sub">Pick up to ten issues, in the order you care about them. Then we\'ll show you the races on your ballot and where each candidate stands on those issues,.</p>' +
    '<div class="tiles" id="tiles" role="group" aria-label="Issues">' + tilesHtml() + "</div>" +
    '<div class="pickbar"><button type="button" class="btn" id="go" ' + (sel.length ? "" : "disabled") + '>Show my ballot</button><span class="count" id="count" aria-live="polite">' + countText() + '</span><button type="button" class="linkbtn" id="clear" ' + (sel.length ? "" : "hidden") + ">Clear my picks</button></div></div>";
  return h;
}
function countText() { return sel.length + " of " + MAXPICK + " picked" + (sel.length ? "" : ". Pick at least one."); }
function tilesHtml() {
  return ISSUES.map(function (x) {
    var k = sel.indexOf(x), full = sel.length >= MAXPICK && k < 0;
    return '<button type="button" class="tile" data-issue="' + esc(x) + '" aria-pressed="' + (k >= 0) + '"' + (full ? ' aria-disabled="true"' : "") + ">" + (k >= 0 ? '<span class="n">' + (k + 1) + "</span>" : "") + "<span>" + esc(x) + "</span></button>";
  }).join("");
}

/* ---------- ballot view ---------- */
function raceStats(r) {
  var s = selInScope(r), got = s.filter(function (x) { return hasItem(r, x); });
  return { n: s.length, x: got.length, best: s.length ? sel.indexOf(s[0]) : -1 };
}
function ballotView() {
  var ordered = races.slice().sort(function (a, b) {
    var sa = raceStats(a), sb = raceStats(b);
    if ((sa.n > 0) !== (sb.n > 0)) return sa.n > 0 ? -1 : 1;
    return sa.best - sb.best;
  });
  var h = '<p class="kick">Your races</p><h1 class="h1">See where candidates stand on your issues</h1>' +
    '<div class="showing"><span>Showing the ballot for <b>Charlestown Township, Chester County · PA House 167, PA Senate 44, U.S. House 6</b></span><button type="button" class="linkbtn" data-go="pick">Change your issues →</button></div>';
  h += '<div class="check"><h3>Check first</h3><ul>' +
    "<li><b>Confirmed for your address:</b> Charlestown Township, Chester County. The state legislature's lookup puts you in Pennsylvania House District 167, Pennsylvania Senate District 44 and U.S. House District 6, plus the governor's race. Those are the four races below.</li>" +
    "<li><b>Not on your ballot:</b> there is no U.S. Senate race in Pennsylvania this year and no statewide ballot questions. We found no local question for Charlestown Township on the county's unofficial candidate list. If your ballot shows anything else, use what is on your ballot.</li>" +
    "<li><b>Voting Tuesday:</b> polls are open 7 am to 8 pm. First-time voters at a polling place need ID. A mail ballot has to reach the county election office by 8 pm, so if you still have one, hand-deliver it instead of mailing it.</li>" +
    '<li><b>Your own ballot:</b> ' + ext("Find your polling place", "https://www.pa.gov/services/vote/find-your-local-polling-place") + " or " + ext("see where to return a mail ballot", "https://www.pa.gov/agencies/vote/voter-support/mail-in-and-absentee-ballot/return-ballot") + ".</li></ul></div>";
  h += '<div class="rgrid">' + ordered.map(function (r) {
    var s = raceStats(r);
    var info = s.n ? "Source found for " + s.x + " of " + s.n + " of your issues" : "None of your issues come under this office";
    return '<article class="rcard"><div class="rhead">' + esc(r.label) + '</div><div class="rbody"><p class="kick" style="margin:0">On the ballot</p><ul class="names">' +
      r.names.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + '</ul><p class="info">' + info + '</p><a class="btn block" href="#race-' + r.slug + '">View comparison</a></div></article>';
  }).join("") + "</div>";

  if (measures.length) {
  var ml = orderedMeasures();
  h += '<p class="kick gap" id="measures">Your ballot measures</p><h1 class="h1">Amendments and propositions</h1>' +
    '<p class="sub">Amendments change the state constitution and need 55 percent to pass. Propositions and local issues need a simple majority. Swipe or use the arrows, then open any card.</p>';
  if (ml.hit.length) h += rail("Touch your issues (" + ml.hit.length + ")", ml.hit, "r1");
  h += rail(ml.hit.length ? "Everything else on your ballot (" + ml.rest.length + ")" : "On your ballot (" + ml.rest.length + ")", ml.rest, "r2");

  h += '<p class="kick gap">Also on your ballot</p><h1 class="h1">Not researched here</h1><p class="sub">These are on the county sample ballot. Names only, so you know what to expect.</p><div class="lists">' +
    MORE.map(function (b) { return '<div class="box"><span class="lab">' + esc(b.h) + "</span><ul>" + b.l.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>"; }).join("") + "</div>";

  }
  h += '<div class="foot"><p><b>How this was made.</b> Researched ' + RETRIEVED + ". Every position links to the page it came from, shows whether it is the candidate's own words or a news report, and shows the date we pulled it. We do not summarize or paraphrase what candidates say. Each position is an excerpt copied word for word from the page it links to. Where the page only describes what a candidate said, it is labeled as a reporter's description. Nothing comes from an opponent's materials. Where a candidate has said nothing we could find, we say so.</p>" +
    "<p>Official sources: " + ext("Pennsylvania General Assembly, Find My Legislator", "https://www.palegis.us/find-my-legislator") + ", " + ext("Pennsylvania Department of State", "https://www.pa.gov/agencies/vote/elections/upcoming-elections") + " and " + ext("Chester County election candidate list (unofficial)", "https://www.chesco.org/DocumentCenter/View/85425") + ".</p><p>This guide does not tell you how to vote.</p></div>";
  return h;
}
function orderedMeasures() {
  var rows = measures.map(function (m) { return { m: m, k: rankOf(MEASURE_ISSUES[m.id] || []) }; });
  return {
    hit: rows.filter(function (x) { return x.k >= 0; }).sort(function (a, b) { return a.k - b.k; }).map(function (x) { return x.m; }),
    rest: rows.filter(function (x) { return x.k < 0; }).map(function (x) { return x.m; })
  };
}
function tagChips(m) {
  return (MEASURE_ISSUES[m.id] || []).map(function (x) {
    var k = sel.indexOf(x);
    return '<span class="chip' + (k >= 0 ? " hit" : "") + '">' + (k >= 0 ? "Your #" + (k + 1) + " " : "") + esc(x) + "</span>";
  }).join("");
}
function rail(title, list, id) {
  if (!list.length) return "";
  return '<div class="railtitle"><h3>' + esc(title) + '</h3><div class="arrows"><button type="button" class="arrow" data-rail="' + id + '" data-dir="-1" aria-label="Scroll back">←</button><button type="button" class="arrow" data-rail="' + id + '" data-dir="1" aria-label="Scroll forward">→</button></div></div>' +
    '<div class="rail" id="' + id + '" tabindex="0" aria-label="' + esc(title) + '">' + list.map(function (m) {
      return '<a class="mcard" href="#measure-' + m.slug + '"><div class="mhead">' + esc(m.id) + '</div><div class="mbody"><span class="mtitle">' + esc(m.title) + '</span><div class="chips"><span class="chip thr">' + esc(m.thr) + "</span>" + tagChips(m) + '</div><p class="snip">' + esc(m.yes) + '</p><span class="more-link">Read the details →</span></div></a>';
    }).join("") + "</div>";
}

/* ---------- race view ---------- */
function trimQ(t) { return t.replace(/^[\u201c"]\s*/, "").replace(/\s*[\u201d"]$/, ""); }
function posHtml(i, showTopic) {
  var q = i.q, text = trimQ(q.quote), words = text.split(/\s+/), long = words.length > 45;
  var shown = long ? words.slice(0, 40).join(" ") + "\u2026" : text;
  var h = '<div class="pos">' + (showTopic ? '<p class="tp">' + esc(i[0]) + "</p>" : "");
  h += '<p class="quote" data-full="' + esc(text) + '" data-short="' + esc(shown) + '">\u201c' + esc(shown) + "\u201d</p>";
  if (long) h += '<button type="button" class="qmore" data-qmore="1">Show more</button>';
  var official = /official/i.test(q.stype), camp = /^campaign/i.test(q.stype);
  var note = q.type === "reporter_description" ? "A reporter's description of what they said, not the candidate's own words." : (camp || /op-ed|survey/i.test(q.stype) ? "" : (official ? "From an official government record." : "Not taken from this candidate's own campaign website."));
  if (note) h += '<p class="qnote">' + note + "</p>";
  if (q.ctx) h += '<p class="qnote">' + esc(q.ctx) + "</p>";
  h += '<p class="psrc"><span class="stype">' + esc(camp ? "Campaign site" : (official ? "Official record" : (q.type === "reporter_description" ? "News report" : "Candidate's own words"))) + "</span>" + esc(q.title) + "</p>" +
    ext("View original source \u2192", q.url, "orig") + '<p class="fine">Retrieved ' + RETRIEVED + " \u00b7 " + ext("Report a problem", REPORT_URL) + "</p></div>";
  return h;
}
function issueBlock(r, issue) {
  var k = sel.indexOf(issue);
  var h = '<section class="iss"><div class="iss-h"><span class="iss-k">Issue</span><h2>' + esc(issue) + '</h2><span class="yr">Your #' + (k + 1) + '</span><span class="rule"></span></div><div class="ccards">';
  r.cands.forEach(function (c) {
    var items = c.items.filter(function (i) { return issuesOf(i).indexOf(issue) >= 0; });
    h += '<div class="ccard"><h3>' + esc(c.name) + "</h3>" + (items.length ? items.map(function (i) { return posHtml(i, false); }).join("") : '<p class="nopos">No position found</p>') + "</div>";
  });
  return h + "</div></section>";
}
function raceView(r) {
  var scope = scopeOf(r), mine = sel.filter(function (x) { return scope.indexOf(x) >= 0; }), outside = sel.filter(function (x) { return scope.indexOf(x) < 0; });
  var h = '<a class="back" href="#ballot">← Back to your ballot</a><p class="kick" style="margin:0 0 6px">' + esc(r.label) + '</p><h1 class="h1">' + esc(r.title) + '</h1>' +
    '<p class="meta">' + esc(r.level) + " · Pennsylvania · " + r.names.length + " candidates</p>" +
    '<p class="kick gap" style="margin-bottom:0">Candidates researched</p><div class="pills">' + r.cands.map(function (c) { return '<span class="pill">' + esc(c.name) + " (" + esc(c.party.split(",")[0]) + ")</span>"; }).join("") +
    (r.names.length > r.cands.length ? '<span class="meta" style="margin:0">+ ' + (r.names.length - r.cands.length) + " other candidate" + (r.names.length - r.cands.length === 1 ? "" : "s") + " on the ballot ↓</span>" : "") + "</div>";
  if (r.sub) h += '<p class="note">' + esc(r.sub) + "</p>";
  r.cands.forEach(function (c) { if (c.note) h += '<p class="note"><b>' + esc(c.name) + ":</b> " + esc(c.note) + "</p>"; });
  mine.forEach(function (x) { h += issueBlock(r, x); });
  var stance = r.cands.filter(function (c) { return c.items.some(function (i) { return i[0] === "Ballot measures"; }); });
  if (stance.length) {
    h += '<section class="iss"><div class="iss-h"><span class="iss-k">Also</span><h2>Positions on the measures</h2><span class="rule"></span></div><div class="ccards">' +
      r.cands.map(function (c) {
        var it = c.items.filter(function (i) { return i[0] === "Ballot measures"; });
        return '<div class="ccard"><h3>' + esc(c.name) + "</h3>" + (it.length ? it.map(function (i) { return posHtml(i, false); }).join("") : '<p class="nopos">No position found</p>') + "</div>";
      }).join("") + "</div></section>";
  }
  if (!mine.length) h += '<p class="out">None of your selected issues come under this office. Everything we found is under "More from these candidates" below.</p>';
  else if (outside.length) h += '<p class="out">Not part of this office\'s job: ' + outside.map(esc).join(", ") + ".</p>";
  var rest = r.cands.map(function (c) {
    return { c: c, items: c.items.filter(function (i) { return i[0] !== "Ballot measures" && !issuesOf(i).some(function (x) { return mine.indexOf(x) >= 0; }); }) };
  }).filter(function (x) { return x.items.length || x.c.none; });
  if (rest.length) {
    h += '<details class="more"' + (mine.length ? "" : " open") + "><summary>More from these candidates</summary><div class=\"ccards\">" + rest.map(function (x) {
      return '<div class="ccard"><h3>' + esc(x.c.name) + "</h3>" + x.items.map(function (i) { return posHtml(i, true); }).join("") +
        (x.c.none ? '<p class="nopos" style="margin-top:12px">No position found: ' + esc(x.c.none) + "</p>" : "") + "</div>";
    }).join("") + "</div></details>";
  }
  if (r.names.length > r.cands.length) {
    var rs = r.cands.map(function (c) { return c.name; });
    h += '<p class="out">Also on the ballot, not researched: ' + r.names.filter(function (n) { return rs.indexOf(n) < 0; }).map(esc).join(", ") + ".</p>";
  }
  if (r.others) h += '<p class="out">' + esc(r.others) + "</p>";
  return h;
}

/* ---------- measure view ---------- */
function measureView(m) {
  var ml = orderedMeasures(), all = ml.hit.concat(ml.rest), idx = all.indexOf(m);
  var prev = all[idx - 1], next = all[idx + 1];
  var h = '<a class="back" href="#ballot">← Back to your ballot</a><p class="kick" style="margin:0 0 6px">Ballot measure</p><h1 class="h1">' + esc(m.id) + '</h1><p class="sub" style="font-size:18px;color:var(--ink)">' + esc(m.title) + "</p>" +
    '<div class="chips" style="margin-top:12px"><span class="chip thr">' + esc(m.thr) + "</span>" + tagChips(m) + "</div>";
  h += '<div class="yn"><div class="box"><span class="lab">A yes vote</span><p>' + esc(m.yes) + '</p></div><div class="box"><span class="lab">A no vote</span><p>' + esc(m.no) + "</p></div></div>";
  h += '<div class="stack">';
  if (m.note) h += '<div class="box"><span class="lab">Check</span><p>' + esc(m.note) + "</p></div>";
  h += '<div class="box"><span class="lab">The money</span><p>' + esc(m.fiscal) + "</p>";
  if (m.table) {
    h += '<div class="table-wrap" style="margin-top:12px"><table><tbody>';
    m.table.forEach(function (row, n) { var t = n === 0 ? "th" : "td"; h += "<tr><" + t + ">" + esc(row[0]) + "</" + t + "><" + t + ">" + esc(row[1]) + "</" + t + "></tr>"; });
    h += "</tbody></table></div>";
  }
  h += "</div>";
  h += '<div class="yn" style="margin:0"><div class="box"><span class="lab">Supporters say</span><p>' + esc(m.pro) + '</p></div><div class="box"><span class="lab">Opponents say</span><p>' + esc(m.con) + "</p></div></div>";
  h += '<div class="box"><span class="lab">Who is behind it</span><p>' + esc(m.who) + "</p></div>";
  h += '<div class="box"><span class="lab">Sources</span><p>' + ext(esc(m.src[0]), m.src[1]) + (m.src2 ? " · " + ext(esc(m.src2[0]), m.src2[1]) : "") + " · retrieved " + RETRIEVED + " · " + ext("Report a problem", REPORT_URL) + "</p></div></div>";
  h += '<div class="pager">' + (prev ? '<a class="btn" href="#measure-' + prev.slug + '">← ' + esc(prev.id) + "</a>" : "<span></span>") + (next ? '<a class="btn" href="#measure-' + next.slug + '">' + esc(next.id) + " →</a>" : "<span></span>") + "</div>";
  return h;
}

/* ---------- router ---------- */
var lastView = "";
function route() {
  var hash = (location.hash || "").replace("#", "");
  if (!sel.length) hash = "pick";
  else if (!hash) hash = "ballot";
  var view = hash, html;
  var r, m;
  if (hash === "pick") html = pickView();
  else if (hash.indexOf("race-") === 0 && (r = races.filter(function (x) { return "race-" + x.slug === hash; })[0])) html = raceView(r);
  else if (hash.indexOf("measure-") === 0 && (m = measures.filter(function (x) { return "measure-" + x.slug === hash; })[0])) html = measureView(m);
  else { hash = "ballot"; view = "ballot"; html = ballotView(); }
  app.innerHTML = html;
  document.querySelectorAll("[data-nav]").forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-nav") === (hash === "pick" ? "pick" : "ballot")); });
  if (view !== lastView) (scroller || window).scrollTo(0, 0);
  lastView = view;
}
window.addEventListener("hashchange", route);

var onClick = function (e) {
  var qm = e.target.closest("[data-qmore]");
  if (qm) { var qp = qm.previousElementSibling, open = qm.getAttribute("data-open") === "1"; qp.textContent = "\u201c" + (open ? qp.getAttribute("data-short") : qp.getAttribute("data-full")) + "\u201d"; qm.setAttribute("data-open", open ? "0" : "1"); qm.textContent = open ? "Show more" : "Show less"; return; }
  var t = e.target.closest("[data-issue]");
  if (t) {
    var x = t.getAttribute("data-issue"), k = sel.indexOf(x);
    if (k >= 0) sel.splice(k, 1); else if (sel.length < MAXPICK) sel.push(x); else return;
    persist();
    document.getElementById("tiles").innerHTML = tilesHtml();
    document.getElementById("count").textContent = countText();
    document.getElementById("go").disabled = !sel.length;
    document.getElementById("clear").hidden = !sel.length;
    return;
  }
  if (e.target.id === "go" && sel.length) { location.hash = "ballot"; if (location.hash === "#ballot") route(); return; }
  if (e.target.id === "clear") { sel = []; persist(); lastView = ""; route(); return; }
  var g = e.target.closest("[data-go]");
  if (g) { location.hash = g.getAttribute("data-go"); return; }
  var a = e.target.closest("[data-rail]");
  if (a) { var rl = document.getElementById(a.getAttribute("data-rail")); rl.scrollBy({ left: Number(a.getAttribute("data-dir")) * Math.max(280, rl.clientWidth * 0.8), behavior: "smooth" }); }
};

app.addEventListener("click", onClick);
route();

return function () { window.removeEventListener("hashchange", route); app.removeEventListener("click", onClick); };
}
