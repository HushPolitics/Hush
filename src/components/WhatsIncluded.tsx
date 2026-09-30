"use client";

import { useState } from "react";
import { C, cond } from "@/lib/theme";
import { MK } from "@/lib/marketingTheme";
import { APP_SAMPLE as APP } from "@/lib/appSampleTheme";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingTitleBar } from "@/components/marketing/TitleBar";
import { ClosingQuote } from "@/components/marketing/ClosingQuote";
import { SectionLabel } from "@/components/marketing/SectionLabel";
import { SampleCaption, SampleCard, SampleKicker } from "@/components/marketing/AppSample";

// ---------------------------------------------------------------------
// Sample data, ported verbatim from What's Included.dc.html's own <script>
// block (FEED, FEED_NEW, FEED_KINDS, FEED_TABS, ISSUES, SCALE, CANDS,
// GRID_CANDS, GRID, MONEY, COLORS, SC_CANDS, SC_QS) rather than retyped,
// per the spec. Apostrophes inside this block match the prototype exactly,
// including its own inconsistency (straight in most places, one curly
// "hire's" in ISSUES) -- not normalized, since this is the sample data the
// interactive demos run on, not page copy. CMP/CMP_TABS existed in the
// prototype's script but are never read by its renderVals() or markup, so
// they're dead data and are not ported.
type FeedKind = "bill" | "vote";
type FeedTabKey = "ballot" | "issues" | "following";
type FeedItem = {
  k: FeedKind;
  title: string;
  line: string;
  date: string;
  who?: string;
  worth?: boolean;
  unread?: boolean;
};

const FEED: Record<FeedTabKey, FeedItem[]> = {
  ballot: [
    { k: "bill", title: "Additional Homestead Property Tax Exemption", line: "Amendment 5 would add a new $25,000 property tax exemption for owner-occupied homes, on top of the exemptions homeowners already get.", date: "Nov 3, 2026", worth: true },
    { k: "bill", title: "Duval County Transit Sales Tax", line: "Proposition A would raise Duval County's sales tax by half a cent for 20 years to pay for bus and transit improvements.", date: "Nov 3, 2026", worth: true },
    { k: "vote", title: "Voted Yes on Florida SB 1", line: "General Appropriations Act. Voted for the amended budget, including the Article II floor amendments.", who: "Sen. Rosa Vance", date: "Sep 24, 2026", unread: true },
    { k: "bill", title: "Minimum Wage Inflation Adjustment", line: "Amendment 7 would tie Florida's minimum wage to inflation every year starting in 2027.", date: "Nov 3, 2026", unread: true },
    { k: "vote", title: "Voted No on Florida HB 455", line: "Renters' Notice and Cure Act. Voted against advancing the bill out of committee.", who: "Rep. Clay Torrance", date: "Sep 22, 2026", unread: true },
  ],
  issues: [
    { k: "vote", title: "Voted Yes on H.R. 2145", line: "Insulin Cost Reduction Act. Voted for the $35/month insulin cap.", who: "Rep. Delia Marchetti", date: "Sep 16, 2026", worth: true, unread: true },
    { k: "bill", title: "Minimum Wage Inflation Adjustment", line: "Amendment 7 would tie Florida's minimum wage to inflation every year starting in 2027.", date: "Nov 3, 2026", worth: true },
    { k: "vote", title: "Voted No on Florida HB 455", line: "Renters' Notice and Cure Act. Voted against advancing the bill out of committee.", who: "Rep. Clay Torrance", date: "Sep 22, 2026", unread: true },
    { k: "bill", title: "Additional Homestead Property Tax Exemption", line: "Amendment 5 would add a new $25,000 property tax exemption for owner-occupied homes.", date: "Nov 3, 2026" },
  ],
  following: [
    { k: "vote", title: "Voted Yes on Florida SB 1", line: "General Appropriations Act. Voted for the amended budget, including the Article II floor amendments.", who: "Sen. Rosa Vance", date: "Sep 24, 2026", worth: true, unread: true },
    { k: "vote", title: "Voted Yes on H.R. 2145", line: "Insulin Cost Reduction Act. Voted for the $35/month insulin cap.", who: "Rep. Delia Marchetti", date: "Sep 16, 2026", worth: true },
    { k: "vote", title: "Voted No on Florida HB 455", line: "Renters' Notice and Cure Act. Voted against advancing the bill out of committee.", who: "Rep. Clay Torrance", date: "Sep 22, 2026", unread: true },
    { k: "bill", title: "Duval County Transit Sales Tax", line: "Proposition A would raise Duval County's sales tax by half a cent for 20 years.", date: "Nov 3, 2026" },
  ],
};
const FEED_NEW: Record<FeedTabKey, number> = { ballot: 47, issues: 18, following: 9 };
const FEED_KINDS: readonly (readonly ["all" | FeedKind, string])[] = [
  ["all", "All Updates"],
  ["vote", "Votes"],
  ["bill", "Bills & Legislation"],
];
const FEED_TABS: readonly (readonly [FeedTabKey, string])[] = [
  ["ballot", "My Ballot"],
  ["issues", "My Issues"],
  ["following", "Following"],
];

const SCALE = ["Disagree", "Neutral", "Agree"] as const;

