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
    "match": 94,
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
        "stance": "Backs a public insurance option and caps on out-of-pocket prescription costs.",
        "align": 96
      },
      {
        "issue": "Housing",
        "stance": "Supports federal density incentives and a renter's tax credit.",
        "align": 91
      },
      {
        "issue": "Climate",
        "stance": "Voted for grid resilience; declined to back a fossil subsidy phase-out.",
        "align": 74
      },
      {
        "issue": "Labor",
        "stance": "Co-sponsored sectoral bargaining rules for service workers.",
        "align": 88
      },
      {
        "issue": "Voting rights",
        "stance": "Supports automatic registration and restoring pre-clearance review.",
        "align": 93
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
    "match": 88,
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
        "stance": "Led the state Medicaid expansion push through two sessions.",
        "align": 92
      },
      {
        "issue": "Housing",
        "stance": "Backs supply reform; has not supported tenant protections.",
        "align": 66
      },
      {
        "issue": "Climate",
        "stance": "Sponsored the coastal resilience fund and grid weatherization.",
        "align": 90
      },
      {
        "issue": "Labor",
        "stance": "Supports a wage floor but not sectoral bargaining.",
        "align": 71
      },
      {
        "issue": "Voting rights",
        "stance": "Voted no on every mail-ballot restriction this session.",
        "align": 95
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
    "name": "Sen. Harold Pike",
    "office": "U.S. Senator",
    "district": "Texas",
    "level": "Federal",
    "party": "R",
    "since": 2013,
    "match": 34,
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
        "stance": "Voted against subsidy renewal three times.",
        "align": 18
      },
      {
        "issue": "Housing",
        "stance": "Opposes federal preemption of local zoning.",
        "align": 24
      },
      {
        "issue": "Climate",
        "stance": "Calls emissions targets unworkable; backs LNG expansion.",
        "align": 12
      },
      {
        "issue": "Labor",
        "stance": "No floor votes on labor bills since 2023.",
        "align": 30
      },
      {
        "issue": "Voting rights",
        "stance": "Backs stricter ID and roll-maintenance rules.",
        "align": 15
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
    "match": 81,
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
        "stance": "Funds city clinics; defers to county on coverage.",
        "align": 70
      },
      {
        "issue": "Housing",
        "stance": "Upzoned three corridors in first term.",
        "align": 84
      },
      {
        "issue": "Climate",
        "stance": "Fleet electrification on schedule.",
        "align": 78
      },
      {
        "issue": "Labor",
        "stance": "Signed the city prevailing wage order.",
        "align": 74
      },
      {
        "issue": "Voting rights",
        "stance": "Expanded early voting sites citywide.",
        "align": 86
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
    "match": 79,
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
        "stance": "Expanded school-based clinics to nine campuses.",
        "align": 88
      },
      {
        "issue": "Housing",
        "stance": "Backs teacher housing on district land.",
        "align": 76
      },
      {
        "issue": "Climate",
        "stance": "Solar on 12 campuses since 2019.",
        "align": 80
      },
      {
        "issue": "Labor",
        "stance": "Negotiated the aide wage floor.",
        "align": 90
      },
      {
        "issue": "Voting rights",
        "stance": "Opened all campuses as polling sites.",
        "align": 84
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
    "match": 74,
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
        "stance": "Kept the county hospital district levy flat.",
        "align": 78
      },
      {
        "issue": "Housing",
        "stance": "Funded a homelessness diversion pilot.",
        "align": 72
      },
      {
        "issue": "Climate",
        "stance": "Adopted the county resilience plan.",
        "align": 68
      },
      {
        "issue": "Labor",
        "stance": "Raised county contractor wage floor.",
        "align": 75
      },
      {
        "issue": "Voting rights",
        "stance": "Expanded ballot drop sites.",
        "align": 80
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
    "match": 41,
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
        "stance": "Opposed Medicaid expansion; backs price transparency.",
        "align": 34
      },
      {
        "issue": "Housing",
        "stance": "Supports supply reform, opposes mandates.",
        "align": 52
      },
      {
        "issue": "Climate",
        "stance": "Voted for weatherization, against targets.",
        "align": 40
      },
      {
        "issue": "Labor",
        "stance": "Supports right-to-work protections.",
        "align": 28
      },
      {
        "issue": "Voting rights",
        "stance": "Sponsored stricter ID rules.",
        "align": 22
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
    "match": 22,
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
        "stance": "Scores expansion as unaffordable.",
        "align": 16
      },
      {
        "issue": "Housing",
        "stance": "No published position.",
        "align": 30
      },
      {
        "issue": "Climate",
        "stance": "Opposes fund divestment screens.",
        "align": 14
      },
      {
        "issue": "Labor",
        "stance": "Opposes prevailing wage rules.",
        "align": 20
      },
      {
        "issue": "Voting rights",
        "stance": "No published position.",
        "align": 28
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
        "party": "D",
        "align": 94
      },
      {
        "politicianId": "wexler",
        "name": "Grant Wexler (R)",
        "party": "R",
        "align": 21
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
        "party": "I",
        "align": 81
      },
      {
        "politicianId": "kohl",
        "name": "Priya Kohl (D)",
        "party": "D",
        "align": 76
      },
      {
        "politicianId": "rausch",
        "name": "Ed Rausch (R)",
        "party": "R",
        "align": 29
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
        "party": "D",
        "align": 88
      },
      {
        "politicianId": "torrance",
        "name": "Clay Torrance (R)",
        "party": "R",
        "align": 41
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
        "party": "D",
        "align": 74
      },
      {
        "politicianId": "trask",
        "name": "Bill Trask (R)",
        "party": "R",
        "align": 33
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
        "party": "D",
        "align": 79
      },
      {
        "politicianId": "mora",
        "name": "Sal Mora (I)",
        "party": "I",
        "align": 44
      }
    ]
  }
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
    "candidates": "Pike (R) · Olamide (D)",
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
    "text": "Pike's rent claim, repeated in three debates",
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
