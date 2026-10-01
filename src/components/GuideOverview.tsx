import { C, cond } from "@/lib/theme";
import { MK } from "@/lib/marketingTheme";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingTitleBar } from "@/components/marketing/TitleBar";
import { ClosingQuote } from "@/components/marketing/ClosingQuote";
import { SectionLabel } from "@/components/marketing/SectionLabel";
import { APP_SAMPLE as APP } from "@/lib/appSampleTheme";
import { SampleCaption, SampleCard, SampleKicker } from "@/components/marketing/AppSample";

const RACES = [
  { name: "U.S. Senate", sub: "2 candidates" },
  { name: "U.S. House, FL-04", sub: "2 candidates" },
  { name: "State Senate, District 4", sub: "3 candidates" },
  { name: "State House, District 12", sub: "2 candidates" },
];

const AMENDMENTS = [
  { name: "Recreational Cannabis", sub: "Amendment 1 · State" },
  { name: "Homestead Property Tax Exemption", sub: "Amendment 2 · State" },
  { name: "Minimum Wage Inflation Adjustment", sub: "Amendment 3 · State" },
  { name: "County Transit Sales Tax", sub: "Measure A · County" },
];

function HealthcareIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}
function ImmigrationIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
    </svg>
  );
}
function EconomyIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 20V14M10 20V10M15 20V6M20 20V3M3 20h19" />
    </svg>
  );
}
function EducationIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9l10-5 10 5-10 5z" />
      <path d="M6 11v5c3 2 9 2 12 0v-5" />
    </svg>
  );
}
function HousingIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

const ISSUES = [
  { rank: 1, name: "Healthcare", desc: "Coverage, prescription costs, insurance protections, and access to care.", Icon: HealthcareIcon },
  { rank: 2, name: "Immigration", desc: "Border policy, legal immigration, enforcement, and pathways to citizenship.", Icon: ImmigrationIcon },
  { rank: 3, name: "Economy", desc: "Jobs, inflation, wages, taxes, and the cost of living.", Icon: EconomyIcon },
  { rank: 4, name: "Education", desc: "School funding, curriculum, teacher policy, and student outcomes.", Icon: EducationIcon },
  { rank: 5, name: "Housing", desc: "Home prices, rent, affordability, supply, and property costs.", Icon: HousingIcon },
];

type StanceCellData = { quote?: string; summary?: string; source?: string };

const STANCE_ROWS: { issue: string; tag: string; a: StanceCellData; b: StanceCellData }[] = [
  {
    issue: "Healthcare",
    tag: "Your #1 Issue",
    a: { quote: "I support lowering drug costs by expanding competition among…", source: "Feb 2026" },
    b: { quote: "Medicare should be able to negotiate the price of every prescription…", source: "Apr 2026" },
  },
  {
    issue: "Economy",
    tag: "Your #2 Issue",
    a: { quote: "Cut the red tape that keeps small businesses from hiring…", source: "Mar 2026" },
    b: { summary: "Supports a higher state minimum wage" },
  },
  {
    issue: "Housing",
    tag: "Your #3 Issue",
    a: { quote: "Local communities, not Tallahassee, should decide what gets built…", source: "Feb 2026" },
    b: { quote: "We need to build more homes near jobs and transit, and cut the…", source: "May 2026" },
  },
];

const BILLS = [
  {
    tag: "State",
    no: "Amendment 1",
    title: "Recreational Cannabis Amendment",
    desc: "This amendment would let adults 21 and older legally buy and use cannabis for any reason, not only with a medical recommendation, and would…",
    passes: "60% to pass",
  },
  {
    tag: "State",
    no: "Amendment 2",
    title: "Homestead Property Tax Exemption",
    desc: "Homeowners already get a property tax exemption on their primary residence. This amendment adds a second exemption on top of it, which would…",
    passes: "60% to pass",
  },
  {
    tag: "State",
    no: "Amendment 3",
    title: "Minimum Wage Inflation Adjustment",
    desc: "The state minimum wage is already set to rise under a prior law. This measure would tie it to inflation every year after that, so it…",
    passes: "60% to pass",
  },
  {
    tag: "County",
    no: "Measure A",
    title: "County Transit Sales Tax",
    desc: "This measure raises the local sales tax by half a cent for 20 years, with the new money legally restricted to buses and transit…",
    passes: "a simple majority to pass",
  },
];