type ScKey = "t" | "h";
type ScCand = { key: ScKey; name: string; initials: string; color: string };
const SC_CANDS: ScCand[] = [
  { key: "t", name: "Donald Trump", initials: "DT", color: "#E4572E" },
  { key: "h", name: "Kamala Harris", initials: "KH", color: "#1C1917" },
];
// 1 = agrees with the statement, -1 = disagrees. Summarized from 2024 campaign positions.
type ScPos = { s: number; pos: string };
type ScQ = { issue: string; text: string; t: ScPos; h: ScPos };
const SC_QS: ScQ[] = [
  {
    issue: "Taxes",
    text: "Tips earned by service workers should not be taxed as income.",
    t: { s: 1, pos: "Proposed ending federal income tax on tips." },
    h: { s: 1, pos: "Also proposed ending federal income tax on tips." },
  },
  {
    issue: "Trade",
    text: "The U.S. should put a tariff on most imports from every country.",
    t: { s: 1, pos: "Proposed a baseline tariff on nearly all imports." },
    h: { s: -1, pos: "Opposed a universal tariff, calling it a tax on consumers." },
  },
  {
    issue: "Abortion",
    text: "Abortion rights should be protected nationwide by federal law.",
    t: { s: -1, pos: "Said abortion law should be left to the states." },
    h: { s: 1, pos: "Pledged to sign a law restoring Roe v. Wade protections." },
  },
];

type Issue = { k: string; label: string; text: string; bill: string; yes: boolean[] };
const ISSUES: Issue[] = [
  { k: "healthcare", label: "Healthcare", text: "Medicare should be allowed to negotiate directly with drug manufacturers over prescription drug prices.", bill: "H.R. 4120", yes: [false, true, true] },
  { k: "immigration", label: "Immigration", text: "Employers should be required to verify every new hire’s legal work status.", bill: "SB 1502", yes: [true, false, true] },
  { k: "economy", label: "Economy", text: "The state minimum wage should rise automatically with inflation every year.", bill: "HB 740", yes: [false, true, false] },
  { k: "education", label: "Education", text: "Public school funding should follow students to the school their family chooses.", bill: "HB 1180", yes: [true, false, true] },
  { k: "housing", label: "Housing", text: "Cities should be allowed to override local objections to build denser housing near transit.", bill: "HB 1229", yes: [true, true, false] },
  { k: "voting", label: "Voting rights", text: "Voters should be able to register on the same day they vote.", bill: "SB 590", yes: [false, true, false] },
  { k: "transit", label: "Transit", text: "Counties should be able to raise sales taxes to fund public transit.", bill: "HB 902", yes: [false, true, true] },
  { k: "guns", label: "Guns", text: "Buyers at gun shows should go through the same background check as buyers at a store.", bill: "SB 1266", yes: [false, true, true] },
  { k: "veterans", label: "Veterans", text: "The state should cover the full cost of college tuition for veterans.", bill: "HB 377", yes: [true, true, true] },
];

type Cand = { name: string; party: string };
const CANDS: Cand[] = [
  { name: "Candidate A", party: "Republican" },
  { name: "Candidate B", party: "Democrat" },
  { name: "Candidate C", party: "Republican" },
];

type GridCand = { initial: string; name: string; seat: string; color: string };
const GRID_CANDS: GridCand[] = [
  { initial: "A", name: "Candidate A", seat: "Republican · U.S. Senate", color: "#E4572E" },
  { initial: "B", name: "Candidate B", seat: "Democrat · U.S. Senate", color: "#1C1917" },
];

type GridCell = { q: string; date: string } | { s: string };
type GridRow = { k: string; issue: string; rank: string; cells: GridCell[] };
const GRID: GridRow[] = [
  {
    k: "healthcare",
    issue: "Healthcare",
    rank: "Your #1 Issue",
    cells: [
      { q: "I support lowering drug costs by expanding competition among manufacturers, not by letting Washington set prices.", date: "Feb 2026" },
      { q: "I believe Medicare should be able to negotiate the price of every prescription drug, starting with the most expensive ones.", date: "Apr 2026" },
    ],
  },
  {
    k: "education",
    issue: "Education",
    rank: "Your #4 Issue",
    cells: [
      { q: "Every parent deserves a choice if their zoned school isn't working for their kid.", date: "May 2026" },
      { s: "Opposes voucher expansion" },
    ],
  },
  {
    k: "housing",
    issue: "Housing",
    rank: "Your #5 Issue",
    cells: [
      { q: "Local communities, not Tallahassee, should decide what gets built in their neighborhoods, and how fast.", date: "Feb 2026" },
      { q: "We need to build more homes near jobs and transit, and cut the red tape that stops it from happening.", date: "May 2026" },
    ],
  },
  {
    k: "energy",
    issue: "Energy",
    rank: "",
    cells: [
      { s: "Supports expanded offshore leasing" },
      { q: "I believe we should invest in clean energy and reduce our reliance on fossil fuels over time, without raising what families pay.", date: "Mar 2026" },
    ],
  },
];

const clip = (t: string, n: number) => (t.length > n ? t.slice(0, n).replace(/\s+\S*$/, "") + "…" : t);

