import { C, cond } from "@/lib/theme";
import { MK } from "@/lib/marketingTheme";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingTitleBar } from "@/components/marketing/TitleBar";
import { ClosingQuote } from "@/components/marketing/ClosingQuote";
import { SectionLabel } from "@/components/marketing/SectionLabel";

// Our Methodology (Step 7) is entirely static copy -- no tabs, filters, or
// answer state -- so this stays a server component. It's deliberately not
// in the header nav (see MarketingHeader below, no `active` passed): the
// spec reaches it only from the footer and from How It Works' "Our
// methodology ->" link, both of which already exist.

const SOURCES = [
  {
    title: "Their own campaign sites",
    body: "Candidate positions are quoted word for word from each candidate’s own website, with the page link and the date we pulled it.",
  },
  {
    title: "Official records",
    body: "Roll-call and committee votes, bill text, and sponsorships, straight from the legislature that recorded them.",
  },
  {
    title: "Public filings",
    body: "Campaign finance reports, financial disclosures, and ethics filings, from the agencies that receive them.",
  },
];

const SOURCES_ACCEPT = [
  "Candidates’ own campaign websites",
  "Official roll-call and committee vote records",
  "Bill text, amendments, and sponsorship records",
  "Full transcripts and unedited recordings",
  "Filings with a government body, including late ones",
  "Court records and formal ethics findings",
];

const SOURCES_REJECT = [
  "Anonymous sources of any kind",
  "Campaign or party press releases, as fact",
  "Another outlet’s reporting as the only source",
  "Social posts without a document behind them",
  "Polling and prediction markets",
  "Opposition research handed to us by a campaign",
];

const STEPS = [
  {
    n: "01",
    title: "Capture",
    body: "A statement, vote, promise, or filing comes in from a public source we monitor: campaign websites, legislative feeds, official sites, and filed documents.",
  },
  {
    n: "02",
    title: "Verify the document",
    body: "We confirm it’s authentic and complete, and archive a copy so the citation still works if the original is taken down.",
  },
  {
    n: "03",
    title: "Isolate the claim",
    body: "The specific, checkable statement is written down word for word. Rhetoric, framing, and predictions are set aside.",
  },
  {
    n: "04",
    title: "Gather the record",
    body: "Every document that bears on the claim is collected, including the ones that cut against what we’d expect to find.",
  },
  {
    n: "05",
    title: "Check it again",
    body: "The claim is worked again from the documents alone before anything is published.",
  },
  {
    n: "06",
    title: "Publish with the file",
    body: "It goes out with every source attached and the date it was published.",
  },
];

const SCORE_ROWS: { n: string; color: string; label: string; body: string }[] = [
  { n: "100", color: C.rust, label: "Kept", body: "They did what they said they would do." },
  { n: "50", color: C.ink, label: "No outcome", body: "A full term went by and nothing was passed or rejected." },
  { n: "0", color: MK.mutedDark, label: "Broken", body: "They voted against something they said they wanted when they ran." },
];

// The page intentionally never says how individual promise scores roll up
// into one overall score -- flagged, not implemented, per the spec's own
// warning ("Not yet decided ... don't add it").
const NEVER_SCORED = ["Party", "Attendance", "Seniority", "Fundraising", "Polling", "Media coverage", "Our own opinion"];

const CORRECTIONS = [
  { title: "Added, never overwritten", body: "The original stays on the page, struck through, with the correction underneath." },
  { title: "Dated and explained", body: "Every correction says when it was made, what changed, and why." },
  { title: "You’re told", body: "If you saved or followed something that changed, you’re notified." },
  { title: "Scores move in public", body: "If a correction changes a HUSH. Score, both the old and new numbers are shown." },
];

