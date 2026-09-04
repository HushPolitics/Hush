/**
 * Seed data for the Hush prototype.
 *
 * This is the illustrative dataset that shipped with the design. It is the
 * fallback the app renders when Supabase is not configured, and it doubles as
 * the fixture set the ingestion pipeline is tested against. Nothing here is a
 * real trust score, promise record, or fact-check verdict.
 */
import type {
  Politician,
  FactCheck,
  Race,
  BallotItem,
  TrendingClaim,
  StanceCell,
  IssuePosition,
  StanceCheckPosition,
  Bill,
} from "./types";

export const IS_SEED_DATA = true;

export const POLITICIANS: Politician[] = [
  {
    "id": "marchetti",
    "name": "Rep. Delia Marchetti",
    "office": "U.S. Representative",
    "district": "TX-35",
    "level": "Federal",
    "party": "D",
    "since": 2018,
    "trust": 78,
    "kept": 31,
    "prog": 6,
    "broken": 5,
    "bio": "Former county hospital administrator, elected on a healthcare-access platform. Chairs the district's affordability working group and sits on two federal oversight committees.",
    "tags": [
      "Healthcare",
      "Housing",
      "Labor",
      "Voting rights",
      "Climate"
    ],
    "policies": [
      {
        "issue": "Healthcare",
        "stance": "Backs a public insurance option and caps on out-of-pocket prescription costs."
      },
      {
        "issue": "Housing",
        "stance": "Supports federal density incentives and a renter's tax credit."
      },
      {
        "issue": "Climate",
        "stance": "Voted for grid resilience; declined to back a fossil subsidy phase-out."
      },
      {
        "issue": "Labor",
        "stance": "Co-sponsored sectoral bargaining rules for service workers."
      },
      {
        "issue": "Voting rights",
        "stance": "Supports automatic registration and restoring pre-clearance review."
      }
    ],
    "promises": [
      {
        "id": "marchetti-open-two-county-clinics-in-underserved-zips-by-2",
        "text": "Open two county clinics in underserved ZIPs by 2025",
        "status": "Delivered",
        "progress": 100,
        "date": "Mar 2025",
        "sources": [
          "HHS",
          "Statesman"
        ]
      },
      {
        "id": "marchetti-cap-insulin-copays-for-state-plan-enrollees-at-3",
        "text": "Cap insulin copays for state plan enrollees at $35",
        "status": "Delivered",
        "progress": 100,
        "date": "Jul 2024",
        "sources": [
          "Bill 214",
          "KUT"
        ]
      },
      {
        "id": "marchetti-pass-the-renter-s-tax-credit-in-first-session",
        "text": "Pass the renter's tax credit in first session",
        "status": "No movement",
        "progress": 0,
        "date": "May 2024",
        "sources": [
          "Vote log",
          "Tribune"
        ]
      },
      {
        "id": "marchetti-fund-1-200-units-of-workforce-housing",
        "text": "Fund 1,200 units of workforce housing",
        "status": "In progress",
        "progress": 45,
        "date": "Ongoing",
        "sources": [
          "Budget",
          "City memo"
        ]
      },
      {
        "id": "marchetti-vote-against-fossil-subsidy-extensions",
        "text": "Vote against fossil subsidy extensions",
        "status": "No movement",
        "progress": 0,
        "date": "Feb 2024",
        "sources": [
          "Roll call",
          "AP"
        ]
      },
      {
        "id": "marchetti-hold-quarterly-town-halls-in-every-county",
        "text": "Hold quarterly town halls in every county",
        "status": "Delivered",
        "progress": 100,
        "date": "Q2 2026",
        "sources": [
          "Calendar",
          "Local news"
        ]
      },
      {
        "id": "marchetti-restore-pre-clearance-review-co-sponsorship",
        "text": "Restore pre-clearance review co-sponsorship",
        "status": "In progress",
        "progress": 58,
        "date": "Ongoing",
        "sources": [
          "HR 4",
          "Brennan"
        ]
      }
    ],
    "terms": [
      {
        "label": "School Board 2014–18",
        "score": 61
      },
      {
        "label": "State Rep 2018–22",
        "score": 74
      },
      {
        "label": "US Rep 2022–24",
        "score": 81
      },
      {
        "label": "US Rep 2024–",
        "score": 78
      }
    ],
    "timeline": [
      {
        "date": "Nov 2022",
        "label": "Promised at candidate forum in East Austin",
        "dot": "#151515"
      },
      {
        "date": "Apr 2023",
        "label": "Site funding secured in county budget",
        "dot": "#253746"
      },
      {
        "date": "Jan 2024",
        "label": "Groundbreaking delayed two quarters",
        "dot": "#B5A88A"
      },
      {
        "date": "Sep 2024",
        "label": "First clinic opens in 78721",
        "dot": "#253746"
      },
      {
        "date": "Mar 2025",
        "label": "Second clinic opens · promise marked delivered",
        "dot": "#253746"
      }
    ],
    "career": [
      {
        "year": "2014",
        "what": "Elected to school board, District 4",
        "detail": "Ran on facilities equity"
      },
      {
        "year": "2018",
        "what": "Elected state representative",
        "detail": "Authored rural clinic funding formula"
      },
      {
        "year": "2022",
        "what": "Elected to U.S. House, TX-35",
        "detail": "Oversight and Ways & Means"
      },
      {
        "year": "2026",
        "what": "Standing for re-election",
        "detail": "Campaign filed Feb 2026"
      }
    ]
  },
  {
    "id": "vance",
    "name": "Sen. Rosa Vance",
    "office": "State Senator",
    "district": "D-14",
    "level": "State",
    "party": "D",
    "since": 2015,
    "trust": 71,
    "kept": 24,
    "prog": 5,
    "broken": 7,
    "bio": "Third-term state senator, previously a labor attorney. Leads the chamber's coastal resilience caucus and sits on finance.",
    "tags": [
      "Climate",
      "Voting rights",
      "Education",
      "Labor"
    ],
    "policies": [
      {
        "issue": "Healthcare",
        "stance": "Led the state Medicaid expansion push through two sessions."
      },
      {
        "issue": "Housing",
        "stance": "Backs supply reform; has not supported tenant protections."
      },
      {
        "issue": "Climate",
        "stance": "Sponsored the coastal resilience fund and grid weatherization."
      },
      {
        "issue": "Labor",
        "stance": "Supports a wage floor but not sectoral bargaining."
      },
      {
        "issue": "Voting rights",
        "stance": "Voted no on every mail-ballot restriction this session."
      }
    ],
    "promises": [
      {
        "id": "vance-pass-the-coastal-resilience-fund",
        "text": "Pass the coastal resilience fund",
        "status": "Delivered",
        "progress": 100,
        "date": "Jun 2025",
        "sources": [
          "SB 71",
          "Tribune"
        ]
      },
      {
        "id": "vance-block-mail-ballot-restrictions",
        "text": "Block mail-ballot restrictions",
        "status": "Delivered",
        "progress": 100,
        "date": "Apr 2026",
        "sources": [
          "Roll call",
          "AP"
        ]
      },
      {
        "id": "vance-fully-fund-the-school-formula",
        "text": "Fully fund the school formula",
        "status": "In progress",
        "progress": 66,
        "date": "Ongoing",
        "sources": [
          "Budget",
          "TEA"
        ]
      },
      {
        "id": "vance-deliver-tenant-right-to-counsel",
        "text": "Deliver tenant right-to-counsel",
        "status": "No movement",
        "progress": 0,
        "date": "May 2025",
        "sources": [
          "Vote log",
          "KUT"
        ]
      },
      {
        "id": "vance-weatherize-the-grid-by-2026",
        "text": "Weatherize the grid by 2026",
        "status": "In progress",
        "progress": 71,
        "date": "Ongoing",
        "sources": [
          "PUC",
          "Statesman"
        ]
      }
    ],
    "terms": [
      {
        "label": "City Council 2011–15",
        "score": 58
      },
      {
        "label": "State Sen 2015–20",
        "score": 66
      },
      {
        "label": "State Sen 2020–",
        "score": 71
      }
    ],
    "timeline": [
      {
        "date": "Sep 2023",
        "label": "Pledged a coastal resilience fund",
        "dot": "#151515"
      },
      {
        "date": "Feb 2024",
        "label": "Bill filed, referred to finance",
        "dot": "#B5A88A"
      },
      {
        "date": "May 2024",
        "label": "Stalled in committee",
        "dot": "#9C3F32"
      },
      {
        "date": "Mar 2025",
        "label": "Refiled with bipartisan sponsors",
        "dot": "#B5A88A"
      },
      {
        "date": "Jun 2025",
        "label": "Signed into law · promise delivered",
        "dot": "#253746"
      }
    ],
    "career": [
      {
        "year": "2011",
        "what": "Elected to city council",
        "detail": "Chaired audit committee"
      },
      {
        "year": "2015",
        "what": "Elected state senator, D-14",
        "detail": "Finance and education"
      },
      {
        "year": "2020",
        "what": "Re-elected",
        "detail": "Founded resilience caucus"
      },
      {
        "year": "2026",
        "what": "Standing for re-election",
        "detail": "Uncontested primary"
      }
    ]
  },
  {
    "id": "pike",
    "name": "Sen. Carsten Prause",
    "office": "U.S. Senator",
    "district": "Texas",
    "level": "Federal",
    "party": "R",
    "since": 2013,
    "trust": 41,
    "kept": 17,
    "prog": 4,
    "broken": 21,
    "bio": "Two-term senator, former energy executive. Sits on appropriations and armed services.",
    "tags": [
      "Energy",
      "Border",
      "Taxes",
      "Deregulation"
    ],
    "policies": [
      {
        "issue": "Healthcare",
        "stance": "Voted against subsidy renewal three times."
      },
      {
        "issue": "Housing",
        "stance": "Opposes federal preemption of local zoning."
      },
      {
        "issue": "Climate",
        "stance": "Calls emissions targets unworkable; backs LNG expansion."
      },
      {
        "issue": "Labor",
        "stance": "No floor votes on labor bills since 2023."
      },
      {
        "issue": "Voting rights",
        "stance": "Backs stricter ID and roll-maintenance rules."
      }
    ],
    "promises": [
      {
        "id": "pike-cut-the-federal-deficit-within-one-term",
        "text": "Cut the federal deficit within one term",
        "status": "No movement",
        "progress": 0,
        "date": "Jan 2025",
        "sources": [
          "CBO",
          "AP"
        ]
      },
      {
        "id": "pike-deliver-the-water-infrastructure-package",
        "text": "Deliver the water infrastructure package",
        "status": "Delivered",
        "progress": 100,
        "date": "Aug 2024",
        "sources": [
          "S. 812",
          "Statesman"
        ]
      },
      {
        "id": "pike-hold-20-county-listening-sessions",
        "text": "Hold 20 county listening sessions",
        "status": "No movement",
        "progress": 0,
        "date": "Dec 2025",
        "sources": [
          "Calendar",
          "Tribune"
        ]
      },
      {
        "id": "pike-protect-the-wind-production-credit",
        "text": "Protect the wind production credit",
        "status": "No movement",
        "progress": 0,
        "date": "Jul 2025",
        "sources": [
          "Roll call",
          "Reuters"
        ]
      },
      {
        "id": "pike-expand-port-capacity-at-corpus",
        "text": "Expand port capacity at Corpus",
        "status": "In progress",
        "progress": 71,
        "date": "Ongoing",
        "sources": [
          "MARAD",
          "Caller"
        ]
      }
    ],
    "terms": [
      {
        "label": "State Sen 2005–13",
        "score": 55
      },
      {
        "label": "US Sen 2013–19",
        "score": 47
      },
      {
        "label": "US Sen 2019–",
        "score": 41
      }
    ],
    "timeline": [
      {
        "date": "Oct 2018",
        "label": "Promised deficit reduction within one term",
        "dot": "#151515"
      },
      {
        "date": "Mar 2021",
        "label": "Voted for two unfunded packages",
        "dot": "#9C3F32"
      },
      {
        "date": "Jun 2023",
        "label": "Deficit up 34% since pledge",
        "dot": "#9C3F32"
      },
      {
        "date": "Jan 2025",
        "label": "Promise marked no movement",
        "dot": "#9C3F32"
      },
      {
        "date": "Feb 2026",
        "label": "Restated pledge for next term",
        "dot": "#B5A88A"
      }
    ],
    "career": [
      {
        "year": "1998",
        "what": "Energy executive, Permian division",
        "detail": "—"
      },
      {
        "year": "2005",
        "what": "Elected state senator",
        "detail": "Natural resources chair"
      },
      {
        "year": "2013",
        "what": "Elected U.S. senator",
        "detail": "Appropriations"
      },
      {
        "year": "2026",
        "what": "Not on this year's ballot",
        "detail": "Term ends 2028"
      }
    ]
  },
  {
    "id": "ainsley",
    "name": "Mayor Marcus Ainsley",
    "office": "Mayor of Austin",
    "district": "Citywide",
    "level": "Local",
    "party": "I",
    "since": 2021,
    "trust": 66,
    "kept": 19,
    "prog": 8,
    "broken": 6,
    "bio": "Independent mayor, former transit authority director. Ran on delivery over ideology.",
    "tags": [
      "Transit",
      "Housing",
      "Public safety"
    ],
    "policies": [
      {
        "issue": "Healthcare",
        "stance": "Funds city clinics; defers to county on coverage."
      },
      {
        "issue": "Housing",
        "stance": "Upzoned three corridors in first term."
      },
      {
        "issue": "Climate",
        "stance": "Fleet electrification on schedule."
      },
      {
        "issue": "Labor",
        "stance": "Signed the city prevailing wage order."
      },
      {
        "issue": "Voting rights",
        "stance": "Expanded early voting sites citywide."
      }
    ],
    "promises": [
      {
        "id": "ainsley-open-the-light-rail-phase-one",
        "text": "Open the light rail phase one",
        "status": "In progress",
        "progress": 52,
        "date": "Ongoing",
        "sources": [
          "CapMetro",
          "KUT"
        ]
      },
      {
        "id": "ainsley-upzone-three-transit-corridors",
        "text": "Upzone three transit corridors",
        "status": "Delivered",
        "progress": 100,
        "date": "Nov 2024",
        "sources": [
          "Ordinance",
          "Statesman"
        ]
      },
      {
        "id": "ainsley-cut-permit-times-to-30-days",
        "text": "Cut permit times to 30 days",
        "status": "No movement",
        "progress": 0,
        "date": "Feb 2026",
        "sources": [
          "City audit",
          "Tribune"
        ]
      },
      {
        "id": "ainsley-electrify-the-city-fleet-by-2030",
        "text": "Electrify the city fleet by 2030",
        "status": "In progress",
        "progress": 45,
        "date": "Ongoing",
        "sources": [
          "Sustainability",
          "Memo"
        ]
      },
      {
        "id": "ainsley-add-15-early-voting-sites",
        "text": "Add 15 early voting sites",
        "status": "Delivered",
        "progress": 100,
        "date": "Sep 2025",
        "sources": [
          "Clerk",
          "AP"
        ]
      }
    ],
    "terms": [
      {
        "label": "Transit board 2016–21",
        "score": 72
      },
      {
        "label": "Mayor 2021–",
        "score": 66
      }
    ],
    "timeline": [
      {
        "date": "Oct 2021",
        "label": "Campaigned on 30-day permits",
        "dot": "#151515"
      },
      {
        "date": "May 2023",
        "label": "Pilot in two districts",
        "dot": "#B5A88A"
      },
      {
        "date": "Jan 2025",
        "label": "Median still 71 days",
        "dot": "#9C3F32"
      },
      {
        "date": "Feb 2026",
        "label": "Audit marks promise broken",
        "dot": "#9C3F32"
      },
      {
        "date": "Jul 2026",
        "label": "New process announced",
        "dot": "#B5A88A"
      }
    ],
    "career": [
      {
        "year": "2016",
        "what": "Appointed to transit board",
        "detail": "Led rail referendum"
      },
      {
        "year": "2021",
        "what": "Elected mayor as an independent",
        "detail": "Coalition of five council votes"
      },
      {
        "year": "2026",
        "what": "Standing for re-election",
        "detail": "Three-way race"
      }
    ]
  },
  {
    "id": "bellweather",
    "name": "Junie Bellweather",
    "office": "School Board Trustee",
    "district": "District 4",
    "level": "Local",
    "party": "D",
    "since": 2012,
    "trust": 84,
    "kept": 22,
    "prog": 2,
    "broken": 2,
    "bio": "Longest-serving trustee on the board, former special education teacher.",
    "tags": [
      "Education",
      "Facilities",
      "Nutrition"
    ],
    "policies": [
      {
        "issue": "Healthcare",
        "stance": "Expanded school-based clinics to nine campuses."
      },
      {
        "issue": "Housing",
        "stance": "Backs teacher housing on district land."
      },
      {
        "issue": "Climate",
        "stance": "Solar on 12 campuses since 2019."
      },
      {
        "issue": "Labor",
        "stance": "Negotiated the aide wage floor."
      },
      {
        "issue": "Voting rights",
        "stance": "Opened all campuses as polling sites."
      }
    ],
    "promises": [
      {
        "id": "bellweather-open-nine-school-based-clinics",
        "text": "Open nine school-based clinics",
        "status": "Delivered",
        "progress": 100,
        "date": "Aug 2025",
        "sources": [
          "District",
          "KUT"
        ]
      },
      {
        "id": "bellweather-solar-on-every-new-campus",
        "text": "Solar on every new campus",
        "status": "Delivered",
        "progress": 100,
        "date": "Jun 2024",
        "sources": [
          "Bond",
          "Statesman"
        ]
      },
      {
        "id": "bellweather-raise-the-aide-wage-floor-to-22",
        "text": "Raise the aide wage floor to $22",
        "status": "Delivered",
        "progress": 100,
        "date": "Sep 2025",
        "sources": [
          "Contract",
          "Tribune"
        ]
      },
      {
        "id": "bellweather-rebuild-two-aging-campuses",
        "text": "Rebuild two aging campuses",
        "status": "In progress",
        "progress": 45,
        "date": "Ongoing",
        "sources": [
          "Bond",
          "Memo"
        ]
      }
    ],
    "terms": [
      {
        "label": "Trustee 2012–18",
        "score": 79
      },
      {
        "label": "Trustee 2018–24",
        "score": 86
      },
      {
        "label": "Trustee 2024–",
        "score": 84
      }
    ],
    "timeline": [
      {
        "date": "Mar 2021",
        "label": "Promised clinics on nine campuses",
        "dot": "#151515"
      },
      {
        "date": "Aug 2022",
        "label": "First three open",
        "dot": "#253746"
      },
      {
        "date": "May 2023",
        "label": "Funding gap for remaining six",
        "dot": "#B5A88A"
      },
      {
        "date": "Jan 2025",
        "label": "Grant closes the gap",
        "dot": "#253746"
      },
      {
        "date": "Aug 2025",
        "label": "All nine open · promise delivered",
        "dot": "#253746"
      }
    ],
    "career": [
      {
        "year": "2003",
        "what": "Special education teacher",
        "detail": "District 4 campuses"
      },
      {
        "year": "2012",
        "what": "Elected trustee",
        "detail": "Facilities committee"
      },
      {
        "year": "2024",
        "what": "Re-elected, fourth term",
        "detail": "Board vice-chair"
      }
    ]
  },
  {
    "id": "oseihart",
    "name": "Judge Naomi Osei-Hart",
    "office": "County Judge",
    "district": "Travis County",
    "level": "Local",
    "party": "D",
    "since": 2019,
    "trust": 69,
    "kept": 15,
    "prog": 6,
    "broken": 6,
    "bio": "County judge overseeing emergency management and the county budget; former public defender.",
    "tags": [
      "Criminal justice",
      "Public health",
      "Budget"
    ],
    "policies": [
      {
        "issue": "Healthcare",
        "stance": "Kept the county hospital district levy flat."
      },
      {
        "issue": "Housing",
        "stance": "Funded a homelessness diversion pilot."
      },
      {
        "issue": "Climate",
        "stance": "Adopted the county resilience plan."
      },
      {
        "issue": "Labor",
        "stance": "Raised county contractor wage floor."
      },
      {
        "issue": "Voting rights",
        "stance": "Expanded ballot drop sites."
      }
    ],
    "promises": [
      {
        "id": "oseihart-fund-a-homelessness-diversion-pilot",
        "text": "Fund a homelessness diversion pilot",
        "status": "Delivered",
        "progress": 100,
        "date": "Oct 2024",
        "sources": [
          "County",
          "Statesman"
        ]
      },
      {
        "id": "oseihart-cut-jail-population-20",
        "text": "Cut jail population 20%",
        "status": "In progress",
        "progress": 38,
        "date": "Ongoing",
        "sources": [
          "Sheriff",
          "KUT"
        ]
      },
      {
        "id": "oseihart-publish-the-budget-in-plain-language",
        "text": "Publish the budget in plain language",
        "status": "Delivered",
        "progress": 100,
        "date": "Jul 2025",
        "sources": [
          "County",
          "Memo"
        ]
      },
      {
        "id": "oseihart-open-two-ballot-drop-sites",
        "text": "Open two ballot drop sites",
        "status": "No movement",
        "progress": 0,
        "date": "Oct 2025",
        "sources": [
          "Clerk",
          "AP"
        ]
      }
    ],
    "terms": [
      {
        "label": "Public defender 2010–19",
        "score": 70
      },
      {
        "label": "County Judge 2019–",
        "score": 69
      }
    ],
    "timeline": [
      {
        "date": "Feb 2022",
        "label": "Promised 20% jail reduction",
        "dot": "#151515"
      },
      {
        "date": "Nov 2023",
        "label": "Diversion court opens",
        "dot": "#253746"
      },
      {
        "date": "Jul 2024",
        "label": "Population down 9%",
        "dot": "#B5A88A"
      },
      {
        "date": "Mar 2025",
        "label": "Backlog reverses gains",
        "dot": "#9C3F32"
      },
      {
        "date": "Jun 2026",
        "label": "Still in progress",
        "dot": "#B5A88A"
      }
    ],
    "career": [
      {
        "year": "2010",
        "what": "County public defender",
        "detail": "Felony division"
      },
      {
        "year": "2019",
        "what": "Elected county judge",
        "detail": "Emergency management"
      },
      {
        "year": "2026",
        "what": "Standing for re-election",
        "detail": "Two-way race"
      }
    ]
  },
  {
    "id": "torrance",
    "name": "Rep. Clay Torrance",
    "office": "State Representative",
    "district": "HD-52",
    "level": "State",
    "party": "R",
    "since": 2017,
    "trust": 52,
    "kept": 14,
    "prog": 5,
    "broken": 12,
    "bio": "Five-term state representative, small business owner. Sits on ways and means.",
    "tags": [
      "Taxes",
      "Education",
      "Water"
    ],
    "policies": [
      {
        "issue": "Healthcare",
        "stance": "Opposed Medicaid expansion; backs price transparency."
      },
      {
        "issue": "Housing",
        "stance": "Supports supply reform, opposes mandates."
      },
      {
        "issue": "Climate",
        "stance": "Voted for weatherization, against targets."
      },
      {
        "issue": "Labor",
        "stance": "Supports right-to-work protections."
      },
      {
        "issue": "Voting rights",
        "stance": "Sponsored stricter ID rules."
      }
    ],
    "promises": [
      {
        "id": "torrance-deliver-property-tax-relief",
        "text": "Deliver property tax relief",
        "status": "Delivered",
        "progress": 100,
        "date": "Aug 2025",
        "sources": [
          "HB 3",
          "Tribune"
        ]
      },
      {
        "id": "torrance-fund-rural-water-infrastructure",
        "text": "Fund rural water infrastructure",
        "status": "In progress",
        "progress": 38,
        "date": "Ongoing",
        "sources": [
          "TWDB",
          "Statesman"
        ]
      },
      {
        "id": "torrance-oppose-new-business-fees",
        "text": "Oppose new business fees",
        "status": "No movement",
        "progress": 0,
        "date": "May 2025",
        "sources": [
          "Roll call",
          "AP"
        ]
      },
      {
        "id": "torrance-expand-the-voucher-pilot",
        "text": "Expand the voucher pilot",
        "status": "Delivered",
        "progress": 100,
        "date": "Jun 2026",
        "sources": [
          "SB 12",
          "TEA"
        ]
      }
    ],
    "terms": [
      {
        "label": "School board 2013–17",
        "score": 48
      },
      {
        "label": "State Rep 2017–22",
        "score": 55
      },
      {
        "label": "State Rep 2022–",
        "score": 52
      }
    ],
    "timeline": [
      {
        "date": "Jan 2023",
        "label": "Promised rural water funding",
        "dot": "#151515"
      },
      {
        "date": "Jun 2023",
        "label": "Study committee formed",
        "dot": "#B5A88A"
      },
      {
        "date": "Apr 2024",
        "label": "Line item cut in conference",
        "dot": "#9C3F32"
      },
      {
        "date": "May 2025",
        "label": "Partial funding restored",
        "dot": "#B5A88A"
      },
      {
        "date": "Jun 2026",
        "label": "Still in progress",
        "dot": "#B5A88A"
      }
    ],
    "career": [
      {
        "year": "2006",
        "what": "Founded a supply business",
        "detail": "Hill Country"
      },
      {
        "year": "2013",
        "what": "Elected to school board",
        "detail": "—"
      },
      {
        "year": "2017",
        "what": "Elected state representative",
        "detail": "Ways and means"
      },
      {
        "year": "2026",
        "what": "Standing for re-election",
        "detail": "Contested primary"
      }
    ]
  },
  {
    "id": "hollis",
    "name": "Bertram Hollis",
    "office": "State Comptroller",
    "district": "Statewide",
    "level": "State",
    "party": "R",
    "since": 2015,
    "trust": 37,
    "kept": 11,
    "prog": 3,
    "broken": 18,
    "bio": "Statewide comptroller, former bank examiner. Publishes the revenue estimate that anchors each budget.",
    "tags": [
      "Budget",
      "Taxes",
      "Pensions"
    ],
    "policies": [
      {
        "issue": "Healthcare",
        "stance": "Scores expansion as unaffordable."
      },
      {
        "issue": "Housing",
        "stance": "No published position."
      },
      {
        "issue": "Climate",
        "stance": "Opposes fund divestment screens."
      },
      {
        "issue": "Labor",
        "stance": "Opposes prevailing wage rules."
      },
      {
        "issue": "Voting rights",
        "stance": "No published position."
      }
    ],
    "promises": [
      {
        "id": "hollis-publish-a-real-time-spending-dashboard",
        "text": "Publish a real-time spending dashboard",
        "status": "No movement",
        "progress": 0,
        "date": "Jan 2026",
        "sources": [
          "Comptroller",
          "Tribune"
        ]
      },
      {
        "id": "hollis-return-the-unclaimed-property-backlog",
        "text": "Return the unclaimed property backlog",
        "status": "In progress",
        "progress": 38,
        "date": "Ongoing",
        "sources": [
          "Agency",
          "AP"
        ]
      },
      {
        "id": "hollis-hold-the-revenue-estimate-to-2",
        "text": "Hold the revenue estimate to ±2%",
        "status": "No movement",
        "progress": 0,
        "date": "Sep 2025",
        "sources": [
          "LBB",
          "Statesman"
        ]
      },
      {
        "id": "hollis-audit-every-state-agency-by-2026",
        "text": "Audit every state agency by 2026",
        "status": "No movement",
        "progress": 0,
        "date": "Jun 2026",
        "sources": [
          "Audit office",
          "KUT"
        ]
      }
    ],
    "terms": [
      {
        "label": "Bank examiner 2001–15",
        "score": 44
      },
      {
        "label": "Comptroller 2015–20",
        "score": 39
      },
      {
        "label": "Comptroller 2020–",
        "score": 37
      }
    ],
    "timeline": [
      {
        "date": "Nov 2018",
        "label": "Promised a real-time dashboard",
        "dot": "#151515"
      },
      {
        "date": "Aug 2020",
        "label": "Vendor contract signed",
        "dot": "#B5A88A"
      },
      {
        "date": "May 2022",
        "label": "Contract cancelled",
        "dot": "#9C3F32"
      },
      {
        "date": "Mar 2024",
        "label": "Rescoped as quarterly reports",
        "dot": "#9C3F32"
      },
      {
        "date": "Jan 2026",
        "label": "Marked no movement",
        "dot": "#9C3F32"
      }
    ],
    "career": [
      {
        "year": "2001",
        "what": "State bank examiner",
        "detail": "—"
      },
      {
        "year": "2015",
        "what": "Elected comptroller",
        "detail": "Revenue estimating"
      },
      {
        "year": "2026",
        "what": "Not on this year's ballot",
        "detail": "Term ends 2028"
      }
    ]
  }
];

