import { C, cond } from "@/lib/theme";
import { MK } from "@/lib/marketingTheme";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingTitleBar } from "@/components/marketing/TitleBar";
import { ClosingQuote } from "@/components/marketing/ClosingQuote";
import { FaqAccordion, type FaqItem } from "@/components/marketing/FaqAccordion";

const PRINCIPLES = [
  { title: "No endorsements.", body: "We don’t tell you who deserves your vote. The guide ends where the evidence ends." },
  { title: "Show the source.", body: "Positions come straight off the candidate’s own website. You should always be able to see where information came from." },
  { title: "Every race.", body: "If it’s on your ballot it’s in the guide — judges, water boards, measures, all of it." },
  { title: "Your decision.", body: "The information is ours to organize. The decision is yours to make." },
];

const BUILD_STEPS = [
  { n: "01", title: "Find", body: "We pull directly from primary material: campaign websites, government records, and public filings." },
  { n: "02", title: "Verify", body: "Every item is checked against its source, and confirmed with a second source whenever one exists." },
  { n: "03", title: "Keep it current", body: "We keep watching for new statements, votes, and filings, so the record stays up to date after you read it." },
];

const SIGN_IN_CARDS = [
  {
    name: "Feed",
    tag: "Free" as const,
    image: "hiw-pic-feed.png",
    alt: "Pedestrians under a lit news ticker in Times Square, black and white",
    headline: "What’s happening now.",
    body: "Key updates on the issues, bills, and politicians that matter to you, all in one place.",
    linkLabel: "Explore the Feed",
    href: "/whats-included#feed",
    objectPosition: "center 40%",
  },
  {
    name: "HUSH. Guide",
    tag: "Membership" as const,
    image: "hiw-pic-guide.png",
    alt: "A pencil resting on a paper election ballot, black and white",
    headline: "Your ballot, researched.",
    body: "A guide built around your ballot and the issues you care about, with direct quotes and real sources.",
    linkLabel: "Explore the Guide",
    href: "/hush-guide",
    objectPosition: "center 60%",
  },
  {
    name: "Stance Check",
    tag: "Free" as const,
    image: "hiw-pic-stance.png",
    alt: "Two empty chairs facing each other beneath a window, black and white",
    headline: "Where do you actually stand?",
    body: "Answer one statement per issue and see which candidates on your ballot agree or disagree with you.",
    linkLabel: "Try the Stance Check",
    href: "/whats-included#stance",
    objectPosition: "center center",
  },
  {
    name: "Politicians",
    tag: "Free" as const,
    image: "hiw-pic-politicians.png",
    alt: "An empty legislative chamber with rows of desks, black and white",
    headline: "Go deeper on anyone.",
    body: "Positions, voting records, campaign funding, and more, all with direct sources.",
    linkLabel: "Search Politicians",
    href: "/whats-included#politicians",
    objectPosition: "center 55%",
  },
];

const FAQS: FaqItem[] = [
  {
    q: "Do you sell my data?",
    a: "No. Your email, zip, and address are used to match you to your ballot and nothing else. They’re never sold, shared, or used for ads.",
  },
  {
    q: "Who writes this?",
    a: "Candidate positions come word for word from their own campaign websites, with the page and the date we pulled them. Votes and filings come from official records. Every claim is checked against its source before it’s published.",
  },
  {
    q: "Is it free?",
    a: "A free account gets you the feed, politician pages, and the Stance Check. The HUSH. Guide, every race on your ballot researched, comes with membership, from $19.99 a year.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Membership is billed once a year, and you can cancel whenever you like. You keep access until the end of the year you paid for.",
  },
];

function sectionLabel(text: string) {
  return (
    <span style={{ display: "block", fontSize: 12, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: C.ink }}>
      {text}
    </span>
  );
}