// ---------------------------------------------------------------------
// Section 1: title bar is rendered directly in GuideOverview() below,
// via the shared MarketingTitleBar (the highlight sits on the first word
// here -- "Every race on your ballot." -- unlike Our Story/How It Works,
// which highlight the last word).
// ---------------------------------------------------------------------

// Section 2: Your ballot at a glance ------------------------------------

function AppHeaderSample() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderBottom: `1px solid ${APP.border}`, background: APP.bg }}>
      <span style={{ position: "relative", display: "flex", alignItems: "baseline", flex: "none", fontFamily: cond, fontSize: 13, letterSpacing: "0.18em", color: C.ink }}>
        HUSH<span style={{ color: C.rust, letterSpacing: 0 }}>.</span>
        <span aria-hidden style={{ position: "absolute", left: 0, bottom: -6, width: 12, height: 2, background: C.rust, display: "block" }} />
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 9, flex: "none", fontSize: 9.5, color: C.ink, whiteSpace: "nowrap" }}>
        <span>Feed</span>
        <span style={{ paddingBottom: 2, borderBottom: `1.5px solid ${C.rust}` }}>HUSH. Guide</span>
        <span>Stance Check</span>
        <span>Politicians</span>
      </span>
      <span
        style={{
          flex: 1,
          minWidth: 64,
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: APP.fieldFill,
          border: `1px solid ${APP.fieldBorder}`,
          borderRadius: 4,
          padding: "4px 8px",
          fontSize: 8.5,
          color: APP.searchPlaceholder,
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        <span style={{ fontSize: 8 }}>⚲</span>
        <span style={{ overflow: "hidden", textOverflow: "clip" }}>Search</span>
      </span>
      <span style={{ flex: "none", width: 20, height: 20, border: `1px solid ${MK.rule}`, borderRadius: 4, background: APP.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={MK.mutedDark} strokeWidth="2.2">
          <path d="M6 16V11a6 6 0 0112 0v5l2 2H4z" />
          <path d="M10 20a2 2 0 004 0" />
        </svg>
      </span>
      <span style={{ flex: "none", width: 20, height: 20, borderRadius: 4, background: C.ink, color: "#FFFFFF", fontFamily: cond, fontSize: 7.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
        JR
      </span>
    </div>
  );
}

function BallotListCard({ title, rows }: { title: string; rows: { name: string; sub: string }[] }) {
  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${APP.border}`, borderRadius: 5, padding: "9px 10px 4px" }}>
      <span style={{ display: "block", fontSize: 10, fontWeight: 700, color: C.rust, marginBottom: 2 }}>{title}</span>
      {rows.map((row) => (
        <div key={row.name} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8, alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${MK.paperAlt}` }}>
          <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.name}</span>
            <span style={{ fontSize: 9.5, color: MK.muted }}>{row.sub}</span>
          </span>
          <span style={{ fontSize: 11, color: C.rust }}>→</span>
        </div>
      ))}
    </div>
  );
}