const COLORS = [C.ink, C.rust, MK.mutedDark, "#CFC9BD"];
type MoneyKey = "A" | "B";
const MONEY: Record<MoneyKey, { parts: [string, number][]; ind: [string, string][] }> = {
  A: {
    parts: [["Individual donors", 58], ["PACs", 22], ["Self-funded", 12], ["Party committees", 8]],
    ind: [["Real estate", "$412K"], ["Health care", "$288K"], ["Energy", "$203K"]],
  },
  B: {
    parts: [["Individual donors", 71], ["PACs", 14], ["Self-funded", 3], ["Party committees", 12]],
    ind: [["Education", "$356K"], ["Legal", "$301K"], ["Technology", "$244K"]],
  },
};

// ---------------------------------------------------------------------
// Section 2: HUSH. Guide callout ------------------------------------

function GuideCallout() {
  return (
    <section style={{ background: MK.paper, padding: "56px 34px", borderBottom: `1px solid ${MK.rule}` }}>
      <div
        className="story-two-col"
        style={{ gridTemplateColumns: "minmax(0,1fr) auto", gap: 40, alignItems: "center", border: `2px solid ${C.ink}`, padding: "34px 32px", background: MK.card }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: C.ink }}>
            <span>HUSH. Guide</span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", background: C.ink, color: C.onDark, padding: "4px 8px" }}>With membership</span>
          </div>
          <h2 style={{ margin: "16px 0 0", fontFamily: cond, fontWeight: 400, fontSize: "clamp(26px, 2.8vw, 40px)", lineHeight: 1, textTransform: "uppercase", letterSpacing: "-0.005em", maxWidth: "22ch" }}>
            Your whole ballot, researched.
          </h2>
          <p style={{ margin: "14px 0 0", fontSize: 16.5, lineHeight: 1.6, color: MK.body, maxWidth: "56ch" }}>
            Zip in, issues picked, and every race you&rsquo;ll vote in comes back with each candidate&rsquo;s positions in their own words. It comes with membership, from $19.99 a year.
          </p>
        </div>
        <a
          href="/hush-guide"
          className="wi-cta-dark"
          style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "15px 24px", background: C.ink, color: C.onDark, fontSize: 14, fontWeight: 700, letterSpacing: "-0.005em", textDecoration: "none" }}
        >
          See how the Guide works &rarr;
        </a>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// Section 4: Feed ----------------------------------------------------

