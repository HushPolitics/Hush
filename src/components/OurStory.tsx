import { C, cond } from "@/lib/theme";
import { MK } from "@/lib/marketingTheme";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingTitleBar } from "@/components/marketing/TitleBar";

function WhereItStarted() {
  return (
    <section style={{ background: MK.paper, padding: "96px 34px 104px", borderBottom: `1px solid ${MK.rule}` }}>
      <div className="story-two-col" style={{ gridTemplateColumns: "minmax(0,1.1fr) minmax(0,0.9fr)", gap: 64, alignItems: "stretch" }}>
        <div style={{ maxWidth: 640 }}>
          <span style={{ display: "block", fontSize: 12, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: MK.muted }}>
            Where it started
          </span>
          <h2
            style={{
              margin: "18px 0 0",
              fontFamily: cond,
              fontWeight: 400,
              fontSize: "clamp(30px, 3.4vw, 48px)",
              lineHeight: 1,
              textTransform: "uppercase",
              letterSpacing: "-0.005em",
              color: C.ink,
            }}
          >
            It started with one question.
          </h2>
          <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 22 }}>
            <p style={{ margin: 0, fontSize: "clamp(18px, 1.45vw, 20px)", lineHeight: 1.72, color: MK.body, letterSpacing: "-0.01em" }}>
              <span
                style={{
                  float: "left",
                  fontFamily: cond,
                  fontWeight: 400,
                  fontSize: "4.2em",
                  lineHeight: 0.8,
                  textTransform: "uppercase",
                  letterSpacing: "-0.005em",
                  color: C.ink,
                  margin: "0.06em 0.1em 0 0",
                }}
              >
                I
              </span>
              n 2024, my wife told me she wasn’t going to vote. It wasn’t that she didn’t care. Every time she
              tried to follow along, it was just people shouting at each other. When I told her it mattered, she
              didn’t argue. She just asked who she was supposed to trust.
            </p>
            <p style={{ margin: 0, fontSize: "clamp(18px, 1.45vw, 20px)", lineHeight: 1.72, color: MK.body, letterSpacing: "-0.01em" }}>
              I didn’t have an answer, so I went looking for one. I figured it would take twenty minutes. I read
              the candidates’ sites, read the ballot measures twice, and came up empty on the judges. It took most
              of a day, and I still couldn’t give her a straight answer on every race.
            </p>
            <p style={{ margin: 0, fontSize: "clamp(18px, 1.45vw, 20px)", lineHeight: 1.72, color: MK.body, letterSpacing: "-0.01em" }}>
              She was right to ask. Every voter deserves clear, sourced information about the people and issues on
              their ballot, and nobody should need a whole day to find it.
            </p>
            <p style={{ margin: 0, fontSize: "clamp(18px, 1.45vw, 20px)", lineHeight: 1.72, color: MK.body, letterSpacing: "-0.01em" }}>
              The goal was never to make her agree with me. It was to let her walk in knowing exactly who was on
              her ballot, and what each of them had actually done. That’s why I built HUSH. I want future
              generations to have a straight answer when it’s their turn, and a more informed democracy for all of
              us.
            </p>
          </div>
          <div style={{ marginTop: 34, paddingTop: 22, borderTop: `1px solid ${MK.rule}`, display: "flex", flexDirection: "column", gap: 6 }}>
            <img
              src="/images/our-story/signature-ink.png"
              alt="Hunter Mihalinec signature"
              style={{ display: "block", width: "clamp(200px, 20vw, 280px)", height: "auto", marginLeft: -6 }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: MK.muted }}>
              Hunter Mihalinec · Founder, HUSH.
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
          <div className="story-media" style={{ position: "relative", width: "100%", flex: 1, minHeight: 360, background: MK.paperAlt, border: `1px solid ${MK.rule}` }}>
            <img
              src="/images/our-story/story-start.png"
              alt="A couple at a kitchen table going through ballot papers and a laptop, black and white"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 45%", display: "block" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function WhatIFoundInstead() {
  const found = [
    "Every network with its own spin on the same event",
    "Ballot measures written with double negatives",
    "Endorsement lists from groups that wouldn’t say who funded them",
    "Judges with no coverage at all",
  ];
  return (
    <section style={{ background: MK.paperAlt, padding: "88px 34px", borderBottom: `1px solid ${MK.rule}` }}>
      <div className="story-two-col" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 64, alignItems: "stretch" }}>
        <div className="story-media" style={{ position: "relative", width: "100%", minHeight: 420, background: MK.paper, border: `1px solid ${MK.rule}` }}>
          <img
            src="/images/our-story/story-problem.png"
            alt="A desk buried in papers, notebooks and a coffee cup"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ display: "block", fontSize: 12, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: C.ink }}>
            What I found instead
          </span>
          <h2
            style={{
              margin: "18px 0 0",
              fontFamily: cond,
              fontWeight: 400,
              fontSize: "clamp(30px, 3.6vw, 52px)",
              lineHeight: 0.98,
              textTransform: "uppercase",
              letterSpacing: "-0.005em",
              maxWidth: "14ch",
              color: C.ink,
            }}
          >
            Political information is everywhere.
          </h2>
          <p style={{ margin: "20px 0 0", fontSize: 17, lineHeight: 1.62, color: MK.body, maxWidth: "50ch", letterSpacing: "-0.008em" }}>
            Campaign sites, government records, news outlets, and social media all tell different versions of the
            same story. It’s hard to know what’s real, what matters, and where to find it.
          </p>
          <div style={{ marginTop: 30, display: "flex", flexDirection: "column", borderTop: `2px solid ${C.ink}` }}>
            {found.map((item) => (
              <div key={item} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "baseline", padding: "16px 0", borderBottom: `1px solid ${MK.rule}` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.rust }}>✕</span>
                <span style={{ fontSize: 16.5, lineHeight: 1.45, color: C.ink, fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TheIdea() {
  return (
    <section style={{ background: MK.paper, padding: "96px 34px", borderBottom: `1px solid ${MK.rule}` }}>
      <div className="story-two-col" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 64, alignItems: "center" }}>
        <div>
          <span style={{ display: "block", fontSize: 12, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: C.ink }}>
            The idea
          </span>
          <h2
            style={{
              margin: "18px 0 0",
              fontFamily: cond,
              fontWeight: 400,
              fontSize: "clamp(40px, 5.2vw, 84px)",
              lineHeight: 0.92,
              textTransform: "uppercase",
              letterSpacing: "-0.005em",
              maxWidth: "10ch",
              color: C.ink,
            }}
          >
            So we built HUSH.
          </h2>
          <p style={{ margin: "24px 0 0", fontSize: "clamp(18px, 1.45vw, 20px)", lineHeight: 1.62, color: MK.body, maxWidth: "44ch", letterSpacing: "-0.01em" }}>
            A simple, modern way to bring the most relevant information together in one place, with direct quotes
            and real sources, so you can make your own decision.
          </p>
        </div>
        <div className="story-media" style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: MK.paperAlt, border: `1px solid ${MK.rule}` }}>
          <img
            src="/images/our-story/story-idea.png"
            alt="A long colonnade of stone columns in black and white"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
          />
        </div>
      </div>
    </section>
  );
}