function OurPrinciples() {
  return (
    <section id="principles" style={{ background: MK.paperAlt, padding: "84px 34px", borderBottom: `1px solid ${MK.rule}` }}>
      {sectionLabel("Our principles")}
      <h2
        style={{
          margin: "18px 0 0",
          fontFamily: cond,
          fontWeight: 400,
          fontSize: "clamp(32px, 3.6vw, 54px)",
          lineHeight: 0.96,
          textTransform: "uppercase",
          letterSpacing: "-0.005em",
        }}
      >
        Four rules we don’t bend.
      </h2>
      <div className="principles-grid" style={{ marginTop: 34, borderTop: `2px solid ${C.ink}` }}>
        {PRINCIPLES.map((p) => (
          <div key={p.title} style={{ padding: "30px 0 10px", display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <span aria-hidden style={{ width: 12, height: 12, background: C.rust, display: "block" }} />
            <h3 style={{ margin: 0, fontFamily: cond, fontWeight: 400, fontSize: "clamp(18px, 1.6vw, 23px)", lineHeight: 1.02, textTransform: "uppercase", letterSpacing: "-0.005em", overflowWrap: "anywhere" }}>
              {p.title}
            </h3>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.58, color: MK.body }}>{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowWeBuild() {
  return (
    <section id="build" style={{ background: MK.paper, padding: "84px 34px", borderBottom: `1px solid ${MK.rule}` }}>
      {sectionLabel("How we build HUSH.")}
      <h2
        style={{
          margin: "18px 0 0",
          fontFamily: cond,
          fontWeight: 400,
          fontSize: "clamp(32px, 3.6vw, 54px)",
          lineHeight: 0.96,
          textTransform: "uppercase",
          letterSpacing: "-0.005em",
        }}
      >
        Three steps, every claim.
      </h2>
      <div className="story-two-col" style={{ marginTop: 26, gridTemplateColumns: "minmax(0,1.15fr) minmax(0,0.85fr)", gap: 56, alignItems: "stretch" }}>
        <div style={{ display: "flex", flexDirection: "column", borderTop: `2px solid ${C.ink}` }}>
          {BUILD_STEPS.map((step) => (
            <div key={step.n} style={{ display: "grid", gridTemplateColumns: "96px minmax(0,1fr)", gap: 24, alignItems: "start", padding: "28px 0", borderBottom: `1px solid ${MK.rule}` }}>
              <span style={{ fontFamily: cond, fontWeight: 400, fontSize: "clamp(34px, 3.2vw, 48px)", lineHeight: 0.86, textTransform: "uppercase", letterSpacing: "-0.005em", color: C.rust }}>
                {step.n}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <h3 style={{ margin: 0, fontFamily: cond, fontWeight: 400, fontSize: "clamp(20px, 1.9vw, 27px)", lineHeight: 1, textTransform: "uppercase", letterSpacing: "-0.005em" }}>
                  {step.title}
                </h3>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.58, color: MK.body, maxWidth: "52ch" }}>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="story-media" style={{ position: "relative", width: "100%", flex: 1, minHeight: 320, background: MK.paperAlt, border: `1px solid ${MK.rule}` }}>
            <img
              src="/images/how-it-works/hiw-build.png"
              alt="A researcher sorting index cards and records at a library table, black and white"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "48% center", display: "block" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <a
              href="/methodology"
              className="hiw-methodology-link"
              style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, color: C.ink, borderBottom: `1.5px solid ${C.ink}`, paddingBottom: 2, textDecoration: "none" }}
            >
              Our methodology →
            </a>
            <span style={{ fontSize: 14, lineHeight: 1.5, color: MK.muted }}>A closer look at our sources, our research process, and its limits.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function SignInGrid() {
  return (
    <section style={{ background: MK.paperAlt, padding: "84px 34px 92px", borderBottom: `1px solid ${MK.rule}` }}>
      {sectionLabel("What’s behind the sign-in")}
      <span aria-hidden style={{ display: "block", marginTop: 12, width: 44, height: 3, background: C.rust }} />
      <h2
        style={{
          margin: "22px 0 0",
          fontFamily: cond,
          fontWeight: 400,
          fontSize: "clamp(34px, 4.2vw, 64px)",
          lineHeight: 0.95,
          textTransform: "uppercase",
          letterSpacing: "-0.005em",
        }}
      >
        Different questions.
        <br />
        A clearer picture.
      </h2>
      <div className="hiw-cards-grid" style={{ marginTop: 44 }}>
        {SIGN_IN_CARDS.map((card) => (
          <div key={card.name} style={{ background: MK.card, border: `1px solid ${MK.rule}`, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 2", background: MK.paper, borderBottom: `1px solid ${MK.rule}`, overflow: "hidden" }}>
              <img
                src={`/images/how-it-works/${card.image}`}
                alt={card.alt}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: card.objectPosition, display: "block" }}
              />
            </div>
            <div style={{ padding: "26px 26px 28px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.rust }}>{card.name}</span>
                <span
                  style={
                    card.tag === "Free"
                      ? { fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 7px", border: `1.5px solid ${C.ink}`, color: C.ink }
                      : { fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 7px", background: C.ink, color: MK.paper }
                  }
                >
                  {card.tag}
                </span>
              </span>
              <h3 style={{ margin: 0, fontFamily: cond, fontWeight: 400, fontSize: "clamp(22px, 2.1vw, 32px)", lineHeight: 0.98, textTransform: "uppercase", letterSpacing: "-0.005em" }}>
                {card.headline}
              </h3>
              <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: MK.body, maxWidth: "46ch" }}>{card.body}</p>
              <a
                href={card.href}
                className="hiw-card-link"
                style={{ alignSelf: "flex-start", marginTop: "auto", paddingTop: 6, display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600, color: C.rust, textDecoration: "none" }}
              >
                {card.linkLabel} →
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuickAnswers() {
  return (
    <section id="faq" style={{ background: MK.paper, padding: "84px 34px", borderBottom: `1px solid ${MK.rule}` }}>
      <div className="story-two-col" style={{ gridTemplateColumns: "minmax(0,0.7fr) minmax(0,1.3fr)", gap: 64, alignItems: "start" }}>
        <div>
          {sectionLabel("Before you sign up")}
          <h2
            style={{
              margin: "18px 0 0",
              fontFamily: cond,
              fontWeight: 400,
              fontSize: "clamp(32px, 3.6vw, 54px)",
              lineHeight: 0.96,
              textTransform: "uppercase",
              letterSpacing: "-0.005em",
              maxWidth: "11ch",
            }}
          >
            Quick answers.
          </h2>
        </div>
        <FaqAccordion items={FAQS} />
      </div>
    </section>
  );
}

export default function HowItWorks() {
  return (
    <div style={{ background: C.ink }}>
      <MarketingHeader active="how-it-works" />
      <MarketingTitleBar eyebrow="How It Works" before="Your ballot, finally made" highlight="clear." />
      <OurPrinciples />
      <HowWeBuild />
      <SignInGrid />
      <QuickAnswers />
      <ClosingQuote
        quote="Whenever the people are well-informed, they can be trusted with their own government."
        attributionName="Thomas Jefferson"
        attributionSource="Letter to Richard Price, 1789"
        line="Being well-informed shouldn’t take all day. Log in and see your ballot."
        ctaLabel="Join the Movement"
        ctaHref="/signup"
      />
      <MarketingFooter />
    </div>
  );
}