function FeedSection() {
  const [tab, setTab] = useState<FeedTabKey>("ballot");
  const [kind, setKind] = useState<"all" | FeedKind>("all");

  const items = FEED[tab].filter((x) => kind === "all" || x.k === kind);
  const worth = FEED[tab].filter((x) => x.worth).slice(0, 2);

  return (
    <section id="feed" style={{ background: MK.paperAlt, padding: "72px 34px", borderBottom: `1px solid ${MK.rule}`, scrollMarginTop: 130 }}>
      <div className="story-two-col" style={{ gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.1fr)", gap: 56, alignItems: "center" }}>
        <div>
          <SectionLabel>Feed</SectionLabel>
          <h2 style={{ margin: "18px 0 0", fontFamily: cond, fontWeight: 400, fontSize: "clamp(30px, 3.4vw, 50px)", lineHeight: 0.98, textTransform: "uppercase", letterSpacing: "-0.005em", maxWidth: "14ch" }}>
            What changed, year round.
          </h2>
          <p style={{ margin: "18px 0 0", fontSize: 17, lineHeight: 1.62, color: MK.body, maxWidth: "44ch", letterSpacing: "-0.008em" }}>
            Votes taken, promises resolved, and new statements from the people on your ballot and the politicians you follow &mdash; so you don&rsquo;t have to go looking between elections.
          </p>
          <p style={{ margin: "18px 0 0", fontSize: 17, lineHeight: 1.62, color: MK.body, maxWidth: "44ch", letterSpacing: "-0.008em" }}>
            Free with an account.
          </p>
          <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
            <a
              href="/signup"
              className="wi-cta-dark"
              style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "15px 24px", background: C.ink, color: C.onDark, fontSize: 14, fontWeight: 700, letterSpacing: "-0.005em", textDecoration: "none" }}
            >
              Sign up to see your feed &rarr;
            </a>
            <a
              href="/login"
              className="marketing-underline-link"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: C.ink, borderBottom: `1.5px solid ${C.ink}`, paddingBottom: 2, textDecoration: "none" }}
            >
              Log in
            </a>
          </div>
        </div>
        <div>
          <div style={{ background: APP.bg, border: `1px solid ${MK.rule}`, boxShadow: "0 12px 30px -18px rgba(28,25,23,0.25)", padding: "18px 18px 8px" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {FEED_TABS.map(([k, label]) => {
                const on = tab === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => { setTab(k); setKind("all"); }}
                    style={{ padding: "7px 14px", borderRadius: 999, border: `1px solid ${on ? C.ink : MK.rule}`, background: on ? C.ink : "#FFFFFF", color: on ? "#FFFFFF" : C.ink, fontFamily: "inherit", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.rust }}>Worth knowing</span>
                <span style={{ fontSize: 10.5, fontWeight: 500, color: C.rust, background: MK.persimmonTint, padding: "3px 9px", borderRadius: 999 }}>{FEED_NEW[tab]} new updates</span>
              </div>
              <span style={{ fontSize: 11, color: C.rust }}>View all &rarr;</span>
            </div>
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
              {worth.map((w) => (
                <div
                  key={w.title}
                  style={{ position: "relative", background: "#FFFFFF", border: `1px solid ${w.unread ? C.rust : APP.border}`, borderRadius: 6, padding: "12px 13px", display: "flex", flexDirection: "column", gap: 6, minHeight: 104, minWidth: 0 }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: C.ink }}>{w.k === "vote" ? "☑" : "☰"}</span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: APP.tag, color: C.ink, padding: "3px 7px", borderRadius: 4, whiteSpace: "nowrap" }}>
                      {w.k === "vote" ? "Vote" : "Bills & Legislation"}
                    </span>
                  </span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.25, fontFamily: cond, fontWeight: 400, letterSpacing: "0.005em", color: C.ink }}>{w.title}</span>
                  <span style={{ fontSize: 11, lineHeight: 1.4, color: MK.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.who || w.line}</span>
                  <span style={{ marginTop: "auto", fontSize: 10, color: MK.muted }}>{w.date}</span>
                  {w.unread ? <span aria-hidden style={{ position: "absolute", top: 12, right: 12, width: 6, height: 6, borderRadius: "50%", background: C.rust, display: "block" }} /> : null}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontFamily: cond, fontWeight: 400, letterSpacing: "0.005em", color: C.ink, marginRight: 4 }}>Recent Updates</span>
              {FEED_KINDS.map(([k, label]) => {
                const on = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    style={{ padding: "5px 11px", borderRadius: 999, border: `1px solid ${on ? C.ink : MK.rule}`, background: on ? C.ink : "#FFFFFF", color: on ? "#FFFFFF" : C.ink, fontFamily: "inherit", fontSize: 11.5, fontWeight: 500, cursor: "pointer" }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column" }}>
              {items.map((it, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "8px 14px minmax(0,1fr) auto", gap: 8, alignItems: "start", padding: "12px 2px", borderBottom: `1px solid ${APP.border}` }}>
                  <span style={{ marginTop: 6, width: 6, height: 6, borderRadius: "50%", background: it.unread ? C.rust : "transparent", border: `1px solid ${it.unread ? C.rust : APP.fieldBorder}`, display: "block" }} />
                  <span style={{ marginTop: 2, fontSize: 11, color: C.ink }}>{it.k === "vote" ? "☑" : "☰"}</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: APP.tag, color: C.ink, padding: "3px 7px", borderRadius: 4, whiteSpace: "nowrap" }}>
                        {it.k === "vote" ? "Vote" : "Bills & Legislation"}
                      </span>
                      <span style={{ fontSize: 12.5, lineHeight: 1.25, fontFamily: cond, fontWeight: 400, letterSpacing: "0.005em", color: C.ink }}>{it.title}</span>
                    </span>
                    <span style={{ fontSize: 11.5, lineHeight: 1.45, color: MK.body }}>{it.line}</span>
                    {it.who ? <span style={{ fontSize: 10.5, color: MK.muted }}>{it.who}</span> : null}
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: MK.muted, whiteSpace: "nowrap" }}>
                    {it.date}
                    <span style={{ fontSize: 13 }}>&rsaquo;</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <SampleCaption text="Sample feed. Switch the tabs and filters to explore." />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// Section 5: Stance Check (in-page sample) ---------------------------

function StanceSection({ onTry }: { onTry: () => void }) {
  const [q, setQ] = useState("healthcare");
  const [ans, setAns] = useState(-1);

  const qi = Math.max(0, ISSUES.findIndex((x) => x.k === q));
  const Q = ISSUES[qi];
  const answered = ans >= 0;
  const dir = ans === 0 ? -1 : ans === 2 ? 1 : 0;

  const stanceRows = CANDS.map((c) => {
    const yes = Q.yes[CANDS.indexOf(c)];
    const vote = (yes ? "Voted yes" : "Voted no") + " · " + Q.bill;
    if (dir === 0) return { ...c, vote, verdict: "—", bg: "transparent", fg: MK.muted, bd: MK.rule };
    const agrees = (dir > 0) === yes;
    return { ...c, vote, verdict: agrees ? "Agrees" : "Disagrees", bg: agrees ? C.ink : MK.paperAlt, fg: agrees ? C.onDark : C.ink, bd: agrees ? C.ink : MK.paperAlt };
  });

  const agreeing = stanceRows.filter((r) => r.verdict === "Agrees");
  const parties = new Set(agreeing.map((r) => r.party));
  const stanceLine =
    dir === 0
      ? "A neutral answer isn’t matched against votes. Pick a side to see who agrees."
      : agreeing.length === 0
      ? "None of these candidates voted the way you answered."
      : agreeing.length === 1
      ? "Only " + agreeing[0].name + " voted the way you answered."
      : (() => {
          const names = agreeing.map((r) => r.name);
          const list = names.length === 2 ? names.join(" and ") : names.slice(0, -1).join(", ") + ", and " + names[names.length - 1];
          if (parties.size < 2) return list + " voted the way you answered.";
          if (names.length === 2) return list + " are in different parties, and both voted the way you answered.";
          return list + " all voted the way you answered, across both parties.";
        })();

  return (
    <section id="stance" style={{ background: MK.paper, padding: "72px 34px", borderBottom: `1px solid ${MK.rule}`, scrollMarginTop: 130 }}>
      <div className="wi-stance-row">
        <div className="wi-stance-sample">
          <div style={{ background: APP.bg, border: `1px solid ${MK.rule}`, boxShadow: "0 12px 30px -18px rgba(28,25,23,0.25)", padding: "20px 18px 18px" }}>
            <span style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.rust }}>Stance Check</span>
            <span style={{ display: "block", marginTop: 8, fontSize: 17, lineHeight: 1.15, fontFamily: cond, fontWeight: 400, letterSpacing: "0.005em", color: C.ink }}>
              Where you and your ballot agree
            </span>
            <span style={{ display: "block", marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: C.ink }}>
              One statement per issue &mdash; see which candidates on your ballot agree or disagree with you.
            </span>
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: 11, color: MK.muted }}>
                Question {qi + 1} of {ISSUES.length}
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.rust }}>Edit issues</span>
            </div>
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "118px minmax(0,1fr)", gap: 12, alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {ISSUES.map((x) => {
                  const on = x.k === Q.k;
                  return (
                    <button
                      key={x.k}
                      type="button"
                      onClick={() => { setQ(x.k); setAns(-1); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", border: 0, borderRadius: 4, background: on ? APP.issueOnBg : "transparent", cursor: "pointer", textAlign: "left", fontFamily: "inherit", fontSize: 11.5, color: on ? C.ink : MK.muted }}
                    >
                      <span style={{ width: 9, height: 9, borderRadius: "50%", border: `1.5px solid ${on ? C.ink : APP.issueRing}`, background: "transparent", display: "block", flex: "none" }} />
                      {x.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
                <div style={{ background: "#FFFFFF", border: `1px solid ${APP.border}`, borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ background: C.ink, padding: "9px 14px" }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.rust }}>{Q.label}</span>
                  </div>
                  <div style={{ padding: 14 }}>
                    <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.28, fontFamily: cond, fontWeight: 400, letterSpacing: "0.005em", color: C.ink }}>{Q.text}</p>
                    <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 6 }}>
                      {SCALE.map((label, i) => {
                        const on = ans === i;
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => setAns(i)}
                            style={{ padding: "9px 4px", borderRadius: 5, border: `1px solid ${on ? C.ink : MK.rule}`, background: on ? C.ink : "#FFFFFF", color: on ? "#FFFFFF" : C.ink, fontFamily: "inherit", fontSize: 11.5, fontWeight: 500, cursor: "pointer" }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ background: "#FFFFFF", border: `1px solid ${APP.border}`, borderRadius: 6 }}>
                {!answered ? (
                  <span style={{ display: "block", padding: "12px 14px", fontSize: 11, lineHeight: 1.5, fontStyle: "italic", color: MK.muted }}>
                    Pick an answer to see where candidates on your ballot stand.
                  </span>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {stanceRows.map((r) => (
                      <div key={r.name} style={{ padding: "10px 12px", borderBottom: `1px solid ${MK.paperAlt}`, display: "grid", gridTemplateColumns: "minmax(0,1fr) auto auto", gap: 10, alignItems: "center" }}>
                        <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}>{r.name}</span>
                          <span style={{ fontSize: 10.5, color: MK.muted }}>{r.party}</span>
                        </span>
                        <span style={{ fontSize: 10.5, color: MK.muted, textAlign: "right" }}>{r.vote}</span>
                        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 8px", borderRadius: 4, whiteSpace: "nowrap", background: r.bg, color: r.fg, border: `1px solid ${r.bd}` }}>
                          {r.verdict}
                        </span>
                      </div>
                    ))}
                    <span style={{ display: "block", padding: "10px 12px 12px", fontSize: 11.5, lineHeight: 1.45, fontWeight: 600, color: C.ink }}>{stanceLine}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <SampleCaption text="Sample questions. Pick an issue and an answer to see the matches." />
        </div>
        <div className="wi-stance-text">
          <SectionLabel>Stance Check</SectionLabel>
          <h2 style={{ margin: "18px 0 0", fontFamily: cond, fontWeight: 400, fontSize: "clamp(30px, 3.4vw, 50px)", lineHeight: 0.98, textTransform: "uppercase", letterSpacing: "-0.005em", maxWidth: "14ch" }}>
            Where you actually stand.
          </h2>
          <p style={{ margin: "18px 0 0", fontSize: 17, lineHeight: 1.62, color: MK.body, maxWidth: "44ch", letterSpacing: "-0.008em" }}>
            One statement for each issue you ranked. Each answer is matched against how the people on your ballot actually voted &mdash; not against their party.
          </p>
          <p style={{ margin: "18px 0 0", fontSize: 17, lineHeight: 1.62, color: MK.body, maxWidth: "44ch", letterSpacing: "-0.008em" }}>
            You&rsquo;ll often agree with someone you didn&rsquo;t expect to. That&rsquo;s the point.
          </p>
          <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onTry}
              className="wi-cta-dark"
              style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "15px 24px", border: 0, cursor: "pointer", background: C.ink, color: C.onDark, fontFamily: "inherit", fontSize: 14, fontWeight: 700, letterSpacing: "-0.005em" }}
            >
              Try 3 questions &rarr;
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// Section 5 (Politicians, part A): Compare / stance grid --------------

function CompareSample() {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <SampleCard>
      <SampleKicker label="Side by side" title="Stance grid" />
      <div style={{ marginTop: 12, background: "#FFFFFF", border: `1px solid ${APP.border}`, borderRadius: 6, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "92px minmax(0,1fr) minmax(0,1fr)", background: APP.tag }}>
          <span style={{ display: "block" }} />
          {GRID_CANDS.map((c) => (
            <div key={c.initial} style={{ padding: "10px 12px", borderLeft: `1px solid ${MK.rule}`, display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
              <span style={{ width: 22, height: 22, borderRadius: 4, background: c.color, color: "#FFFFFF", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{c.initial}</span>
              <span style={{ marginTop: 5, fontSize: 12.5, lineHeight: 1.15, fontFamily: cond, fontWeight: 400, letterSpacing: "0.005em", color: C.ink, whiteSpace: "nowrap" }}>{c.name}</span>
              <span style={{ fontSize: 10, color: MK.muted }}>{c.seat}</span>
            </div>
          ))}
        </div>
        {GRID.map((row) => (
          <div key={row.k} style={{ display: "grid", gridTemplateColumns: "92px minmax(0,1fr) minmax(0,1fr)", borderTop: `1px solid ${APP.border}` }}>
            <div style={{ background: APP.tag, padding: 10, display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.ink }}>{row.issue}</span>
              {row.rank ? (
                <span style={{ fontSize: 9, fontWeight: 500, color: C.rust, background: MK.persimmonTint, padding: "2px 7px", borderRadius: 999, whiteSpace: "nowrap" }}>{row.rank}</span>
              ) : null}
            </div>
            {row.cells.map((cell, ci) => {
              if ("s" in cell) {
                return (
                  <div key={ci} style={{ padding: "10px 12px", borderLeft: `1px solid ${APP.border}`, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                    <span style={{ fontSize: 11, lineHeight: 1.45, color: C.ink }}>{cell.s}</span>
                    <span style={{ display: "flex" }}>
                      <span style={{ fontSize: 10.5, fontWeight: 500, background: APP.tag, color: C.ink, padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>Source</span>
                    </span>
                  </div>
                );
              }
              const key = row.k + ci;
              const isOpen = !!open[key];
              const text = isOpen ? cell.q : clip(cell.q, 58);
              return (
                <div key={ci} style={{ padding: "10px 12px", borderLeft: `1px solid ${APP.border}`, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: 11, lineHeight: 1.45, fontStyle: "italic", color: C.ink }}>
                    &#8220;{text}&#8221;{" "}
                    <button
                      type="button"
                      onClick={() => setOpen((s) => ({ ...s, [key]: !isOpen }))}
                      style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", fontFamily: "inherit", fontStyle: "normal", fontSize: 10.5, color: C.rust, textDecoration: "underline" }}
                    >
                      {isOpen ? "Show less" : "Show more"}
                    </button>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10.5, fontWeight: 500, background: APP.tag, color: C.ink, padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>Source</span>
                    <span style={{ fontSize: 10, color: MK.muted }}>{cell.date}</span>
                    <span style={{ fontSize: 10, color: C.rust }}>Full quote &rarr;</span>
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </SampleCard>
  );
}

// ---------------------------------------------------------------------
// Section 5 (Politicians, part B): Follow the money --------------------

function MoneySample() {
  const [who, setWho] = useState<MoneyKey>("A");
  const m = MONEY[who];
  const parts = m.parts.map(([label, n], i) => ({ label, w: n + "%", c: COLORS[i] }));

  return (
    <SampleCard>
      <span style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.rust }}>Follow the money</span>
      <div style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 17, lineHeight: 1.15, fontFamily: cond, fontWeight: 400, letterSpacing: "0.005em", color: C.ink }}>Where the money comes from</span>
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["A", "B"] as const).map((k) => {
          const on = who === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setWho(k)}
              style={{ padding: "6px 13px", borderRadius: 999, border: `1px solid ${on ? C.ink : MK.rule}`, background: on ? C.ink : "#FFFFFF", color: on ? "#FFFFFF" : C.ink, fontFamily: "inherit", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
            >
              Candidate {k}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 12, background: "#FFFFFF", border: `1px solid ${APP.border}`, borderRadius: 6, padding: 14, display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.ink }}>Receipts by source</span>
        <div style={{ marginTop: 10, display: "flex", height: 10, gap: 2, borderRadius: 999, overflow: "hidden" }}>
          {parts.map((p) => (
            <span key={p.label} style={{ display: "block", width: p.w, height: "100%", background: p.c, transition: "width 240ms ease" }} />
          ))}
        </div>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column" }}>
          {parts.map((p) => (
            <div key={p.label} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 9, alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${MK.paperAlt}`, fontSize: 11.5, color: C.ink }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.c, display: "block" }} />
              <span>{p.label}</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: C.ink }}>{p.w}</span>
            </div>
          ))}
        </div>
        <span style={{ display: "block", marginTop: 14, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.ink }}>Top industries</span>
        <div style={{ marginTop: 4, display: "flex", flexDirection: "column" }}>
          {m.ind.map(([label, v]) => (
            <div key={label} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 9, alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${MK.paperAlt}`, fontSize: 11.5, color: C.ink }}>
              <span>{label}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
        <span style={{ paddingTop: 12, display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10.5, fontWeight: 500, background: APP.tag, color: C.ink, padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>Source</span>
          <span style={{ fontSize: 10, color: MK.muted }}>FEC Form 3 &middot; Q2 2026</span>
          <span style={{ fontSize: 10, color: C.rust }}>Full filing &rarr;</span>
        </span>
      </div>
    </SampleCard>
  );
}

function PoliticiansSection() {
  return (
    <section id="politicians" style={{ background: MK.paperAlt, padding: "72px 34px", borderBottom: `1px solid ${MK.rule}`, scrollMarginTop: 130 }}>
      <SectionLabel>Politicians</SectionLabel>
      <h2 style={{ margin: "18px 0 0", fontFamily: cond, fontWeight: 400, fontSize: "clamp(30px, 3.4vw, 50px)", lineHeight: 0.98, textTransform: "uppercase", letterSpacing: "-0.005em", maxWidth: "20ch" }}>
        Every politician, on the record.
      </h2>
      <p style={{ margin: "18px 0 0", fontSize: 17, lineHeight: 1.62, color: MK.body, maxWidth: "60ch" }}>
        Every politician gets a page with their positions, their votes, their promises, and their money. Two tools sit on top of it.
      </p>
      <div className="story-two-col" style={{ marginTop: 40, gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 40, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, paddingBottom: 14, borderBottom: `2px solid ${C.ink}` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.rust }}>A</span>
            <h3 style={{ margin: 0, fontSize: 22, lineHeight: 1.05, fontFamily: cond, fontWeight: 400, textTransform: "uppercase", letterSpacing: "-0.005em" }}>Compare</h3>
          </div>
          <p style={{ margin: "14px 0 22px", fontSize: 15.5, lineHeight: 1.6, color: MK.body, maxWidth: "48ch" }}>
            Put candidates side by side on the issues you care about, with direct quotes from their own sites and the source on every line.
          </p>
          <CompareSample />
          <SampleCaption text={"Tap “Show more” to read the full quote."} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, paddingBottom: 14, borderBottom: `2px solid ${C.ink}` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.rust }}>B</span>
            <h3 style={{ margin: 0, fontSize: 22, lineHeight: 1.05, fontFamily: cond, fontWeight: 400, textTransform: "uppercase", letterSpacing: "-0.005em" }}>Follow the money</h3>
          </div>
          <p style={{ margin: "14px 0 22px", fontSize: 15.5, lineHeight: 1.6, color: MK.body, maxWidth: "60ch" }}>
            See where a campaign&rsquo;s money comes from, from donors and PACs to the industries behind it, straight from public filings.
          </p>
          <MoneySample />
          <SampleCaption text="Switch candidates to compare their money." />
        </div>
      </div>
      <span style={{ display: "block", marginTop: 14, fontSize: 12, color: MK.muted }}>Sample candidates, quotes, and figures, for illustration.</span>
    </section>
  );
}

// ---------------------------------------------------------------------
// Section 8: Stance Check pop-up ("Try 3 questions") -------------------

function StanceCheckPopup({
  answers,
  onAnswer,
  onClose,
  onRestart,
}: {
  answers: number[];
  onAnswer: (i: number) => void;
  onClose: () => void;
  onRestart: () => void;
}) {
  const idx = answers.length;
  const done = idx >= SC_QS.length;
  const Q = SC_QS[Math.min(idx, SC_QS.length - 1)];
  const dir = (v: number) => (v === 0 ? -1 : v === 2 ? 1 : 0);

  const rows = SC_QS.map((sq, i) => {
    const d = dir(answers[i]);
    return {
      issue: sq.issue,
      you: SCALE[answers[i]] ?? "—",
      cands: SC_CANDS.map((c) => {
        const p = sq[c.key];
        if (d === 0) return { ...c, pos: p.pos, verdict: "—", bg: "transparent", fg: MK.muted, bd: MK.rule };
        const ok = d === p.s;
        return { ...c, pos: p.pos, verdict: ok ? "Agrees" : "Disagrees", bg: ok ? C.ink : MK.paperAlt, fg: ok ? C.onDark : C.ink, bd: ok ? C.ink : MK.paperAlt };
      }),
    };
  });

  const of = answers.filter((v) => v !== 1).length;
  const neutral = answers.filter((v) => v === 1).length;
  const totals = SC_CANDS.map((c) => {
    const n = SC_QS.filter((sq, i) => dir(answers[i]) !== 0 && dir(answers[i]) === sq[c.key].s).length;
    const line = of === 0 ? "No match yet · all 3 neutral" : "You matched on " + n + " of " + of + (neutral ? " · " + neutral + " neutral" : "");
    return { ...c, line };
  });

  const dots = SC_QS.map((_, i) => (i < idx ? C.ink : i === idx ? C.rust : MK.rule));

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(28,25,23,0.78)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 20px", overflowY: "auto" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: 620, background: MK.paper, border: `1px solid ${MK.rule}`, borderRadius: 10, boxShadow: "0 30px 60px -20px rgba(0,0,0,0.5)", padding: "24px 24px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.rust }}>Stance Check &middot; Sample</span>
            <span style={{ display: "block", marginTop: 6, fontSize: 22, lineHeight: 1.1, fontFamily: cond, fontWeight: 400, letterSpacing: "0.005em", color: C.ink }}>Where do you line up?</span>
            <span style={{ display: "block", marginTop: 5, fontSize: 13, lineHeight: 1.5, color: MK.body }}>
              Three questions. Then see how the 2024 presidential candidates&rsquo; stated positions compare with yours.
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ flex: "none", border: 0, background: "transparent", cursor: "pointer", fontSize: 20, lineHeight: 1, color: MK.muted, padding: 2 }}>
            &#10005;
          </button>
        </div>

        {!done ? (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: 12, color: MK.muted, whiteSpace: "nowrap" }}>
                Question {Math.min(idx + 1, SC_QS.length)} of {SC_QS.length}
              </span>
              <span style={{ display: "flex", gap: 4 }}>
                {dots.map((d, i) => (
                  <span key={i} style={{ width: 22, height: 3, borderRadius: 2, background: d, display: "block" }} />
                ))}
              </span>
            </div>
            <div style={{ marginTop: 10, background: "#FFFFFF", border: `1px solid ${APP.border}`, borderRadius: 7, overflow: "hidden" }}>
              <div style={{ background: C.ink, padding: "10px 16px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.rust }}>{Q.issue}</span>
              </div>
              <div style={{ padding: "18px 16px 16px" }}>
                <p style={{ margin: 0, fontSize: 18, lineHeight: 1.3, fontFamily: cond, fontWeight: 400, letterSpacing: "0.005em", color: C.ink }}>{Q.text}</p>
                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
                  {SCALE.map((label, i) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => onAnswer(i)}
                      className="wi-popup-choice"
                      style={{ padding: "12px 6px", borderRadius: 6, border: `1px solid ${MK.rule}`, background: "#FFFFFF", color: C.ink, fontFamily: "inherit", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
              {totals.map((t) => (
                <div key={t.key} style={{ background: "#FFFFFF", border: `1px solid ${APP.border}`, borderRadius: 7, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 5, background: t.color, color: "#FFFFFF", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    {t.initials}
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontFamily: cond, fontWeight: 400, letterSpacing: "0.005em", color: C.ink, whiteSpace: "nowrap" }}>{t.name}</span>
                    <span style={{ fontSize: 11.5, color: MK.muted, whiteSpace: "nowrap" }}>{t.line}</span>
                  </span>
                </div>
              ))}
            </div>
            <div style={{ background: "#FFFFFF", border: `1px solid ${APP.border}`, borderRadius: 7, overflow: "hidden" }}>
              {rows.map((r) => (
                <div key={r.issue} style={{ padding: "12px 14px", borderBottom: `1px solid ${MK.paperAlt}`, display: "flex", flexDirection: "column", gap: 9 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.ink }}>{r.issue}</span>
                    <span style={{ fontSize: 11, color: MK.muted }}>
                      You said: <strong style={{ fontWeight: 700, color: C.ink }}>{r.you}</strong>
                    </span>
                  </div>
                  {r.cands.map((c) => (
                    <div key={c.key} style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr) auto", gap: 10, alignItems: "center" }}>
                      <span style={{ width: 20, height: 20, borderRadius: 4, background: c.color, color: "#FFFFFF", fontSize: 8.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{c.initials}</span>
                      <span style={{ fontSize: 12, lineHeight: 1.45, color: MK.body }}>{c.pos}</span>
                      <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 8px", borderRadius: 4, whiteSpace: "nowrap", background: c.bg, color: c.fg, border: `1px solid ${c.bd}` }}>
                        {c.verdict}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 11.5, lineHeight: 1.5, color: MK.muted }}>
              Positions summarized from each candidate&rsquo;s 2024 campaign. In HUSH., every position is quoted word for word, with its source.
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <a
                href="/signup"
                className="guide-cta-light"
                style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 22px", borderRadius: 6, background: C.rust, color: C.ink, fontSize: 14, fontWeight: 700, textDecoration: "none" }}
              >
                Get the full Stance Check &rarr;
              </a>
              <button
                type="button"
                onClick={onRestart}
                className="marketing-underline-link"
                style={{ border: 0, background: "transparent", cursor: "pointer", padding: 0, fontFamily: "inherit", fontSize: 14, fontWeight: 600, color: C.ink, borderBottom: `1.5px solid ${C.ink}` }}
              >
                Start over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------

export default function WhatsIncluded() {
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupAnswers, setPopupAnswers] = useState<number[]>([]);

  return (
    <div style={{ background: C.ink }}>
      <MarketingHeader active="how-it-works" />
      <MarketingTitleBar eyebrow="What’s Included" before="See what’s" highlight="behind" after="the login." />
      <GuideCallout />
      <FeedSection />
      <StanceSection onTry={() => { setPopupAnswers([]); setPopupOpen(true); }} />
      <PoliticiansSection />
      <ClosingQuote
        quote="The ignorance of one voter in a democracy impairs the security of all."
        attributionName="John F. Kennedy"
        attributionSource="Vanderbilt University, 1963"
        line="One informed voter at a time. Start with you."
      />
      <MarketingFooter />
      {popupOpen ? (
        <StanceCheckPopup
          answers={popupAnswers}
          onAnswer={(i) => setPopupAnswers((a) => [...a, i])}
          onClose={() => setPopupOpen(false)}
          onRestart={() => setPopupAnswers([])}
        />
      ) : null}
    </div>
  );
}