function FounderQuote() {
  return (
    <section style={{ background: C.ink, padding: "110px 34px 120px" }}>
      <div style={{ maxWidth: 1100 }}>
        <span aria-hidden style={{ display: "block", width: 56, height: 6, background: C.rust }} />
        <p style={{ margin: "34px 0 0", fontSize: "clamp(28px, 3.4vw, 52px)", lineHeight: 1.18, letterSpacing: "-0.03em", fontWeight: 600, color: C.onDark }}>
          “I didn’t want to tell my wife who to vote for, I just wanted to help her exercise her right to vote.
          That’s why I started HUSH. I want everyone in the United States of America to have the same opportunity
          to have unbiased information when going into the voting booth.”
        </p>
        <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 8 }}>
          <img
            src="/images/our-story/signature-cream.png"
            alt="Hunter Mihalinec signature"
            style={{ display: "block", width: "clamp(220px, 22vw, 320px)", height: "auto", marginLeft: -6 }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: MK.mutedDark }}>
            Hunter Mihalinec · Founder, HUSH.
          </span>
        </div>
      </div>
    </section>
  );
}

export default function OurStory() {
  return (
    <div style={{ background: C.ink }}>
      <MarketingHeader active="our-story" />
      <MarketingTitleBar eyebrow="Our Story" before="Why we built" highlight="HUSH." />
      <WhereItStarted />
      <WhatIFoundInstead />
      <TheIdea />
      <FounderQuote />
      <MarketingFooter />
    </div>
  );
}