export const FACT_CHECKS: FactCheck[] = [
  {
    "id": "fc-001",
    "verdict": "False",
    "politicianId": "pike",
    "topic": "Housing",
    "date": "Aug 22",
    "claim": "Rent in this county has fallen every year since I took office.",
    "finding": "County appraisal records show median rent up 21% over the same period; the only decline was a 1.4% dip in 2020.",
    "sources": [
      "Appraisal district",
      "BLS",
      "Statesman"
    ]
  },
  {
    "id": "fc-002",
    "verdict": "True",
    "politicianId": "marchetti",
    "topic": "Healthcare",
    "date": "Aug 20",
    "claim": "Two new county clinics opened under the funding package I sponsored.",
    "finding": "Both clinics opened in 2024 and 2025 in the ZIPs named in the bill; grant records confirm the funding line.",
    "sources": [
      "HHS grants",
      "County board",
      "KUT"
    ]
  },
  {
    "id": "fc-003",
    "verdict": "Misleading",
    "politicianId": "ainsley",
    "topic": "Transit",
    "date": "Aug 18",
    "claim": "The transit expansion came in under budget.",
    "finding": "Phase one finished 3% under its revised budget — but the revision raised the original figure by 19% in 2023.",
    "sources": [
      "City audit",
      "Council minutes",
      "Tribune"
    ]
  },
  {
    "id": "fc-004",
    "verdict": "False",
    "politicianId": "hollis",
    "topic": "Economy",
    "date": "Aug 15",
    "claim": "State reserves are at an all-time high because of my office's cuts.",
    "finding": "Reserves peaked in 2022 on federal transfers and energy revenue; no net cuts are recorded since.",
    "sources": [
      "Comptroller",
      "Legislative Board",
      "AP"
    ]
  },
  {
    "id": "fc-005",
    "verdict": "True",
    "politicianId": "vance",
    "topic": "Voting rights",
    "date": "Aug 12",
    "claim": "I voted against every bill narrowing mail-ballot access this session.",
    "finding": "Roll-call records show four such bills; Vance voted no on all four.",
    "sources": [
      "Roll call",
      "Legislature",
      "Brennan"
    ]
  },
  {
    "id": "fc-006",
    "verdict": "Misleading",
    "politicianId": "torrance",
    "topic": "Education",
    "date": "Aug 9",
    "claim": "The voucher pilot has a waiting list of thousands.",
    "finding": "The agency reports 2,900 applications statewide, of which 1,100 were incomplete or duplicated.",
    "sources": [
      "TEA",
      "Agency data",
      "Tribune"
    ]
  },
  {
    "id": "fc-007",
    "verdict": "False",
    "politicianId": "pike",
    "topic": "Energy",
    "date": "Aug 6",
    "claim": "No federal dollars went to wind in my last package.",
    "finding": "Two line items totalling $410M funded transmission for wind capacity.",
    "sources": [
      "Appropriations",
      "DOE",
      "Reuters"
    ]
  },
  {
    "id": "fc-008",
    "verdict": "True",
    "politicianId": "bellweather",
    "topic": "Education",
    "date": "Aug 3",
    "claim": "Every new campus we've built since 2019 has solar on the roof.",
    "finding": "District records show solar on all 12 campuses completed since 2019.",
    "sources": [
      "District",
      "Bond report",
      "KUT"
    ]
  },
  {
    "id": "fc-009",
    "verdict": "Misleading",
    "politicianId": "oseihart",
    "topic": "Criminal justice",
    "date": "Jul 30",
    "claim": "The jail population is down since diversion court opened.",
    "finding": "Population fell 9% through 2024, then returned to within 2% of its 2022 level.",
    "sources": [
      "Sheriff",
      "County data",
      "Statesman"
    ]
  }
];

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
 * The "My Top Issues" quiz's question bank: 8 specific, in-the-weeds policy
 * details per `TOPIC_POOL` issue (112 total), ordered core-first within each
 * issue's array. Deliberately not generic topic ratings ("how important is
 * gun rights to you") — each one names a specific provision within that
 * umbrella issue, so the quiz tests whether someone holds a view on the
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
 * and the fixed three answers (Not important / Somewhat important / Very
 * important) — see TopIssuesQuizView — these strings are just the ___.
 *
 * `lib/quiz.ts` picks 2/3/4 of each issue's 8 (Quick/Standard/Thorough) per
 * sitting, unanswered-first, so a retake naturally surfaces fresh ones
 * before cycling back through already-answered questions.
 */
