import { C, cond } from "@/lib/theme";
import { MK } from "@/lib/marketingTheme";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingTitleBar } from "@/components/marketing/TitleBar";
import { ClosingQuote } from "@/components/marketing/ClosingQuote";
import { SectionLabel } from "@/components/marketing/SectionLabel";

// Fund HUSH (Step 6) is entirely static copy -- no tabs, filters, or
// answer state like What's Included -- so this stays a server component.

const NOTS = ["Not political campaigns.", "Not political parties.", "Not PACs.", "Not special interests."];

// Spelled-out count words for "{Count} kinds of money we won't take" --
// derived from REFUSED.length below rather than hard-coded, per the spec.
const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

const REFUSED: { who: string; why: string }[] = [
  { who: "Campaigns and candidate committees", why: "The people being covered cannot pay for the coverage." },
  { who: "PACs and super PACs", why: "Money whose entire purpose is persuasion." },
  { who: "Political parties and party committees", why: "Same reason, larger budget." },
  { who: "Advocacy groups with a legislative agenda", why: "Even the ones we might agree with. Especially those." },
  { who: "Political advertising of any kind", why: "No campaign, party, or issue ads. Not for any race, at any price." },
  { who: "Foreign lobbyists and their intermediaries", why: "No exceptions, and no routing it through a US entity." },
  { who: "Grants and foundation donations", why: "We are not a nonprofit. Nobody’s endowment sets our priorities." },
  { who: "Money with strings attached", why: "Voters can chip in. Nobody, at any amount, gets a say in what HUSH. shows you." },
];
const REFUSED_COUNT = WORDS[REFUSED.length] ?? String(REFUSED.length);

const SPEND = ["Research and verification", "Source monitoring", "Data and infrastructure", "Product development", "Keeping HUSH. running"];

type Tier = {
  name: string;
  price: string;
  per: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
};

// Step 10 (free beta): the plan cards below are blurred and inert behind the
// beta card. CONTRIBUTE_HREF is the Contribute destination; until the Stripe
// Payment Link is supplied it falls back to /contact (per the spec).
const CONTRIBUTE_HREF = "/contact";

const TIERS: Tier[] = [
  {
    name: "Free account",
    price: "$0",
    per: "",
    features: ["Feed: what changed, year round", "Politicians: compare any two, and see who’s funding them", "Stance Check"],
    cta: "Create your account",
    href: "/signup",
  },
  {
    name: "Member",
    price: "$19.99",
    per: "/ year",
    features: [
      "Feed: what changed, year round",
      "Politicians: compare any two, and see who’s funding them",
      "Stance Check",
      "HUSH. Guide: every race on your ballot",
    ],
    cta: "Contribute",
    href: CONTRIBUTE_HREF,
    featured: true,
  },
  {
    name: "Supporter",
    price: "$49.99",
    per: "/ year",
    features: [
      "Feed: what changed, year round",
      "Politicians: compare any two, and see who’s funding them",
      "Stance Check",
      "HUSH. Guide: every race on your ballot",
      "A second membership to give away",
      "A HUSH. merch item for joining the movement",
    ],
    cta: "Join the movement",
    href: CONTRIBUTE_HREF,
  },
];