function LaptopPreview() {
  return (
    <div>
      <div style={{ background: C.ink, borderRadius: "14px 14px 0 0", padding: "12px 12px 0" }}>
        <div style={{ background: APP.bg, borderRadius: "4px 4px 0 0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <AppHeaderSample />
          <div style={{ padding: "16px 18px 14px", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
              <div>
                <span style={{ display: "block", fontSize: 15, lineHeight: 1.1, fontFamily: cond, fontWeight: 400, letterSpacing: "0.005em", color: C.ink }}>
                  Your ballot at a glance
                </span>
                <span style={{ display: "block", marginTop: 3, fontSize: 9.5, color: MK.muted }}>Your races. Your top issues. Direct quotes, real sources.</span>
              </div>
              <span style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
                <span style={{ fontSize: 9.5, color: C.ink }}>Jacksonville, FL</span>
                <span style={{ fontSize: 9, border: `1px solid ${MK.rule}`, background: "#FFFFFF", padding: "2px 6px", borderRadius: 3 }}>Change</span>
              </span>
            </div>
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr)) auto", border: `1px solid ${APP.border}`, background: "#FFFFFF", borderRadius: 5, alignItems: "center" }}>
              <span style={{ padding: "9px 6px", textAlign: "center", borderRight: `1px solid ${MK.paperAlt}` }}>
                <span style={{ display: "block", fontSize: 16, fontFamily: cond, fontWeight: 400, letterSpacing: "0.005em", color: C.rust }}>34</span>
                <span style={{ display: "block", fontSize: 8.5, color: MK.muted }}>Days to election</span>
              </span>
              <span style={{ padding: "9px 6px", textAlign: "center", borderRight: `1px solid ${MK.paperAlt}` }}>
                <span style={{ display: "block", fontSize: 16, fontFamily: cond, fontWeight: 400, letterSpacing: "0.005em", color: C.ink }}>9</span>
                <span style={{ display: "block", fontSize: 8.5, color: MK.muted }}>Races on your ballot</span>
              </span>
              <span style={{ padding: "9px 6px", textAlign: "center", borderRight: `1px solid ${MK.paperAlt}` }}>
                <span style={{ display: "block", fontSize: 16, fontFamily: cond, fontWeight: 400, letterSpacing: "0.005em", color: C.ink }}>5</span>
                <span style={{ display: "block", fontSize: 8.5, color: MK.muted }}>Your top issues</span>
              </span>
              <span style={{ padding: "0 8px" }}>
                <span style={{ display: "inline-block", fontSize: 9, fontWeight: 600, background: C.ink, color: "#FFFFFF", padding: "6px 8px", borderRadius: 3, whiteSpace: "nowrap" }}>
                  View full ballot →
                </span>
              </span>
            </div>
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12 }}>
              <BallotListCard title="Your races" rows={RACES} />
              <BallotListCard title="Your amendments" rows={AMENDMENTS} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ height: 12, background: "linear-gradient(#3A3530,#1C1917)", borderRadius: "0 0 12px 12px", margin: "0 -18px" }} />
      <SampleCaption text="Sample ballot for illustration." />
    </div>
  );
}

function AtAGlance() {
  return (
    <section style={{ background: MK.paper, padding: "72px 34px 80px", borderBottom: `1px solid ${MK.rule}` }}>
      <div className="story-two-col" style={{ gridTemplateColumns: "minmax(0,0.8fr) minmax(0,1.2fr)", gap: 56, alignItems: "center" }}>
        <div>
          <SectionLabel>Your ballot at a glance</SectionLabel>
          <h2
            style={{
              margin: "18px 0 0",
              fontFamily: cond,
              fontWeight: 400,
              fontSize: "clamp(32px, 3.6vw, 54px)",
              lineHeight: 0.96,
              textTransform: "uppercase",
              letterSpacing: "-0.005em",
              maxWidth: "13ch",
            }}
          >
            Every race. One place.
          </h2>
          <p style={{ margin: "20px 0 0", fontSize: 17, lineHeight: 1.62, color: MK.body, maxWidth: "40ch" }}>
            Tell us where you vote and what matters to you, and get a clear guide to your ballot, with direct quotes and real sources.
          </p>
          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
            <a
              href="/signup"
              className="guide-cta-light"
              style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 26px", background: C.rust, color: C.ink, fontSize: 15, fontWeight: 700, textDecoration: "none" }}
            >
              Start your guide →
            </a>
            <span style={{ fontSize: 13, color: MK.muted }}>
              Membership required.{" "}
              <a href="/fund-hush" className="marketing-underline-link" style={{ color: C.ink, borderBottom: `1px solid ${C.ink}`, textDecoration: "none" }}>
                See pricing
              </a>
            </span>
          </div>
        </div>
        <LaptopPreview />
      </div>
    </section>
  );
}

// Section 3: How it works (four steps) -----------------------------------

function StepNumber({ n }: { n: string }) {
  return (
    <span
      style={{
        alignSelf: "start",
        fontFamily: cond,
        fontWeight: 400,
        fontSize: "clamp(40px, 3.8vw, 58px)",
        lineHeight: 0.86,
        textTransform: "uppercase",
        letterSpacing: "-0.005em",
        color: C.rust,
      }}
    >
      {n}
    </span>
  );
}