export const TOP_ISSUES_QUIZ: Record<string, string[]> = {
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

export const STANCES: Record<string, Record<string, StanceCell>> = {
  "Healthcare": {
    "marchetti": [
      "Aligned",
      "Public option, $35 insulin cap"
    ],
    "vance": [
      "Aligned",
      "State Medicaid expansion lead"
    ],
    "pike": [
      "Opposed",
      "Voted against subsidy renewal"
    ],
    "ainsley": [
      "Partial",
      "Funds clinics, defers on coverage"
    ],
    "bellweather": [
      "Aligned",
      "School-based clinics on 9 campuses"
    ],
    "oseihart": [
      "Aligned",
      "Held hospital district levy flat"
    ],
    "torrance": [
      "Opposed",
      "Opposed Medicaid expansion"
    ],
    "hollis": [
      "Opposed",
      "Scores expansion as unaffordable"
    ]
  },
  "Housing": {
    "marchetti": [
      "Aligned",
      "Renter's credit, density incentives"
    ],
    "vance": [
      "Partial",
      "Supply yes, tenant protections no"
    ],
    "pike": [
      "Opposed",
      "Opposes federal preemption"
    ],
    "ainsley": [
      "Aligned",
      "Upzoned three corridors"
    ],
    "bellweather": [
      "Partial",
      "Teacher housing on district land"
    ],
    "oseihart": [
      "Aligned",
      "Funded diversion pilot"
    ],
    "torrance": [
      "Partial",
      "Supply reform, no mandates"
    ],
    "hollis": [
      "No record",
      "No published position"
    ]
  },
  "Climate": {
    "marchetti": [
      "Partial",
      "Grid bill yes, subsidies no"
    ],
    "vance": [
      "Aligned",
      "Sponsored coastal resilience fund"
    ],
    "pike": [
      "Opposed",
      "Calls targets unworkable"
    ],
    "ainsley": [
      "Aligned",
      "Fleet electrification on schedule"
    ],
    "bellweather": [
      "Aligned",
      "Solar on 12 campuses"
    ],
    "oseihart": [
      "Partial",
      "Adopted county resilience plan"
    ],
    "torrance": [
      "Opposed",
      "Voted against targets"
    ],
    "hollis": [
      "Opposed",
      "Opposes divestment screens"
    ]
  },
  "Voting rights": {
    "marchetti": [
      "Aligned",
      "Automatic registration"
    ],
    "vance": [
      "Aligned",
      "Blocked mail-ballot limits"
    ],
    "pike": [
      "Opposed",
      "Backs stricter ID rules"
    ],
    "ainsley": [
      "Aligned",
      "Added 15 early voting sites"
    ],
    "bellweather": [
      "Aligned",
      "Campuses as polling sites"
    ],
    "oseihart": [
      "Partial",
      "Drop-site promise missed"
    ],
    "torrance": [
      "Opposed",
      "Sponsored stricter ID"
    ],
    "hollis": [
      "No record",
      "No published position"
    ]
  },
  "Labor": {
    "marchetti": [
      "Aligned",
      "Sectoral bargaining co-sponsor"
    ],
    "vance": [
      "Partial",
      "Wage floor only"
    ],
    "pike": [
      "No record",
      "No floor votes since 2023"
    ],
    "ainsley": [
      "Aligned",
      "City prevailing wage order"
    ],
    "bellweather": [
      "Aligned",
      "Aide wage floor at $22"
    ],
    "oseihart": [
      "Aligned",
      "Contractor wage floor"
    ],
    "torrance": [
      "Opposed",
      "Right-to-work protections"
    ],
    "hollis": [
      "Opposed",
      "Opposes prevailing wage"
    ]
  },
  "Education": {
    "marchetti": [
      "Partial",
      "Funds formula, split on vouchers"
    ],
    "vance": [
      "Aligned",
      "Opposes voucher expansion"
    ],
    "pike": [
      "Opposed",
      "Backs federal voucher pilot"
    ],
    "ainsley": [
      "Partial",
      "No district authority"
    ],
    "bellweather": [
      "Aligned",
      "Opposed voucher pilot"
    ],
    "oseihart": [
      "No record",
      "Outside county remit"
    ],
    "torrance": [
      "Opposed",
      "Sponsored voucher pilot"
    ],
    "hollis": [
      "Opposed",
      "Scores formula as unsustainable"
    ]
  }
};

export const RACES: Race[] = [
  {
    "id": "u-s-house-tx-35",
    "title": "U.S. House · TX-35",
    "meta": "Nov 3 · federal",
    "candidates": [
      {
        "politicianId": "marchetti",
        "name": "Delia Marchetti (D)",
        "party": "D"
      },
      {
        "politicianId": "wexler",
        "name": "Grant Wexler (R)",
        "party": "R"
      }
    ]
  },
  {
    "id": "u-s-senate-tx",
    "title": "U.S. Senate · TX",
    "meta": "Nov 3 · federal",
    "candidates": [
      {
        "politicianId": "pike",
        "name": "Carsten Prause (R)",
        "party": "R"
      },
      {
        "politicianId": "olamide",
        "name": "Bisi Olamide (D)",
        "party": "D"
      }
    ]
  },
  {
    "id": "mayor-of-austin",
    "title": "Mayor of Austin",
    "meta": "Nov 3 · local",
    "candidates": [
      {
        "politicianId": "ainsley",
        "name": "Marcus Ainsley (I)",
        "party": "I"
      },
      {
        "politicianId": "kohl",
        "name": "Priya Kohl (D)",
        "party": "D"
      },
      {
        "politicianId": "rausch",
        "name": "Ed Rausch (R)",
        "party": "R"
      }
    ]
  },
  {
    "id": "state-senate-d-14",
    "title": "State Senate · D-14",
    "meta": "Nov 3 · state",
    "candidates": [
      {
        "politicianId": "vance",
        "name": "Rosa Vance (D)",
        "party": "D"
      },
      {
        "politicianId": "torrance",
        "name": "Clay Torrance (R)",
        "party": "R"
      }
    ]
  },
  {
    "id": "county-judge",
    "title": "County Judge",
    "meta": "Nov 3 · local",
    "candidates": [
      {
        "politicianId": "oseihart",
        "name": "Naomi Osei-Hart (D)",
        "party": "D"
      },
      {
        "politicianId": "trask",
        "name": "Bill Trask (R)",
        "party": "R"
      }
    ]
  },
  {
    "id": "school-board-d4",
    "title": "School Board · D4",
    "meta": "Nov 3 · local",
    "candidates": [
      {
        "politicianId": "bellweather",
        "name": "Junie Bellweather (D)",
        "party": "D"
      },
      {
        "politicianId": "mora",
        "name": "Sal Mora (I)",
        "party": "I"
      }
    ]
  }
];

/**
 * Sourced per-candidate, per-issue positions for HUSH Guide's election
 * comparison page — keyed by politicianId, then by issue name (matching
 * `TOPIC_POOL`). Every RACES candidate is represented as a key even when
 * empty, so a candidate with no researched positions yet (e.g. `rausch`,
 * `trask`) is an explicit empty object rather than a missing key that could
 * be mistaken for "not looked up yet" — GuideView treats both the same way
 * (falls through to "No official position found"), but the empty object
 * documents that the gap is real, not an oversight. The same convention
 * applies at the single-issue level: `ainsley` has no "Healthcare" key and
 * `pike` has no "Housing" key, each with an inline comment marking the
 * omission as deliberate rather than an unresearched gap.
 *
 * Deliberately partial: this covers most, not all, of the TOPIC_POOL cross
 * product. That sparsity is intentional — it's what lets the comparison
 * page demonstrate "No official position found" honestly instead of every
 * cell being filled in. Nothing here is a real position or a real source;
 * see the file header.
 */
export const GUIDE_POSITIONS: Record<string, Record<string, IssuePosition>> = {
  marchetti: {
    "Healthcare": {
      excerpt:
        "I'll keep fighting for a public option and a hard $35 cap on insulin copays for anyone on a state plan.",
      sourceTitle: "Healthcare — Marchetti for Congress",
      sourceType: "Campaign site",
      sourceUrl: "https://delioforcongress.example/issues/healthcare",
      date: "Feb 2026",
    },
    "Housing": {
      excerpt:
        "A renter's tax credit and real density incentives — that's how we actually bring costs down instead of just talking about it.",
      sourceTitle: "Housing — Marchetti for Congress",
      sourceType: "Campaign site",
      sourceUrl: "https://delioforcongress.example/issues/housing",
      date: "Feb 2026",
    },
    "Climate": {
      excerpt:
        "Grid resilience funding passed with my vote; I want a fossil subsidy phase-out next, not another delay.",
      sourceTitle: "Floor statement on H.R. 4410",
      sourceType: "Official press release",
      sourceUrl: "https://marchetti.house.gov.example/press/floor-statement-hr4410",
      date: "Mar 2026",
    },
    "Labor": {
      excerpt:
        "I co-sponsored sectoral bargaining rules for service workers — that's how you actually raise wages without waiting on Congress to touch the federal minimum.",
      sourceTitle: "Labor — Marchetti for Congress",
      sourceType: "Campaign site",
      sourceUrl: "https://delioforcongress.example/issues/labor",
      date: "Apr 2026",
    },
    "Voting rights": {
      excerpt:
        "Automatic registration and restoring federal pre-clearance review are both overdue — I'm a cosponsor on both.",
      sourceTitle: "Marchetti Co-Sponsors Pre-Clearance Restoration Act",
      sourceType: "Official press release",
      sourceUrl: "https://marchetti.house.gov.example/press/pre-clearance-restoration-act",
      date: "Jan 2026",
    },
  },
  wexler: {
    "Healthcare": {
      excerpt:
        "Washington mandates drive up premiums. I'll fight any public option that puts a bureaucrat between you and your doctor.",
      sourceTitle: "Where Grant Stands",
      sourceType: "Campaign site",
      sourceUrl: "https://wexlerforcongress.example/platform",
      date: "May 2026",
    },
    "Climate": {
      excerpt:
        "Grid reliability comes before emissions targets — I won't vote to phase out dispatchable power before we have a replacement that works.",
      sourceTitle: "Where Grant Stands — Energy",
      sourceType: "Campaign site",
      sourceUrl: "https://wexlerforcongress.example/platform/energy",
      date: "May 2026",
    },
  },
  ainsley: {
    // No official position found on Healthcare — the city funds clinics but
    // Ainsley has not staked out a position beyond deferring to the county.
    "Housing": {
      excerpt:
        "We upzoned three transit corridors this term and cut permit review time to 30 days — that's how a city keeps up with growth.",
      sourceTitle: "State of the City: Housing & Growth",
      sourceType: "Official government site",
      sourceUrl: "https://austintexas.gov.example/mayor/state-of-the-city-housing-growth",
      date: "Mar 2026",
    },
    "Climate": {
      excerpt:
        "The municipal fleet goes fully electric on schedule, and I've asked the utility to move up the coal retirement date.",
      sourceTitle: "State of the City address",
      sourceType: "Official press release",
      sourceUrl: "https://austintexas.gov.example/news/state-of-the-city-2026",
      date: "Jan 2026",
    },
    "Transit": {
      excerpt:
        "Phase one of the rail expansion opens on budget next year — I'm not interested in cutting corners to move the date up.",
      sourceTitle: "@MayorAinsley",
      sourceType: "Official social media",
      sourceUrl: "https://x.com.example/mayorainsley/status/1234567890",
      date: "Apr 2026",
    },
    "Labor": {
      excerpt: "I signed the prevailing wage order in my first hundred days — every city contract now has to meet it.",
      sourceTitle: "Office of the Mayor — Labor",
      sourceType: "Official government site",
      sourceUrl: "https://austintexas.gov.example/mayor/labor",
      date: "Feb 2026",
    },
    "Voting rights": {
      excerpt:
        "Fifteen new early voting sites are open citywide this cycle — turnout shouldn't depend on which zip code you live in.",
      sourceTitle: "Mayor Ainsley Expands Early Voting Access",
      sourceType: "Official press release",
      sourceUrl: "https://austintexas.gov.example/news/early-voting-expansion",
      date: "Sep 2025",
    },
  },
  kohl: {
    "Housing": {
      excerpt: "Austin needs a housing bond on the ballot, not more incentive programs that never break ground.",
      sourceTitle: "Priya Kohl for Austin — Housing",
      sourceType: "Campaign site",
      sourceUrl: "https://kohlforaustin.example/housing",
      date: "Jun 2026",
    },
    "Transit": {
      excerpt:
        "I'd freeze the rail budget and put the difference into bus rapid transit we can build in two years, not ten.",
      sourceTitle: "Kohl campaign platform",
      sourceType: "Official platform document",
      sourceUrl: "https://kohlforaustin.example/files/platform.pdf",
      date: "May 2026",
    },
    "Labor": {
      excerpt: "Every city contract should carry a local-hire requirement, not just a wage floor.",
      sourceTitle: "Kohl campaign platform",
      sourceType: "Official platform document",
      sourceUrl: "https://kohlforaustin.example/files/platform.pdf",
      date: "May 2026",
    },
  },
  // No researched positions yet — every issue on the comparison page falls
  // back to "No official position found" for this candidate, honestly.
  rausch: {},
  vance: {
    "Healthcare": {
      excerpt:
        "Our state Medicaid expansion is the reason 40,000 more families have coverage today — I led that fight and I'll defend it.",
      sourceTitle: "Where I Stand: Healthcare",
      sourceType: "Official platform document",
      sourceUrl: "https://vanceforsenate.example/where-i-stand/healthcare",
      date: "Jan 2026",
    },
    "Housing": {
      excerpt: "I support building more supply, but not at the cost of tenant protections — both have to move together.",
      sourceTitle: "Where I Stand: Housing",
      sourceType: "Official platform document",
      sourceUrl: "https://vanceforsenate.example/where-i-stand/housing",
      date: "Jan 2026",
    },
    "Climate": {
      excerpt:
        "The coastal resilience fund I sponsored is state law now. I want the same approach applied inland, to the aquifer.",
      sourceTitle: "Texas Senate Bill 812 — sponsor statement",
      sourceType: "Official government site",
      sourceUrl: "https://senate.texas.gov.example/members/dist14/sb812",
      date: "May 2025",
    },
    "Labor": {
      excerpt:
        "I'll back a statewide wage floor, but I'm not there yet on mandating sectoral bargaining — that fight isn't finished for me.",
      sourceTitle: "Where I Stand: Labor",
      sourceType: "Official platform document",
      sourceUrl: "https://vanceforsenate.example/where-i-stand/labor",
      date: "Jan 2026",
    },
    "Voting rights": {
      excerpt: "I blocked the mail-ballot restrictions on the floor, and I'll block the next version too.",
      sourceTitle: "Vance campaign platform",
      sourceType: "Official platform document",
      sourceUrl: "https://vanceforsenate.example/files/platform.pdf",
      date: "Jun 2026",
    },
  },
  torrance: {
    "Healthcare": {
      excerpt:
        "I opposed the Medicaid expansion — the state can't sustain the match cost — but I'll back real price transparency requirements for hospitals.",
      sourceTitle: "Torrance for Senate — Healthcare",
      sourceType: "Campaign site",
      sourceUrl: "https://torranceforsenate.example/healthcare",
      date: "May 2026",
    },
    "Housing": {
      excerpt: "I'm for more supply, not more mandates — let the market build, and get government out of the way.",
      sourceTitle: "Torrance campaign platform",
      sourceType: "Official platform document",
      sourceUrl: "https://torranceforsenate.example/files/platform.pdf",
      date: "May 2026",
    },
    "Voting rights": {
      excerpt: "Voter ID isn't suppression, it's security. I sponsored the bill and I'd sponsor it again.",
      sourceTitle: "Torrance for Senate — Election Integrity",
      sourceType: "Campaign site",
      sourceUrl: "https://torranceforsenate.example/election-integrity",
      date: "Jun 2026",
    },
    "Education": {
      excerpt: "Every parent deserves a voucher option if their zoned school isn't working for their kid.",
      sourceTitle: "Torrance campaign platform",
      sourceType: "Official platform document",
      sourceUrl: "https://torranceforsenate.example/files/platform.pdf",
      date: "May 2026",
    },
  },
  oseihart: {
    "Healthcare": {
      excerpt:
        "I held the hospital district levy flat for the third year running — you shouldn't need a tax hike every cycle to keep the county ER open.",
      sourceTitle: "County Judge — Hospital District Levy",
      sourceType: "Official government site",
      sourceUrl: "https://traviscountytx.gov.example/judge/hospital-district-levy",
      date: "Oct 2025",
    },
    "Housing": {
      excerpt:
        "The diversion pilot we funded keeps people housed instead of jailed over unpaid fines — I want to make it permanent.",
      sourceTitle: "County Judge — Housing & Justice",
      sourceType: "Official government site",
      sourceUrl: "https://traviscountytx.gov.example/judge/housing-justice",
      date: "Mar 2026",
    },
    "Labor": {
      excerpt: "Every county contractor now has to meet our wage floor. No exceptions, no waivers.",
      sourceTitle: "Commissioners Court press release",
      sourceType: "Official press release",
      sourceUrl: "https://traviscountytx.gov.example/news/contractor-wage-floor",
      date: "Nov 2025",
    },
    "Voting rights": {
      excerpt:
        "Two new ballot drop sites opened this term, both in the districts that had the longest lines last cycle.",
      sourceTitle: "Commissioners Court press release",
      sourceType: "Official press release",
      sourceUrl: "https://traviscountytx.gov.example/news/ballot-drop-sites",
      date: "Sep 2025",
    },
  },
  // No researched positions yet — same as `rausch` above.
  trask: {},
  bellweather: {
    "Healthcare": {
      excerpt:
        "Nine campuses now have a school-based health clinic on-site — every kid should be able to see a nurse without missing a day of class.",
      sourceTitle: "School-Based Health Clinics Update",
      sourceType: "Official press release",
      sourceUrl: "https://bellweatherfortrustee.example/press/school-based-health-clinics-update",
      date: "Sep 2025",
    },
    "Housing": {
      excerpt:
        "Teacher housing on district-owned land is how we keep good teachers from being priced out of the community they teach in.",
      sourceTitle: "@BellweatherForD4",
      sourceType: "Official social media",
      sourceUrl: "https://x.com.example/bellweatherford4/status/9876543210",
      date: "Oct 2025",
    },
    "Climate": {
      excerpt:
        "Twelve campuses are on solar now, and every new build goes solar by default — that's board policy, not a pledge.",
      sourceTitle: "District 4 trustee platform",
      sourceType: "Official platform document",
      sourceUrl: "https://bellweatherfortrustee.example/files/platform.pdf",
      date: "May 2026",
    },
    "Labor": {
      excerpt: "I negotiated the aide wage floor up to $22 an hour — we were losing aides to retail jobs that paid better.",
      sourceTitle: "Bellweather Announces Aide Wage Agreement",
      sourceType: "Official press release",
      sourceUrl: "https://bellweatherfortrustee.example/press/aide-wage-agreement",
      date: "Aug 2025",
    },
    "Education": {
      excerpt:
        "We stopped the voucher pilot at the board and I'll stop the next version — public dollars belong in public schools.",
      sourceTitle: "Bellweather for School Board",
      sourceType: "Campaign site",
      sourceUrl: "https://bellweatherfortrustee.example/issues",
      date: "Jun 2026",
    },
  },
  mora: {
    "Housing": {
      excerpt:
        "Teacher housing sounds nice, but I'd rather see that land sold and the money put straight into aide pay.",
      sourceTitle: "Sal Mora for District 4 — Housing",
      sourceType: "Campaign site",
      sourceUrl: "https://moraford4.example/housing",
      date: "Jun 2026",
    },
    "Education": {
      excerpt:
        "I'd pause the clinic expansion and put that money into classroom aide pay instead — teachers are leaving over it.",
      sourceTitle: "Sal Mora for District 4",
      sourceType: "Campaign site",
      sourceUrl: "https://moraford4.example/priorities",
      date: "Jun 2026",
    },
  },
  pike: {
    "Healthcare": {
      excerpt:
        "I voted against the subsidy renewal because it grows the deficit without fixing the underlying cost of care.",
      sourceTitle: "Senator Pike Statement on Health Subsidy Vote",
      sourceType: "Official government site",
      sourceUrl: "https://pike.senate.gov.example/press/health-subsidy-vote",
      date: "Nov 2025",
    },
    // No official position found on Housing — Pike has voted on the topic
    // but has not issued a public statement staking out a position.
    "Climate": {
      excerpt:
        "Emissions targets without a reliability plan are wishful thinking — I'll keep backing LNG expansion as the bridge fuel that actually keeps the lights on.",
      sourceTitle: "Senator Pike on Energy Policy",
      sourceType: "Official government site",
      sourceUrl: "https://pike.senate.gov.example/issues/energy-policy",
      date: "Aug 2025",
    },
    "Voting rights": {
      excerpt: "Ballot integrity and ballot access aren't in conflict — I'll keep backing ID requirements and regular roll maintenance.",
      sourceTitle: "Senator Pike Statement on Election Security",
      sourceType: "Official press release",
      sourceUrl: "https://pike.senate.gov.example/press/election-security-statement",
      date: "Dec 2025",
    },
  },
  olamide: {
    "Housing": {
      excerpt: "We need a statewide renters' bill of rights — Texans shouldn't lose their home over one missed paycheck.",
      sourceTitle: "Olamide for Senate — Housing",
      sourceType: "Campaign site",
      sourceUrl: "https://olamideforsenate.example/housing",
      date: "Mar 2026",
    },
    "Climate": {
      excerpt:
        "I'd put the state's share of clean-energy tax credits behind grid batteries first — that's the fastest way to cut outages.",
      sourceTitle: "Olamide for Senate — Climate",
      sourceType: "Campaign site",
      sourceUrl: "https://olamideforsenate.example/climate",
      date: "Feb 2026",
    },
  },
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
  "Healthcare":
    "The government should guarantee health insurance coverage for every American, even if it means phasing out private insurance.",
  "Housing": "Local governments should eliminate single-family-only zoning to allow denser housing everywhere.",
  "Voting rights": "Voters should be required to show a government-issued photo ID to cast a ballot.",
  "Climate": "The government should ban the sale of new gas-powered cars by 2035.",
  "Labor": "The federal minimum wage should be raised to $20 an hour.",
  "Education": "Public education dollars should be allowed to follow students to private schools through vouchers.",
  "Economy": "The federal government should raise taxes on households earning over $400,000 a year.",
  "Immigration":
    "Undocumented immigrants who have lived in the U.S. for years without a criminal record should have a path to citizenship.",
  "Criminal justice": "Cash bail should be eliminated for nonviolent offenses.",
  "Guns": "Assault-style semiautomatic rifles should be banned for civilian sale.",
  "Reproductive rights": "Abortion should be illegal in all cases.",
  "Transit": "Cities should prioritize public transit funding over building new highway lanes.",
  "Water": "Water utilities should be required to replace all lead service lines within 10 years, at public expense.",
  "Veterans":
    "Veterans should be able to choose care from any private doctor at government expense instead of using the VA system.",
};

/**
 * Sourced per-candidate stances toward each `STANCE_STATEMENTS` claim, for
 * Stance Check. Keyed by politicianId then issue, same nesting as
 * `GUIDE_POSITIONS` and the same convention: a candidate not on the user's
 * ballot (`hollis` has a full profile but isn't in any `RACES` entry) has
 * no key here at all, and a candidate on the ballot with nothing sourced
 * for a given statement is simply missing that issue key rather than
 * carrying an invented one — Stance Check's UI renders that gap as "No
 * record," honestly, same as HUSH Guide does for `GUIDE_POSITIONS`.
 *
 * `stance` answers the statement itself, not the general issue area: it is
 * deliberately possible for a candidate's answer here to cut against the
 * pattern their `GUIDE_POSITIONS`/`STANCES` entries on the same issue might
 * suggest — e.g. `torrance` opposes housing mandates generally but agrees
 * with *this* statement because ending single-family zoning is itself a
 * deregulatory move for him, not a mandate. That's intentional: a specific
 * statement doesn't always sort the same way a broad issue label does, and
 * flattening that into "conservative = disagree" would be its own kind of
 * inaccuracy. Coverage here is deliberately partial, same as
 * `GUIDE_POSITIONS` — not every candidate has a sourced stance on every
 * statement.
 */
export const STANCE_POSITIONS: Record<string, Record<string, StanceCheckPosition>> = {
  marchetti: {
    "Healthcare": {
      stance: "Neutral",
      excerpt:
        "I've fought for a public option and I'll keep fighting for it, but I'm not for eliminating private coverage for people who want to keep the plan they have.",
      sourceTitle: "Healthcare — Marchetti for Congress",
      sourceType: "Campaign site",
      sourceUrl: "https://delioforcongress.example/issues/healthcare",
      date: "Jun 2026",
    },
    "Housing": {
      stance: "Agree",
      excerpt:
        "Single-family-only zoning is exclusionary by design. My bill uses incentives today, but I'd support ending the mandate outright if I had the votes.",
      sourceTitle: "Housing — Marchetti for Congress",
      sourceType: "Campaign site",
      sourceUrl: "https://delioforcongress.example/issues/housing",
      date: "Jun 2026",
    },
    "Voting rights": {
      stance: "Disagree",
      excerpt: "A photo ID requirement solves a fraud problem that doesn't exist and locks out voters who don't drive.",
      sourceTitle: "Marchetti Co-Sponsors Pre-Clearance Restoration Act",
      sourceType: "Official press release",
      sourceUrl: "https://marchetti.house.gov.example/press/pre-clearance-restoration-act",
      date: "Jan 2026",
    },
    "Climate": {
      stance: "Agree",
      excerpt: "Every year we delay a phase-out date is a year the auto industry has to keep building the wrong thing.",
      sourceTitle: "Floor statement on H.R. 4410",
      sourceType: "Official press release",
      sourceUrl: "https://marchetti.house.gov.example/press/floor-statement-hr4410",
      date: "Mar 2026",
    },
    "Labor": {
      stance: "Agree",
      excerpt: "Twenty dollars is closer to what a full-time wage should buy today than the number Congress last touched in 2009.",
      sourceTitle: "Labor — Marchetti for Congress",
      sourceType: "Campaign site",
      sourceUrl: "https://delioforcongress.example/issues/labor",
      date: "Jul 2026",
    },
    "Education": {
      stance: "Neutral",
      excerpt:
        "I split with my own caucus on this — I'll fund a narrow pilot for kids in the lowest-rated districts, but not a universal voucher that drains the public system.",
      sourceTitle: "Education — Marchetti for Congress",
      sourceType: "Campaign site",
      sourceUrl: "https://delioforcongress.example/issues/education",
      date: "Aug 2026",
    },
    "Economy": {
      stance: "Agree",
      excerpt:
        "A family making under $400,000 shouldn't pay a higher effective rate than a hedge fund manager. I'd raise the top marginal rate and close the carried-interest loophole.",
      sourceTitle: "Economy — Marchetti for Congress",
      sourceType: "Campaign site",
      sourceUrl: "https://delioforcongress.example/issues/economy",
      date: "Jul 2026",
    },
    "Immigration": {
      stance: "Agree",
      excerpt: "Someone who's worked here for a decade with a clean record has earned a path to citizenship, not another decade in limbo.",
      sourceTitle: "Immigration — Marchetti for Congress",
      sourceType: "Campaign site",
      sourceUrl: "https://delioforcongress.example/issues/immigration",
      date: "Aug 2026",
    },
    "Reproductive rights": {
      stance: "Disagree",
      excerpt: "That decision belongs to a patient and their doctor. I'll never vote for a nationwide ban.",
      sourceTitle: "Marchetti Statement on Reproductive Rights",
      sourceType: "Official press release",
      sourceUrl: "https://marchetti.house.gov.example/press/reproductive-rights-statement",
      date: "Apr 2026",
    },
  },
  wexler: {
    "Healthcare": {
      stance: "Disagree",
      excerpt: "Phasing out private insurance means phasing out choice. I'll never vote for that.",
      sourceTitle: "Where Grant Stands",
      sourceType: "Campaign site",
      sourceUrl: "https://wexlerforcongress.example/platform",
      date: "May 2026",
    },
    "Climate": {
      stance: "Disagree",
      excerpt: "You don't ban a technology before you've built the replacement — that's how you get blackouts, not a cleaner grid.",
      sourceTitle: "Where Grant Stands — Energy",
      sourceType: "Campaign site",
      sourceUrl: "https://wexlerforcongress.example/platform/energy",
      date: "May 2026",
    },
    "Guns": {
      stance: "Disagree",
      excerpt: "A ban disarms law-abiding owners and does nothing to the people who ignore gun laws already.",
      sourceTitle: "Where Grant Stands — Second Amendment",
      sourceType: "Campaign site",
      sourceUrl: "https://wexlerforcongress.example/platform/second-amendment",
      date: "Jun 2026",
    },
  },
  ainsley: {
    // No official position found on Healthcare — the city funds clinics but
    // Ainsley has not staked out a position beyond deferring to the county.
    "Housing": {
      stance: "Agree",
      excerpt: "We upzoned three corridors and cut review time to 30 days. I'd take that citywide if state law let me.",
      sourceTitle: "State of the City: Housing & Growth",
      sourceType: "Official government site",
      sourceUrl: "https://austintexas.gov.example/mayor/state-of-the-city-housing-growth",
      date: "Mar 2026",
    },
    "Voting rights": {
      stance: "Disagree",
      excerpt: "Fifteen new early voting sites did more for turnout than an ID requirement would ever do for security.",
      sourceTitle: "Mayor Ainsley Expands Early Voting Access",
      sourceType: "Official press release",
      sourceUrl: "https://austintexas.gov.example/news/early-voting-expansion",
      date: "Sep 2025",
    },
    "Climate": {
      stance: "Agree",
      excerpt: "The municipal fleet goes fully electric on schedule. I'd back a 2035 deadline citywide if the state let cities set one.",
      sourceTitle: "State of the City address",
      sourceType: "Official press release",
      sourceUrl: "https://austintexas.gov.example/news/state-of-the-city-2026",
      date: "Jan 2026",
    },
    "Transit": {
      stance: "Agree",
      excerpt: "Phase one of the rail expansion opens on budget next year. Transit gets the next dollar before another highway lane does.",
      sourceTitle: "@MayorAinsley",
      sourceType: "Official social media",
      sourceUrl: "https://x.com.example/mayorainsley/status/1234567891",
      date: "Jul 2026",
    },
    "Labor": {
      stance: "Agree",
      excerpt: "Every city contract meets our wage floor now. Twenty dollars federally would just catch the rest of the country up to where Austin already is.",
      sourceTitle: "Office of the Mayor — Labor",
      sourceType: "Official government site",
      sourceUrl: "https://austintexas.gov.example/mayor/labor",
      date: "Feb 2026",
    },
  },
  kohl: {
    "Housing": {
      stance: "Agree",
      excerpt: "Austin needs a housing bond, not more incentive programs — and yes, that means fewer zoning restrictions standing in the way too.",
      sourceTitle: "Priya Kohl for Austin — Housing",
      sourceType: "Campaign site",
      sourceUrl: "https://kohlforaustin.example/housing",
      date: "Jun 2026",
    },
    "Transit": {
      stance: "Disagree",
      excerpt: "I'd freeze the rail budget and put the difference into bus rapid transit we can build in two years, not ten — that's not the same as more highway lanes.",
      sourceTitle: "Kohl campaign platform",
      sourceType: "Official platform document",
      sourceUrl: "https://kohlforaustin.example/files/platform.pdf",
      date: "May 2026",
    },
  },
  // No researched positions yet — every statement falls back to "No
  // record" for this candidate, honestly, same as `GUIDE_POSITIONS`.
  rausch: {},
  vance: {
    "Healthcare": {
      stance: "Neutral",
      excerpt: "Our state Medicaid expansion covers 40,000 more families today. That's the fight I know how to win — I'm not there on eliminating private coverage.",
      sourceTitle: "Where I Stand: Healthcare",
      sourceType: "Official platform document",
      sourceUrl: "https://vanceforsenate.example/where-i-stand/healthcare",
      date: "Jan 2026",
    },
    "Housing": {
      stance: "Agree",
      excerpt: "I support building more supply, and ending single-family-only zoning is one of the clearest ways to do it.",
      sourceTitle: "Where I Stand: Housing",
      sourceType: "Official platform document",
      sourceUrl: "https://vanceforsenate.example/where-i-stand/housing",
      date: "Jan 2026",
    },
    "Climate": {
      stance: "Agree",
      excerpt: "The coastal resilience fund I sponsored is state law now. A 2035 deadline is the next honest step.",
      sourceTitle: "Texas Senate Bill 812 — sponsor statement",
      sourceType: "Official government site",
      sourceUrl: "https://senate.texas.gov.example/members/dist14/sb812",
      date: "May 2025",
    },
    "Labor": {
      stance: "Neutral",
      excerpt: "I'll back a statewide wage floor, but I haven't committed to a specific number as high as $20 yet — that fight isn't finished for me.",
      sourceTitle: "Where I Stand: Labor",
      sourceType: "Official platform document",
      sourceUrl: "https://vanceforsenate.example/where-i-stand/labor",
      date: "Jan 2026",
    },
    "Voting rights": {
      stance: "Disagree",
      excerpt: "I blocked the mail-ballot restrictions on the floor, and I'd block an ID mandate stacked on top of it too.",
      sourceTitle: "Vance campaign platform",
      sourceType: "Official platform document",
      sourceUrl: "https://vanceforsenate.example/files/platform.pdf",
      date: "Jun 2026",
    },
    "Water": {
      stance: "Agree",
      excerpt: "The same resilience-fund approach I used on the coast belongs on our lead lines — a ten-year deadline is reasonable if the state helps pay for it.",
      sourceTitle: "Where I Stand: Infrastructure",
      sourceType: "Official platform document",
      sourceUrl: "https://vanceforsenate.example/where-i-stand/infrastructure",
      date: "Aug 2026",
    },
  },
  torrance: {
    "Healthcare": {
      stance: "Disagree",
      excerpt: "I opposed the Medicaid expansion on cost grounds. A federal guarantee that phases out private insurance is a much bigger version of the same mistake.",
      sourceTitle: "Torrance for Senate — Healthcare",
      sourceType: "Campaign site",
      sourceUrl: "https://torranceforsenate.example/healthcare",
      date: "May 2026",
    },
    "Housing": {
      stance: "Agree",
      excerpt: "Single-family zoning is a government mandate on what you're allowed to build. Getting rid of it is getting government out of the way — I'm for that.",
      sourceTitle: "Torrance campaign platform",
      sourceType: "Official platform document",
      sourceUrl: "https://torranceforsenate.example/files/platform.pdf",
      date: "May 2026",
    },
    "Voting rights": {
      stance: "Agree",
      excerpt: "Voter ID isn't suppression, it's security. I sponsored the bill and I'd sponsor it again.",
      sourceTitle: "Torrance for Senate — Election Integrity",
      sourceType: "Campaign site",
      sourceUrl: "https://torranceforsenate.example/election-integrity",
      date: "Jun 2026",
    },
    "Education": {
      stance: "Agree",
      excerpt: "Every parent deserves a voucher option if their zoned school isn't working for their kid.",
      sourceTitle: "Torrance campaign platform",
      sourceType: "Official platform document",
      sourceUrl: "https://torranceforsenate.example/files/platform.pdf",
      date: "May 2026",
    },
    "Guns": {
      stance: "Disagree",
      excerpt: "A ban on lawfully-owned rifles is a nonstarter for me — I'll defend the Second Amendment every time this comes to the floor.",
      sourceTitle: "Torrance for Senate — Second Amendment",
      sourceType: "Campaign site",
      sourceUrl: "https://torranceforsenate.example/second-amendment",
      date: "Jul 2026",
    },
  },
  oseihart: {
    "Healthcare": {
      stance: "Neutral",
      excerpt: "I've held the hospital district levy flat three years running. That's a county budget fight, not a position on restructuring national insurance.",
      sourceTitle: "County Judge — Hospital District Levy",
      sourceType: "Official government site",
      sourceUrl: "https://traviscountytx.gov.example/judge/hospital-district-levy",
      date: "Oct 2025",
    },
    "Criminal justice": {
      stance: "Agree",
      excerpt: "The diversion pilot keeps people housed instead of jailed over unpaid fines. Ending cash bail for nonviolent charges is the next logical step.",
      sourceTitle: "County Judge — Housing & Justice",
      sourceType: "Official government site",
      sourceUrl: "https://traviscountytx.gov.example/judge/housing-justice",
      date: "Mar 2026",
    },
    "Labor": {
      stance: "Agree",
      excerpt: "Every county contractor already meets our wage floor. No exceptions, no waivers — $20 federally would just make that the national norm.",
      sourceTitle: "Commissioners Court press release",
      sourceType: "Official press release",
      sourceUrl: "https://traviscountytx.gov.example/news/contractor-wage-floor",
      date: "Nov 2025",
    },
    "Voting rights": {
      stance: "Disagree",
      excerpt: "Two new ballot drop sites did more for access than an ID mandate would ever do for security.",
      sourceTitle: "Commissioners Court press release",
      sourceType: "Official press release",
      sourceUrl: "https://traviscountytx.gov.example/news/ballot-drop-sites",
      date: "Sep 2025",
    },
    "Water": {
      stance: "Agree",
      excerpt: "We're already mapping every lead line in the county. A ten-year public-expense deadline is achievable if the funding shows up with it.",
      sourceTitle: "County Judge — Infrastructure",
      sourceType: "Official government site",
      sourceUrl: "https://traviscountytx.gov.example/judge/infrastructure",
      date: "Aug 2026",
    },
  },
  // No researched positions yet — same as `rausch` above.
  trask: {},
  bellweather: {
    "Healthcare": {
      stance: "Agree",
      excerpt: "Nine campuses now have a school-based clinic. Every kid deserves that kind of guaranteed access, not just the ones in my district.",
      sourceTitle: "School-Based Health Clinics Update",
      sourceType: "Official press release",
      sourceUrl: "https://bellweatherfortrustee.example/press/school-based-health-clinics-update",
      date: "Sep 2025",
    },
    "Housing": {
      stance: "Neutral",
      excerpt: "Teacher housing on district land is the tool I know works. I haven't taken a position on zoning outside the district's own remit.",
      sourceTitle: "@BellweatherForD4",
      sourceType: "Official social media",
      sourceUrl: "https://x.com.example/bellweatherford4/status/9876543211",
      date: "Jul 2026",
    },
    "Climate": {
      stance: "Agree",
      excerpt: "Twelve campuses are on solar now, and every new build goes solar by default. A 2035 deadline is the direction we're already headed.",
      sourceTitle: "District 4 trustee platform",
      sourceType: "Official platform document",
      sourceUrl: "https://bellweatherfortrustee.example/files/platform.pdf",
      date: "May 2026",
    },
    "Labor": {
      stance: "Agree",
      excerpt: "I negotiated the aide wage floor up to $22 an hour. A $20 federal floor is overdue everywhere else.",
      sourceTitle: "Bellweather Announces Aide Wage Agreement",
      sourceType: "Official press release",
      sourceUrl: "https://bellweatherfortrustee.example/press/aide-wage-agreement",
      date: "Aug 2025",
    },
    "Education": {
      stance: "Disagree",
      excerpt: "We stopped the voucher pilot at the board and I'll stop the next version too. Public dollars belong in public schools.",
      sourceTitle: "Bellweather for School Board",
      sourceType: "Campaign site",
      sourceUrl: "https://bellweatherfortrustee.example/issues",
      date: "Jun 2026",
    },
  },
  mora: {
    "Housing": {
      stance: "Disagree",
      excerpt: "Teacher housing sounds nice, but I'd rather see that land sold and the money put straight into aide pay — not tied up in a zoning fight.",
      sourceTitle: "Sal Mora for District 4 — Housing",
      sourceType: "Campaign site",
      sourceUrl: "https://moraford4.example/housing",
      date: "Jun 2026",
    },
    "Education": {
      stance: "Neutral",
      excerpt: "I'd pause the clinic expansion and put that money into aide pay instead. I haven't staked out a position on vouchers either way.",
      sourceTitle: "Sal Mora for District 4",
      sourceType: "Campaign site",
      sourceUrl: "https://moraford4.example/priorities",
      date: "Jun 2026",
    },
  },
  pike: {
    "Healthcare": {
      stance: "Disagree",
      excerpt: "I voted against the subsidy renewal because it grows the deficit without fixing the underlying cost of care. Phasing out private coverage entirely is a much bigger version of that mistake.",
      sourceTitle: "Senator Pike Statement on Health Subsidy Vote",
      sourceType: "Official government site",
      sourceUrl: "https://pike.senate.gov.example/press/health-subsidy-vote",
      date: "Nov 2025",
    },
    // No official position found on Housing — Pike has voted on the topic
    // but has not issued a public statement staking out a position.
    "Climate": {
      stance: "Disagree",
      excerpt: "Emissions targets without a reliability plan are wishful thinking. I'll keep backing LNG as the bridge fuel that actually keeps the lights on — not a ban on what people can buy.",
      sourceTitle: "Senator Pike on Energy Policy",
      sourceType: "Official government site",
      sourceUrl: "https://pike.senate.gov.example/issues/energy-policy",
      date: "Aug 2025",
    },
    "Voting rights": {
      stance: "Agree",
      excerpt: "Ballot integrity and ballot access aren't in conflict. I'll keep backing ID requirements and regular roll maintenance.",
      sourceTitle: "Senator Pike Statement on Election Security",
      sourceType: "Official press release",
      sourceUrl: "https://pike.senate.gov.example/press/election-security-statement",
      date: "Dec 2025",
    },
    "Guns": {
      stance: "Disagree",
      excerpt: "A ban on lawfully-owned rifles punishes the wrong people. I'll defend the Second Amendment on the floor every time.",
      sourceTitle: "Senator Pike on the Second Amendment",
      sourceType: "Official government site",
      sourceUrl: "https://pike.senate.gov.example/issues/second-amendment",
      date: "Jul 2026",
    },
    "Immigration": {
      stance: "Disagree",
      excerpt: "Any pathway that isn't preceded by border security first just repeats the mistake of the last amnesty.",
      sourceTitle: "Senator Pike on Immigration",
      sourceType: "Official government site",
      sourceUrl: "https://pike.senate.gov.example/issues/immigration",
      date: "Jun 2026",
    },
  },
  olamide: {
    "Housing": {
      stance: "Agree",
      excerpt: "We need a statewide renters' bill of rights, and ending exclusionary zoning is part of the same fight.",
      sourceTitle: "Olamide for Senate — Housing",
      sourceType: "Campaign site",
      sourceUrl: "https://olamideforsenate.example/housing",
      date: "Mar 2026",
    },
    "Climate": {
      stance: "Neutral",
      excerpt: "I'd put the state's share of clean-energy credits behind grid batteries first. I haven't taken a position on a vehicle sales ban specifically.",
      sourceTitle: "Olamide for Senate — Climate",
      sourceType: "Campaign site",
      sourceUrl: "https://olamideforsenate.example/climate",
      date: "Feb 2026",
    },
  },
};

/**
 * Sample legislation for HUSH Guide's "Bills Being Considered" section.
 * Illustrative placeholder data, like everything else in this file — there
 * is no Congress.gov / state-legislature / municipal-records integration
 * yet. `explanation`/`yesMeans`/`noMeans` are HUSH's own paraphrase and are
 * kept clearly separate from each bill's official number/title/source in
 * the UI (see BillCard). `sb1` deliberately sets `explainerTooComplex`
 * instead of a summary, demonstrating the "say so rather than guessing"
 * rule for a bill genuinely too dense to paraphrase responsibly — a large
 * appropriations bill amended by floor riders is a realistic case for that.
 * `hr2145` and `sb890` are both federal but at different vote stages
 * (final passage vs. a procedural cloture motion) specifically so the UI's
 * "not just the opposite of each other" and "note when a vote is
 * procedural" rules have a real case each to satisfy. `propAOrdinance` ties
 * to the existing "PROP A · TRANSIT BOND" entry in BALLOT below — it's the
 * council ordinance that put that proposition on the ballot, not a
 * duplicate of it.
 */
export const BILLS: Bill[] = [
  {
    id: "hr2145",
    number: "H.R. 2145",
    title: "Insulin Cost Reduction Act",
    chamber: "U.S. House of Representatives",
    level: "Federal",
    description:
      "Caps out-of-pocket insulin costs for people with private insurance and directs HHS to study extending the cap to the uninsured.",
    voteDate: "Sep 16, 2026",
    voteStage: "Final passage vote",
    explanation:
      "The bill sets a $35-per-month cap on what private insurance plans can charge a patient out of pocket for insulin, starting the plan year after it's signed. It also orders a one-year HHS study on extending a similar cap to people without insurance, but doesn't create that cap itself. The cap applies per insulin prescription filled, not per person, so someone on more than one insulin product would still see more than $35 total in a month.",
    yesMeans: [
      "The $35/month insulin cap becomes law for private insurance plans starting next plan year.",
      "HHS is required to deliver its uninsured-coverage study to Congress within 12 months.",
      "The bill moves to the Senate, where it is not yet scheduled for a vote.",
    ],
    noMeans: [
      "The bill fails in the House and does not move to the Senate in its current form.",
      "No federal cap on insulin out-of-pocket costs takes effect; existing state-level caps (where they exist) are unaffected.",
      "A revised version would need to be reintroduced and pass committee again before another floor vote.",
    ],
    sourceName: "Congress.gov",
    sourceUrl: "https://congress.gov.example/bill/119th-congress/house-bill/2145",
    dateAccessed: "Aug 20, 2026",
    dateUpdated: "Aug 18, 2026",
  },
  {
    id: "sb890",
    number: "S. 890",
    title: "Voting Access Modernization Act",
    chamber: "U.S. Senate",
    level: "Federal",
    description:
      "Would require states to offer at least 14 days of early voting and online voter registration for federal elections.",
    voteDate: "Sep 9, 2026",
    voteStage: "Procedural vote (cloture motion)",
    explanation:
      "This is not a vote on the bill itself. It's a cloture motion — a vote on whether to end debate and allow a final up-or-down vote on the bill to happen at all. Under Senate rules, cloture needs 60 votes to succeed; the bill's actual final-passage vote, if cloture succeeds, would only need a simple majority and would be scheduled separately.",
    yesMeans: [
      "Debate ends and the bill advances to a final passage vote, likely within the following week.",
      "The bill itself is not yet passed — this vote only clears the way for that vote to happen.",
    ],
    noMeans: [
      "Debate continues, but without 60 votes to end it, the bill is effectively blocked from reaching a final vote this session.",
      "The bill is not formally rejected — it simply cannot come to a final vote under current Senate rules — so a later cloture attempt is possible.",
    ],
    sourceName: "Congress.gov",
    sourceUrl: "https://congress.gov.example/bill/119th-congress/senate-bill/890",
    dateAccessed: "Aug 20, 2026",
    dateUpdated: "Aug 14, 2026",
  },
  {
    id: "hb455",
    number: "Texas HB 455",
    title: "Renters' Notice and Cure Act",
    chamber: "Texas House of Representatives",
    level: "State",
    description:
      "Would require landlords to give tenants a written notice and a set period to fix a lease violation before starting an eviction over that violation.",
    voteDate: "Sep 22, 2026",
    voteStage: "Committee vote (House Business & Industry Committee)",
    explanation:
      "This is a committee vote on whether to send the bill to the full House floor, not a final passage vote. The bill as written would require landlords to give tenants a written notice describing the alleged lease violation and a minimum 10-day period to fix it before filing an eviction based on that violation. It applies to violations like late fees or unauthorized pets — it does not apply to nonpayment of rent, which the bill leaves under existing eviction timelines.",
    yesMeans: [
      "The bill advances out of committee to the full Texas House, where it can be scheduled for a floor vote.",
      "The 10-day notice-and-cure requirement is not yet law — it still needs to pass the House, the Senate, and be signed.",
    ],
    noMeans: [
      "The bill dies in committee for this session unless a member forces a discharge vote to bring it to the floor anyway.",
      "Current Texas eviction notice rules stay unchanged.",
    ],
    sourceName: "Texas Legislature Online",
    sourceUrl: "https://capitol.texas.gov.example/billlookup/history.aspx?legsess=90r&bill=hb455",
    dateAccessed: "Aug 19, 2026",
    dateUpdated: "Aug 11, 2026",
  },
  {
    id: "sb1",
    number: "Texas SB 1",
    title: "General Appropriations Act — Article II Floor Amendments",
    chamber: "Texas State Senate",
    level: "State",
    description:
      "The state's two-year budget bill, as amended by more than 40 floor amendments to its Article II (health and human services) spending.",
    voteDate: "Sep 24, 2026",
    voteStage: "Final passage vote",
    explainerTooComplex: true,
    sourceName: "Texas Legislature Online",
    sourceUrl: "https://capitol.texas.gov.example/billlookup/history.aspx?legsess=90r&bill=sb1",
    dateAccessed: "Aug 19, 2026",
    dateUpdated: "Aug 17, 2026",
  },
  {
    id: "prop-a-ordinance",
    number: "Austin Ordinance 20260812-014",
    title: "Ordinance Ordering a Transit Bond Election (Proposition A)",
    chamber: "Austin City Council",
    level: "Local",
    description:
      "The council action that placed the transit general-obligation-bond measure on the November 3 ballot as Proposition A.",
    voteStage: "Final passage vote (already adopted — placed the measure on the ballot)",
    explanation:
      "This ordinance doesn't authorize any spending itself. It's the procedural step the council used to call an election asking voters to decide on the transit bond — the bond only takes effect if voters approve Proposition A itself on the November 3 ballot. The ordinance also sets the ballot language and ballot order for Proposition A.",
    yesMeans: [
      "The transit bond measure is placed on the Nov 3 ballot as Proposition A, with the ballot language and order this ordinance sets.",
      "It does not itself authorize any bond spending — that authorization depends entirely on how voters decide Proposition A.",
    ],
    noMeans: [
      "The transit bond measure would not appear on the Nov 3 ballot this cycle.",
      "The council could revise and re-adopt a new ordinance for a future election instead.",
    ],
    sourceName: "City of Austin — Official Records",
    sourceUrl: "https://austintexas.gov.example/records/ordinances/20260812-014",
    dateAccessed: "Aug 21, 2026",
    dateUpdated: "Aug 12, 2026",
  },
];

export const BALLOT: BallotItem[] = [
  {
    "race": "U.S. House · TX-35",
    "candidates": "Marchetti (D) · Wexler (R)",
    "level": "Federal",
    "state": "Reviewed",
    "politicianId": "marchetti"
  },
  {
    "race": "U.S. Senate · TX",
    "candidates": "Prause (R) · Olamide (D)",
    "level": "Federal",
    "state": "Needs review",
    "politicianId": "pike"
  },
  {
    "race": "State Senate · D-14",
    "candidates": "Vance (D) · Torrance (R)",
    "level": "State",
    "state": "Reviewed",
    "politicianId": "vance"
  },
  {
    "race": "Mayor of Austin",
    "candidates": "Ainsley (I) · Kohl (D) · Rausch (R)",
    "level": "Local",
    "state": "Needs review",
    "politicianId": "ainsley"
  },
  {
    "race": "County Judge",
    "candidates": "Osei-Hart (D) · Trask (R)",
    "level": "Local",
    "state": "Reviewed",
    "politicianId": "oseihart"
  },
  {
    "race": "Prop A · Transit bond",
    "candidates": "For · Against",
    "level": "Local",
    "state": "No match yet",
    "politicianId": "ainsley"
  }
];

export const TRENDING: TrendingClaim[] = [
  {
    "text": "Prause's rent claim, repeated in three debates",
    "meta": "47 checks · False",
    "dot": "#9C3F32"
  },
  {
    "text": "Clinic funding attribution",
    "meta": "31 checks · True",
    "dot": "#253746"
  },
  {
    "text": "Transit budget framing",
    "meta": "28 checks · Misleading",
    "dot": "#B5A88A"
  },
  {
    "text": "Voucher pilot enrollment numbers",
    "meta": "22 checks · Misleading",
    "dot": "#B5A88A"
  },
  {
    "text": "State reserve record claim",
    "meta": "19 checks · False",
    "dot": "#9C3F32"
  }
];

/** Verdict tallies shown on the fact-check filter pills. */
export const VERDICT_COUNTS: Record<string, number> = {
  All: FACT_CHECKS.length,
  True: 96,
  Misleading: 71,
  False: 47,
};

/** Election the prototype counts down to. */
export const ELECTION_ISO = "2026-11-03T19:00:00-06:00";

export const KEY_DATES = [
  { label: "Register by", value: "Oct 5" },
  { label: "Early voting", value: "Oct 19 - 30" },
  { label: "Mail ballot request", value: "Oct 23" },
];

/** Default district context shown in the sidebar until a real lookup runs. */
export const DEFAULT_DISTRICT = {
  zip: "78701",
  district: "TX-35",
  county: "Travis County",
  raceCount: 6,
  city: "Austin, TX",
};

/**
 * Small hand-seeded ZIP -> district lookup, standing in for a real
 * ZIP-to-district geocoding dataset. Covers a handful of sample ZIPs (all
 * within the Austin/Travis County area the rest of the seed data is set in)
 * so the sidebar district card can react to a real entered ZIP instead of
 * always showing DEFAULT_DISTRICT. Anything outside this set has no entry —
 * see `lookupDistrict`, which returns undefined rather than a stale guess.
 */
export const ZIP_DISTRICTS: Record<
  string,
  { district: string; county: string; raceCount: number; city: string }
> = {
  "78701": { district: "TX-35", county: "Travis County", raceCount: 6, city: "Austin, TX" },
  "78702": { district: "TX-35", county: "Travis County", raceCount: 5, city: "Austin, TX" },
  "78703": { district: "TX-25", county: "Travis County", raceCount: 6, city: "Austin, TX" },
  "78704": { district: "TX-25", county: "Travis County", raceCount: 7, city: "Austin, TX" },
  "78745": { district: "TX-25", county: "Travis County", raceCount: 6, city: "Austin, TX" },
  "78751": { district: "TX-35", county: "Travis County", raceCount: 5, city: "Austin, TX" },
  "78758": { district: "TX-35", county: "Travis County", raceCount: 4, city: "Austin, TX" },
};

/** Looks up district context for a ZIP. Returns undefined for any ZIP not seeded above. */
export function lookupDistrict(zip: string) {
  return ZIP_DISTRICTS[zip];
}

export const DEFAULT_POLLING_PLACE = {
  name: "Carver Branch Library",
  detail: "1161 Angelina St - 0.6 mi - Open 7am-7pm on election day",
};