function WhoFundsSection() {
  return (
    <section style={{ background: MK.paper, padding: "84px 34px", borderBottom: `1px solid ${MK.rule}` }}>
      <div className="guide-two-col" style={{ gridTemplateColumns: "minmax(0,1.1fr) minmax(0,0.9fr)", gap: 64, alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: cond, fontWeight: 400, fontSize: "clamp(24px, 2.4vw, 34px)", lineHeight: 1, textTransform: "uppercase", letterSpacing: "-0.005em" }}>
            Who funds HUSH.?
          </h2>
          <div
            style={{
              marginTop: 6,
              fontSize: "clamp(120px, 17vw, 260px)",
              lineHeight: 0.86,
              fontFamily: cond,
              fontWeight: 400,
              textTransform: "uppercase",
              letterSpacing: "-0.03em",
              display: "flex",
              alignItems: "baseline",
            }}
          >
            You
            <span aria-hidden style={{ display: "inline-block", width: "0.18em", height: "0.18em", background: C.rust, marginLeft: "0.04em" }} />
          </div>
          <span aria-hidden style={{ display: "block", marginTop: 14, width: "clamp(180px,24vw,380px)", height: 8, background: C.rust, transform: "rotate(-0.8deg)" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", borderTop: `2px solid ${C.ink}` }}>
          {NOTS.map((n) => (
            <span
              key={n}
              style={{ padding: "20px 0", borderBottom: `1px solid ${MK.rule}`, fontSize: "clamp(16px,1.5vw,21px)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.ink }}
            >
              {n}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function FollowTheMoneySection() {
  return (
    <section style={{ background: MK.paperAlt, padding: "84px 34px 92px", borderBottom: `1px solid ${MK.rule}` }}>
      <div className="guide-two-col" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 64, alignItems: "stretch" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: "54ch" }}>
          <SectionLabel>Follow the money</SectionLabel>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.64, color: MK.body, letterSpacing: "-0.008em" }}>
            Most of the political information that reaches you comes from someone with a stake in the outcome. Campaigns, parties, PACs, and corporations with an agenda spend heavily
            every election deciding what you see — and what you don’t.
          </p>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.64, color: MK.body, letterSpacing: "-0.008em" }}>
            Nobody has to send a memo. When the people paying for the information also want something from it, the work bends toward them on its own, through the quiet arithmetic of
            who you can afford to upset.
          </p>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.64, color: MK.body, letterSpacing: "-0.008em" }}>
            So we built HUSH. to be paid only by the people who use it. Before we accept any money, we ask whether it would give the person paying a reason to expect something back:
            kinder coverage, a softer story, or silence. If it would, we turn it down, no matter how much it is.
          </p>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.64, color: MK.body, letterSpacing: "-0.008em" }}>
            That’s how the list beside this was made. Every line on it is money someone could offer us, and every line is a no. It isn’t a policy we might revisit. It’s the reason HUSH.
            exists.
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "clamp(22px,2vw,28px)", lineHeight: 1.25, color: C.ink, letterSpacing: "-0.022em", fontWeight: 700 }}>
            Follow our money, and it ends with you.
          </p>
        </div>
        <div>
          <SectionLabel>{REFUSED_COUNT} kinds of money we won’t take</SectionLabel>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", borderTop: `2px solid ${C.ink}` }}>
            {REFUSED.map((r) => (
              <div key={r.who} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)", gap: 20, alignItems: "baseline", padding: "14px 0", borderBottom: `1px solid ${MK.rule}` }}>
                <span style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: "-0.01em", color: C.ink, textDecoration: "line-through", textDecorationColor: C.rust, textDecorationThickness: 2 }}>
                  {r.who}
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.5, color: MK.body }}>{r.why}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ItPaysTheBillsSection() {
  return (
    <section className="fund-bills-grid" style={{ background: C.ink, color: C.onDark, borderBottom: `1px solid ${MK.ruleDark}` }}>
      <div className="fund-bills-image" style={{ position: "relative", minHeight: 300, background: MK.ruleDark }}>
        <img
          src="/images/fund-hush/fund-lights.png"
          alt="A desk lamp lit over a dark desk at night"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "45% center", filter: "grayscale(1) contrast(1.05)", display: "block" }}
        />
        <div className="fund-bills-overlay" />
      </div>
      <div style={{ padding: "76px 34px 76px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h2 style={{ margin: 0, fontFamily: cond, fontWeight: 400, fontSize: "clamp(32px,3.6vw,54px)", lineHeight: 0.96, textTransform: "uppercase", letterSpacing: "-0.005em", maxWidth: "14ch", color: C.onDark }}>
          It pays the bills and keeps the lights on.
        </h2>
        <p style={{ margin: "22px 0 0", fontSize: 17, lineHeight: 1.6, color: MK.onBlackBody, maxWidth: "46ch" }}>
          Your contribution pays for the work of keeping the record current — pulling it, checking it, and keeping it from going stale between elections.
        </p>
        <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 12 }}>
          {SPEND.map((s) => (
            <div key={s} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "center" }}>
              <span aria-hidden style={{ width: 18, height: 18, border: `1.5px solid ${C.rust}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.rust }}>
                ✓
              </span>
              <span style={{ fontSize: 16, color: C.onDark }}>{s}</span>
            </div>
          ))}
        </div>
        <p style={{ margin: "26px 0 0", fontSize: 14, lineHeight: 1.6, color: MK.mutedDark, maxWidth: "46ch" }}>
          At the close of each year we publish the real numbers: total users, what went back into the product, and whether we finished up or down.
        </p>
      </div>
    </section>
  );
}

function TierCard({ tier }: { tier: Tier }) {
  return (
    <div
      style={{
        background: MK.card,
        border: `1px solid ${tier.featured ? C.ink : MK.rule}`,
        boxShadow: tier.featured ? `inset 0 5px 0 ${C.rust}` : undefined,
        padding: "30px 26px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.ink }}>{tier.name}</span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: "clamp(40px,3.6vw,54px)", lineHeight: 0.86, fontFamily: cond, fontWeight: 400, textTransform: "uppercase", letterSpacing: "-0.005em" }}>{tier.price}</span>
        <span style={{ fontSize: 14, color: MK.muted }}>{tier.per}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {tier.features.map((f) => (
          <div key={f} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 10, alignItems: "baseline" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>✓</span>
            <span style={{ fontSize: 15, lineHeight: 1.5, color: MK.body }}>{f}</span>
          </div>
        ))}
      </div>
      <a
        href={tier.href}
        tabIndex={-1}
        className="wi-cta-dark"
        style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 15, background: C.ink, color: C.onDark, fontSize: 15, fontWeight: 700, textDecoration: "none" }}
      >
        {tier.cta} →
      </a>
    </div>
  );
}

function BetaCard() {
  return (
    <div
      style={{
        gridArea: "1 / 1",
        position: "relative",
        zIndex: 1,
        alignSelf: "center",
        justifySelf: "center",
        width: "min(640px, 100%)",
        minWidth: 0,
        background: C.ink,
        color: C.onDark,
        padding: "38px 38px 34px",
        boxShadow: "0 24px 60px -20px rgba(28,25,23,0.55)",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: C.onDark }}>
        <span aria-hidden style={{ width: 9, height: 9, background: C.rust, display: "block" }} />
        Beta · 2026 midterms
      </span>
      <h3 style={{ margin: 0, fontFamily: cond, fontWeight: 400, fontSize: "clamp(28px,3vw,44px)", lineHeight: 0.98, textTransform: "uppercase", letterSpacing: "-0.005em" }}>
        Everything is{" "}
        <span
          style={{
            display: "inline-block",
            background: C.rust,
            color: C.ink,
            padding: "0.03em 0.16em 0.07em",
            transform: "rotate(-1deg)",
            clipPath: "polygon(0.8% 6%,3% 0%,50% 1.5%,97% 0%,100% 8%,99.4% 92%,96% 100%,48% 98%,2% 100%,0% 90%)",
          }}
        >
          free.
        </span>
      </h3>
      <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.62, color: "#CFC9BD", maxWidth: "52ch" }}>
        While HUSH. is in beta, every part of it is free through the 2026 midterms, including the HUSH. Guide. No card, no trial clock, nothing locked.
      </p>
      <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.62, color: "#CFC9BD", maxWidth: "52ch" }}>
        If you want to help keep it running, you can contribute any amount. It’s optional and it doesn’t unlock anything. It just means the money behind HUSH. keeps coming from voters.
      </p>
      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <a
          href="/signup"
          className="fund-beta-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "15px 22px", background: C.rust, color: C.ink, fontSize: 15, fontWeight: 700, textDecoration: "none" }}
        >
          <span>Create your free account</span>
          <span>→</span>
        </a>
        <a
          href={CONTRIBUTE_HREF}
          className="fund-beta-secondary"
          style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 21px", border: `1.5px solid ${C.onDark}`, color: C.onDark, fontSize: 15, fontWeight: 700, textDecoration: "none" }}
        >
          <span>Contribute</span>
          <span>→</span>
        </a>
      </div>
      <span style={{ paddingTop: 16, borderTop: "1px solid #3A342C", fontSize: 13, lineHeight: 1.55, color: "#8C8477" }}>
        HUSH. isn’t a nonprofit, so contributions aren’t tax-deductible. The plans behind this card start after the midterms.
      </span>
    </div>
  );
}

function MembershipSection() {
  return (
    <section id="membership" style={{ background: MK.paper, padding: "84px 34px 88px", borderBottom: `1px solid ${MK.rule}`, scrollMarginTop: 120 }}>
      <div className="guide-two-col" style={{ gridTemplateColumns: "minmax(0,1.1fr) minmax(0,0.9fr)", gap: 48, alignItems: "end" }}>
        <h2 style={{ margin: 0, fontFamily: cond, fontWeight: 400, fontSize: "clamp(28px,3vw,44px)", lineHeight: 0.98, textTransform: "uppercase", letterSpacing: "-0.005em", maxWidth: "18ch" }}>
          Free for the 2026 midterms
        </h2>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: MK.body, maxWidth: "46ch" }}>
          Corporations, super PACs, and politicians would happily pay for a tool like this. When voters pay for it instead, none of them get a say in what it shows you.
        </p>
      </div>
      <div style={{ marginTop: 34, display: "grid", minWidth: 0 }}>
        <div
          aria-hidden="true"
          className="fund-tiers-grid"
          style={{ gridArea: "1 / 1", filter: "blur(7px)", opacity: 0.5, pointerEvents: "none", userSelect: "none", minWidth: 0 }}
        >
          {TIERS.map((tier) => (
            <TierCard key={tier.name} tier={tier} />
          ))}
        </div>
        <BetaCard />
      </div>
    </section>
  );
}

export default function FundHush() {
  return (
    <div style={{ background: C.ink }}>
      <MarketingHeader active="fund-hush" />
      <MarketingTitleBar eyebrow="Fund HUSH." before="Funded by" highlight="voters," after="not donors." />
      <WhoFundsSection />
      <FollowTheMoneySection />
      <ItPaysTheBillsSection />
      <MembershipSection />
      <ClosingQuote
        quote="A popular Government, without popular information, or the means of acquiring it, is but a Prologue to a Farce or a Tragedy; or, perhaps both."
        attributionName="James Madison"
        attributionSource="Letter to W. T. Barry, 1822"
        line="Information needs a means of acquiring it. Here, that’s you."
        ctaLabel="Contribute"
        ctaHref="#membership"
      />
      <MarketingFooter />
    </div>
  );
}