function StepText({ h3, paragraphs, points }: { h3: string; paragraphs: string[]; points: string[] }) {
  return (
    <div style={{ alignSelf: "start", borderLeft: `1px solid ${APP.stepRule}`, paddingLeft: 26, minWidth: 0 }}>
      <h3 style={{ margin: 0, fontFamily: cond, fontWeight: 400, fontSize: "clamp(24px, 2.4vw, 36px)", lineHeight: 0.98, textTransform: "uppercase", letterSpacing: "-0.005em", maxWidth: "15ch" }}>
        {h3}
      </h3>
      {paragraphs.map((p) => (
        <p key={p} style={{ margin: "14px 0 0", fontSize: 16, lineHeight: 1.6, color: MK.body, maxWidth: "44ch" }}>
          {p}
        </p>
      ))}
      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", borderTop: `1px solid ${APP.stepRule}`, maxWidth: "44ch" }}>
        {points.map((pt) => (
          <span key={pt} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "baseline", padding: "11px 0", borderBottom: `1px solid ${MK.rule}`, fontSize: 14.5, lineHeight: 1.5, color: C.ink }}>
            <span aria-hidden style={{ width: 7, height: 7, background: C.rust, display: "block", transform: "translateY(-2px)" }} />
            <span>{pt}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function AddressFormSample() {
  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${MK.rule}`, borderRadius: 10, boxShadow: "0 12px 30px -18px rgba(28,25,23,0.25)", padding: "22px 22px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: C.rust, whiteSpace: "nowrap" }}>Edit address</span>
        <span aria-hidden style={{ flex: 1, height: 1, background: APP.border, display: "block" }} />
      </div>
      <span style={{ display: "block", marginTop: 14, fontSize: 21, lineHeight: 1.1, fontFamily: cond, fontWeight: 400, letterSpacing: "0.005em", color: C.ink }}>
        Confirm your address
      </span>
      <span style={{ display: "block", marginTop: 8, fontSize: 12, lineHeight: 1.55, color: C.ink }}>
        The HUSH. Guide uses this to pull up every race on your ballot. It’s the same address shown at the top of the app, so a change here updates it everywhere.
      </span>
      <div style={{ marginTop: 14 }}>
        <span style={{ display: "block", fontSize: 11, color: MK.mutedDark, marginBottom: 5 }}>Street address (optional)</span>
        <span
          style={{
            display: "block",
            background: APP.fieldFill,
            border: `1px solid ${APP.fieldBorder}`,
            borderRadius: 6,
            padding: "10px 12px",
            fontSize: 13,
            color: APP.searchPlaceholder,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          123 Main St
        </span>
      </div>
      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "minmax(0,1fr) 62px 86px", gap: 10 }}>
        <div>
          <span style={{ display: "block", fontSize: 11, color: MK.mutedDark, marginBottom: 5 }}>City</span>
          <span style={{ display: "block", background: APP.fieldFill, border: `1px solid ${APP.fieldBorder}`, borderRadius: 6, padding: "10px 12px", fontSize: 13, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Jacksonville
          </span>
        </div>
        <div>
          <span style={{ display: "block", fontSize: 11, color: MK.mutedDark, marginBottom: 5 }}>State</span>
          <span style={{ display: "block", background: APP.fieldFill, border: `1px solid ${APP.fieldBorder}`, borderRadius: 6, padding: "10px 12px", fontSize: 13, color: C.ink }}>FL</span>
        </div>
        <div>
          <span style={{ display: "block", fontSize: 11, color: MK.mutedDark, marginBottom: 5 }}>ZIP</span>
          <span style={{ display: "block", background: APP.fieldFill, border: `1px solid ${APP.fieldBorder}`, borderRadius: 6, padding: "10px 12px", fontSize: 13, color: C.ink }}>32202</span>
        </div>
      </div>
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10 }}>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 6, background: C.rust, color: "#FBE9E1", fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Continue
        </span>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 16px", borderRadius: 6, background: "#FFFFFF", border: `1px solid ${APP.fieldBorder}`, color: C.ink, fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Cancel
        </span>
      </div>
    </div>
  );
}

function IssueRankerSample() {
  return (
    <SampleCard>
      <SampleKicker label="Ranked" title="Your Top Issues" />
      <span style={{ display: "block", marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: C.ink }}>
        What matters most to you. Drag to reorder, remove, or add new issues.
      </span>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 7 }}>
        {ISSUES.map((issue) => (
          <div
            key={issue.name}
            style={{
              display: "grid",
              gridTemplateColumns: "38px 20px minmax(0,1fr) auto",
              gap: 10,
              alignItems: "center",
              background: "#FFFFFF",
              border: `1px solid ${issue.rank === 1 ? C.rust : APP.border}`,
              borderRadius: 8,
              padding: "8px 10px 8px 8px",
            }}
          >
            <span style={{ width: 38, height: 38, borderRadius: 7, background: APP.fieldFill, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <issue.Icon />
            </span>
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: APP.fieldFill, fontSize: 9.5, fontWeight: 700, color: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {issue.rank}
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>{issue.name}</span>
              <span style={{ fontSize: 10.5, lineHeight: 1.4, color: MK.body, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{issue.desc}</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 9, color: APP.dragHandle, fontSize: 11 }}>
              <span style={{ letterSpacing: "-1px" }}>⋮⋮</span>
              <span>✕</span>
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 14, alignItems: "center" }}>
        <span style={{ padding: "8px 12px", border: `1px solid ${APP.fieldBorder}`, borderRadius: 5, background: "#FFFFFF", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.ink, whiteSpace: "nowrap" }}>
          Done adding
        </span>
        <span style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 10.5, color: MK.mutedDark }}>5/10 selected</span>
          <span style={{ display: "block", height: 3, background: APP.border, borderRadius: 2, overflow: "hidden" }}>
            <span style={{ display: "block", width: "50%", height: "100%", background: C.rust }} />
          </span>
        </span>
      </div>
      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {["+ Climate", "+ Labor", "+ Criminal justice", "+ Voting rights", "+ Guns"].map((pill) => (
          <span key={pill} style={{ padding: "5px 11px", border: `1px solid ${MK.rule}`, borderRadius: 999, background: "#FFFFFF", fontSize: 11, color: C.ink }}>
            {pill}
          </span>
        ))}
      </div>
    </SampleCard>
  );
}

function StanceCell({ cell }: { cell: StanceCellData }) {
  if (cell.summary) {
    return (
      <div style={{ padding: "10px 12px", borderLeft: `1px solid ${APP.border}`, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <span style={{ fontSize: 11, lineHeight: 1.45, color: C.ink }}>{cell.summary}</span>
        <span style={{ display: "flex" }}>
          <span style={{ fontSize: 10.5, fontWeight: 500, background: APP.tag, color: C.ink, padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>Source</span>
        </span>
      </div>
    );
  }
  return (
    <div style={{ padding: "10px 12px", borderLeft: `1px solid ${APP.border}`, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <span style={{ fontSize: 11, lineHeight: 1.45, fontStyle: "italic", color: C.ink }}>
        “{cell.quote}” <span style={{ fontStyle: "normal", fontSize: 10.5, color: C.rust, textDecoration: "underline" }}>Show more</span>
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10.5, fontWeight: 500, background: APP.tag, color: C.ink, padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>Source</span>
        <span style={{ fontSize: 10, color: MK.muted }}>{cell.source}</span>
        <span style={{ fontSize: 10, color: C.rust }}>Full quote →</span>
      </span>
    </div>
  );
}

function StanceGridSample() {
  return (
    <SampleCard>
      <SampleKicker label="Side by side" title="Stance grid" />
      <div style={{ marginTop: 12, background: "#FFFFFF", border: `1px solid ${APP.border}`, borderRadius: 6, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "92px minmax(0,1fr) minmax(0,1fr)", background: APP.tag }}>
          <span style={{ display: "block" }} />
          <div style={{ padding: "10px 12px", borderLeft: `1px solid ${MK.rule}`, display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
            <span style={{ width: 22, height: 22, borderRadius: 4, background: C.rust, color: "#FFFFFF", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>A</span>
            <span style={{ marginTop: 5, fontSize: 12.5, lineHeight: 1.15, fontFamily: cond, fontWeight: 400, letterSpacing: "0.005em", color: C.ink, whiteSpace: "nowrap" }}>Candidate A</span>
            <span style={{ fontSize: 10, color: MK.muted }}>Republican · U.S. Senate</span>
          </div>
          <div style={{ padding: "10px 12px", borderLeft: `1px solid ${MK.rule}`, display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
            <span style={{ width: 22, height: 22, borderRadius: 4, background: C.ink, color: "#FFFFFF", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>B</span>
            <span style={{ marginTop: 5, fontSize: 12.5, lineHeight: 1.15, fontFamily: cond, fontWeight: 400, letterSpacing: "0.005em", color: C.ink, whiteSpace: "nowrap" }}>Candidate B</span>
            <span style={{ fontSize: 10, color: MK.muted }}>Democrat · U.S. Senate</span>
          </div>
        </div>
        {STANCE_ROWS.map((row) => (
          <div key={row.issue} style={{ display: "grid", gridTemplateColumns: "92px minmax(0,1fr) minmax(0,1fr)", borderTop: `1px solid ${APP.border}` }}>
            <div style={{ background: APP.tag, padding: 10, display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.ink }}>{row.issue}</span>
              <span style={{ fontSize: 9, fontWeight: 500, color: C.rust, background: MK.persimmonTint, padding: "2px 7px", borderRadius: 999, whiteSpace: "nowrap" }}>{row.tag}</span>
            </div>
            <StanceCell cell={row.a} />
            <StanceCell cell={row.b} />
          </div>
        ))}
      </div>
    </SampleCard>
  );
}

function BillCard({ bill }: { bill: (typeof BILLS)[number] }) {
  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${APP.border}`, borderTop: `3px solid ${C.ink}`, borderRadius: 7, padding: "12px 12px 12px", display: "flex", flexDirection: "column", gap: 7, minWidth: 0 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", background: APP.tag, color: C.ink, padding: "3px 7px", borderRadius: 4 }}>{bill.tag}</span>
        <span style={{ fontSize: 10.5, color: MK.mutedDark }}>{bill.no}</span>
      </span>
      <span style={{ fontSize: 12.5, lineHeight: 1.2, fontFamily: cond, fontWeight: 400, letterSpacing: "0.005em", color: C.ink }}>{bill.title}</span>
      <span
        style={{
          fontSize: 10.5,
          lineHeight: 1.5,
          color: C.ink,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {bill.desc}
      </span>
      <span style={{ marginTop: "auto", paddingTop: 8, borderTop: `1px solid ${MK.paperAlt}`, fontSize: 9.5, color: MK.mutedDark }}>Vote: Nov 3, 2026 · Needs {bill.passes}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: C.rust }}>Understand this bill →</span>
    </div>
  );
}

function BillsSample() {
  return (
    <SampleCard>
      <SampleKicker label="On your ballot" title="What you’ll actually be voting on" />
      <div className="guide-bills-grid" style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
        {BILLS.map((bill) => (
          <BillCard key={bill.no} bill={bill} />
        ))}
      </div>
    </SampleCard>
  );
}

function HowItWorksSteps() {
  return (
    <section style={{ background: MK.paperAlt, padding: "76px 34px 40px", borderBottom: `1px solid ${MK.rule}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <SectionLabel color={C.rust}>How it works</SectionLabel>
        <span aria-hidden style={{ flex: 1, height: 1, background: MK.rule, display: "block" }} />
      </div>

      <div id="guide" className="guide-step-row" style={{ scrollMarginTop: 130 }}>
        <StepNumber n="01" />
        <StepText
          h3="Tell us where you vote."
          paragraphs={[
            "Enter your zip and we’ll find your federal, state, and county races. Add your street address when you’re ready for the local ones, since city council, school board, and some measures split inside a single zip code.",
            "It’s the same address everywhere in the app, so change it once and your whole guide updates.",
          ]}
          points={["Zip is enough to start", "Street address unlocks local races", "Never sold or shared"]}
        />
        <div style={{ minWidth: 0 }}>
          <AddressFormSample />
          <SampleCaption text="Sample address for illustration." />
        </div>
      </div>

      <div id="stance" className="guide-step-row" style={{ scrollMarginTop: 130 }}>
        <StepNumber n="02" />
        <StepText
          h3="Choose the issues that matter to you."
          paragraphs={[
            "Pick up to 10 issues and put them in order. Your guide, your feed, and the Stance Check all follow that ranking, so the things you care about most come first.",
            "Priorities change. Drag to reorder, remove what no longer matters, or add something new at any time.",
          ]}
          points={["Up to 10 issues", "Drag to reorder any time", "Not sure? Take our Issues Quiz"]}
        />
        <div style={{ minWidth: 0 }}>
          <IssueRankerSample />
          <SampleCaption text="Sample issues for illustration." />
        </div>
      </div>

      <div id="politicians" className="guide-step-row" style={{ scrollMarginTop: 130 }}>
        <StepNumber n="03" />
        <StepText
          h3="See where they stand."
          paragraphs={[
            "Every candidate on your ballot, side by side on the issues you ranked. Positions are quoted from their own campaign sites, with the page each one came from and the date we pulled it.",
            "Where a card needs a shorter version, the full quote is always one tap away. When a candidate hasn’t said anything on an issue, we show that too.",
          ]}
          points={["Quoted from their own sites", "Source and date on every line", "Blank when they haven’t said"]}
        />
        <div style={{ minWidth: 0 }}>
          <StanceGridSample />
          <SampleCaption text="Sample candidates and quotes, for illustration." />
        </div>
      </div>

      <div id="bills" className="guide-step-row" style={{ scrollMarginTop: 130 }}>
        <StepNumber n="04" />
        <StepText
          h3="Read bills in plain English."
          paragraphs={[
            "Every measure and bill on your ballot, rewritten in everyday language: what it changes, what it costs, and what a yes vote and a no vote actually do.",
            "It’s always labelled as our plain-English version, and the original text is one tap away. We never tell you which way to vote.",
          ]}
          points={["Plain words, no double negatives", "Yes and no, spelled out", "The original, one tap away"]}
        />
        <div style={{ minWidth: 0 }}>
          <BillsSample />
          <SampleCaption text="Sample measures for illustration." />
        </div>
      </div>
    </section>
  );
}

// Section 4: Why the HUSH. Guide is worth it (persimmon band) -----------

function WhyWorthIt() {
  return (
    <section style={{ background: C.rust, color: C.ink, padding: "56px 34px", borderBottom: `1px solid ${C.ink}` }}>
      <div className="story-two-col" style={{ gridTemplateColumns: "minmax(0,1.1fr) minmax(0,0.9fr)", gap: 48, alignItems: "end" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span aria-hidden style={{ width: 44, height: 3, background: C.ink, display: "block" }} />
            <SectionLabel>Why the HUSH. Guide is worth it</SectionLabel>
          </div>
          <h2
            style={{
              margin: "18px 0 0",
              fontFamily: cond,
              fontWeight: 400,
              fontSize: "clamp(34px, 4.2vw, 64px)",
              lineHeight: 0.94,
              textTransform: "uppercase",
              letterSpacing: "-0.005em",
            }}
          >
            The information is public.
            <br />
            The work isn’t.
          </h2>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: C.ink, maxWidth: "42ch" }}>
            You could spend hours finding candidate statements, checking them against the record, and working out which races are even on your ballot. HUSH. does that
            research, keeps it current, and organizes it around your ballot and your issues.
          </p>
          <a
            href="/signup"
            className="guide-cta-band"
            style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 22px", background: C.ink, color: C.onDark, fontSize: 15, fontWeight: 700, textDecoration: "none" }}
          >
            Start your guide →
          </a>
        </div>
      </div>
      <div
        style={{
          marginTop: 36,
          display: "inline-block",
          backgroundImage:
            "linear-gradient(to bottom,rgba(28,25,23,0) 0 4%,rgba(44,40,36,0.9) 4% 16%,rgba(44,40,36,1) 16% 54%,rgba(18,16,14,1) 54% 86%,rgba(28,25,23,0.7) 86% 96%,rgba(28,25,23,0.28) 96% 100%),linear-gradient(96deg,rgba(28,25,23,0.5) 0 1.5%,rgba(28,25,23,1) 4% 92%,rgba(28,25,23,0.45) 99% 100%)",
          clipPath: "polygon(0.5% 7%, 2% 1.6%, 47% 0.2%, 97% 2.2%, 99.6% 8%, 100% 87%, 97.6% 98%, 45% 100%, 2% 97.6%, 0.2% 89%)",
          transform: "rotate(-0.6deg)",
          padding: "8px 32px 22px",
        }}
      >
        <span style={{ display: "block", fontSize: "clamp(20px, 2.3vw, 34px)", lineHeight: 1.08, fontFamily: cond, fontWeight: 400, textTransform: "uppercase", letterSpacing: "-0.005em", color: C.onDark }}>
          You’re not paying for an opinion.
          <br />
          <span style={{ color: C.rust }}>You’re paying for the research.</span>
        </span>
      </div>
    </section>
  );
}

export default function GuideOverview() {
  return (
    <div style={{ background: C.ink }}>
      <MarketingHeader active="how-it-works" />
      <MarketingTitleBar eyebrow="HUSH. Guide" highlight="Every" after="race on your ballot." />
      <AtAGlance />
      <HowItWorksSteps />
      <WhyWorthIt />
      <ClosingQuote
        quote="Democracy cannot succeed unless those who express their choice are prepared to choose wisely."
        attributionName="Franklin D. Roosevelt"
        attributionSource="American Education Week message, 1938"
        line="Choosing wisely starts with knowing who’s on your ballot."
        ctaLabel="Start your guide"
        ctaHref="/signup"
      />
      <MarketingFooter />
    </div>
  );
}