function SourcesSection() {
  return (
    <section id="sources" style={{ background: MK.paper, padding: "84px 34px", borderBottom: `1px solid ${MK.rule}`, scrollMarginTop: 130 }}>
      <SectionLabel>Where the information comes from</SectionLabel>
      <h2
        style={{
          margin: "18px 0 0",
          fontFamily: cond,
          fontWeight: 400,
          fontSize: "clamp(32px, 3.6vw, 54px)",
          lineHeight: 0.96,
          textTransform: "uppercase",
          letterSpacing: "-0.005em",
          maxWidth: "18ch",
        }}
      >
        Three places. Nothing secondhand.
      </h2>
      <div className="method-sources-grid" style={{ marginTop: 34 }}>
        {SOURCES.map((s) => (
          <div key={s.title} style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
            <span aria-hidden style={{ width: 11, height: 11, background: C.rust, display: "block" }} />
            <h3 style={{ margin: 0, fontFamily: cond, fontWeight: 400, fontSize: "clamp(18px, 1.6vw, 23px)", lineHeight: 1.02, textTransform: "uppercase", letterSpacing: "-0.005em" }}>
              {s.title}
            </h3>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.58, color: MK.body }}>{s.body}</p>
          </div>
        ))}
      </div>
      <div className="story-two-col" style={{ marginTop: 52, gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ background: MK.card, border: `1px solid ${MK.rule}`, padding: "26px 26px 14px" }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.ink }}>Sources we accept</span>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column" }}>
            {SOURCES_ACCEPT.map((s) => (
              <div key={s} style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: 10, alignItems: "baseline", padding: "11px 0", borderBottom: `1px solid ${MK.rule}` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>✓</span>
                <span style={{ fontSize: 15, lineHeight: 1.5, color: MK.body }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: MK.card, border: `1px solid ${MK.rule}`, padding: "26px 26px 14px" }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.ink }}>Sources we don’t</span>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column" }}>
            {SOURCES_REJECT.map((s) => (
              <div key={s} style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: 10, alignItems: "baseline", padding: "11px 0", borderBottom: `1px solid ${MK.rule}` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.rust }}>✕</span>
                <span style={{ fontSize: 15, lineHeight: 1.5, color: MK.body }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section id="process" style={{ background: MK.paperAlt, padding: "84px 34px", borderBottom: `1px solid ${MK.rule}`, scrollMarginTop: 130 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 28, flexWrap: "wrap" }}>
        <div>
          <SectionLabel>How a claim gets checked</SectionLabel>
          <h2
            style={{
              margin: "18px 0 0",
              fontFamily: cond,
              fontWeight: 400,
              fontSize: "clamp(32px, 3.6vw, 54px)",
              lineHeight: 0.96,
              textTransform: "uppercase",
              letterSpacing: "-0.005em",
              maxWidth: "16ch",
            }}
          >
            Six steps, every time.
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: MK.muted, maxWidth: "40ch" }}>
          Today, one reviewer works every claim. A second, independent reviewer will be added as the team grows.
        </p>
      </div>
      <div style={{ marginTop: 34, display: "flex", flexDirection: "column", borderTop: `2px solid ${C.ink}` }}>
        {STEPS.map((step) => (
          <div key={step.n} className="method-step-row">
            <span className="method-step-num" style={{ fontSize: "clamp(28px, 2.6vw, 40px)", lineHeight: 0.9, fontFamily: cond, fontWeight: 400, textTransform: "uppercase", letterSpacing: "-0.005em", color: C.rust }}>
              {step.n}
            </span>
            <h3 className="method-step-title" style={{ margin: 0, fontFamily: cond, fontWeight: 400, fontSize: "clamp(18px, 1.6vw, 22px)", lineHeight: 1.05, textTransform: "uppercase", letterSpacing: "-0.005em" }}>
              {step.title}
            </h3>
            <p className="method-step-desc" style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: MK.body, maxWidth: "60ch" }}>
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ScoreSection() {
  return (
    <section id="score" style={{ background: MK.paper, padding: "84px 34px", borderBottom: `1px solid ${MK.rule}`, scrollMarginTop: 130 }}>
      <div className="story-two-col" style={{ gridTemplateColumns: "minmax(0,0.85fr) minmax(0,1.15fr)", gap: 56, alignItems: "start" }}>
        <div>
          <SectionLabel>How the HUSH. Score works</SectionLabel>
          <h2 style={{ margin: "18px 0 0", fontFamily: cond, fontWeight: 400, fontSize: "clamp(32px,3.6vw,54px)", lineHeight: 0.96, textTransform: "uppercase", letterSpacing: "-0.005em", maxWidth: "14ch" }}>
            Said versus did, as one number.
          </h2>
          <p style={{ margin: "18px 0 0", fontSize: 17, lineHeight: 1.62, color: MK.body, maxWidth: "46ch", letterSpacing: "-0.008em" }}>
            The HUSH. Score measures how closely a politician’s actions have matched the positions they stated. A high score means they did what they said. It doesn’t mean we think those
            positions are good.
          </p>
          <p style={{ margin: "18px 0 0", fontSize: 17, lineHeight: 1.62, color: MK.body, maxWidth: "46ch", letterSpacing: "-0.008em" }}>
            A score only appears on that politician’s own page, next to the promises and votes it was built from. You’ll never see two politicians’ scores side by side.
          </p>
        </div>
        <div>
          <div style={{ background: MK.card, border: `1px solid ${MK.rule}` }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${MK.rule}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.ink }}>How each promise is scored</span>
            </div>
            {SCORE_ROWS.map((row) => (
              <div key={row.label} style={{ padding: "18px 20px", borderBottom: `1px solid ${MK.rule}`, display: "grid", gridTemplateColumns: "86px minmax(0,1fr)", gap: 20, alignItems: "center" }}>
                <span style={{ fontSize: "clamp(30px,2.8vw,42px)", lineHeight: 0.9, fontFamily: cond, fontWeight: 400, textTransform: "uppercase", letterSpacing: "-0.005em", color: row.color }}>
                  {row.n}
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{row.label}</span>
                  <span style={{ fontSize: 14.5, lineHeight: 1.5, color: MK.body }}>{row.body}</span>
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 22 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.ink }}>Never part of the score</span>
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: "10px 22px" }}>
              {NEVER_SCORED.map((w) => (
                <span key={w} style={{ fontSize: 16, fontWeight: 600, color: MK.muted, textDecoration: "line-through", textDecorationColor: C.rust, textDecorationThickness: 2 }}>
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CorrectionsSection() {
  return (
    <section id="corrections" style={{ background: MK.paperAlt, padding: "84px 34px", borderBottom: `1px solid ${MK.rule}`, scrollMarginTop: 130 }}>
      <div className="story-two-col" style={{ gridTemplateColumns: "minmax(0,0.85fr) minmax(0,1.15fr)", gap: 56, alignItems: "start" }}>
        <div>
          <SectionLabel>When we get it wrong</SectionLabel>
          <h2 style={{ margin: "18px 0 0", fontFamily: cond, fontWeight: 400, fontSize: "clamp(32px,3.6vw,54px)", lineHeight: 0.96, textTransform: "uppercase", letterSpacing: "-0.005em", maxWidth: "12ch" }}>
            Corrections, in public.
          </h2>
          <p style={{ margin: "18px 0 0", fontSize: 17, lineHeight: 1.62, color: MK.body, maxWidth: "42ch", letterSpacing: "-0.008em" }}>
            We don’t quietly edit. Every correction sits on top of the original, where anyone can see it.
          </p>
          <div style={{ marginTop: 28, background: MK.card, border: `1px solid ${MK.rule}`, padding: "22px 22px 24px", maxWidth: 420 }}>
            <span style={{ display: "block", fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.ink }}>Think we got one wrong?</span>
            <span style={{ display: "block", marginTop: 10, fontSize: 15, lineHeight: 1.55, color: MK.body }}>
              Send us the claim and the document that shows it. Every dispute with a primary source gets a written response.
            </span>
            <a
              href="/dispute"
              className="wi-cta-dark"
              style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 10, padding: "13px 20px", background: C.ink, color: C.onDark, fontSize: 14, fontWeight: 700, textDecoration: "none" }}
            >
              <span>File a dispute</span>
              <span>→</span>
            </a>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", borderTop: `2px solid ${C.ink}` }}>
          {CORRECTIONS.map((c) => (
            <div key={c.title} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "baseline", padding: "20px 0", borderBottom: `1px solid ${MK.rule}` }}>
              <span aria-hidden style={{ width: 9, height: 9, background: C.rust, display: "block", transform: "translateY(-2px)" }} />
              <span style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>{c.title}</span>
                <span style={{ fontSize: 15, lineHeight: 1.55, color: MK.body }}>{c.body}</span>
              </span>
            </div>
          ))}
          <span style={{ marginTop: 16, fontSize: 13.5, color: MK.muted }}>The public corrections log starts on launch day.</span>
        </div>
      </div>
    </section>
  );
}

export default function Methodology() {
  return (
    <div style={{ background: C.ink }}>
      <MarketingHeader />
      <MarketingTitleBar eyebrow="Our Methodology" before="Every claim, checked and" highlight="sourced." />
      <SourcesSection />
      <ProcessSection />
      <ScoreSection />
      <CorrectionsSection />
      <ClosingQuote
        quote="Well done is better than well said."
        attributionName="Benjamin Franklin"
        attributionSource={
          <>
            <em>Poor Richard’s Almanack</em>, 1737
          </>
        }
        line="Promises are easy. The record is what counts."
      />
      <MarketingFooter />
    </div>
  );
}
