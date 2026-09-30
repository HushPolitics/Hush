"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { C, cond } from "@/lib/theme";
import { MK } from "@/lib/marketingTheme";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingTitleBar } from "@/components/marketing/TitleBar";

// Privacy & Terms (Step 9), the launch version. Not in the header nav --
// see MarketingHeader below, no `active` passed. Reached from the footer
// link, which now points here instead of the in-app /privacy settings page
// (that page is unrelated -- it's Profile Settings' own plain-language
// explainer for a signed-in user, not this legal policy). No closing-quote
// section, per spec.
//
// ⚠️ Business must confirm before launch (see 09-privacy-and-terms.md's
// checklist): minimum age (13), annual-only auto-renewing memberships with
// a working cancel-anytime setting, 14-day full refund window, 30-day data
// request response time via Contact, email-before-material-change,
// Florida governing law, the liability cap, the "last updated" date below,
// no data sold/shared with campaigns or political ad targeting (true of
// every vendor used), and the list of service providers for the lawyer.
// None of that is a code decision -- it's copy ported verbatim from the
// prototype, which the business needs to verify is still accurate.

const LAST_UPDATED = "September 30, 2026";

type Tab = "privacy" | "terms";

type ListItem = { bold?: string; text: string };

function Para({ children }: { children: ReactNode }) {
  return (
    <p style={{ margin: "12px 0 0", fontSize: 16.5, lineHeight: 1.65, color: MK.body }}>{children}</p>
  );
}

function BulletList({ items }: { items: ListItem[] }) {
  return (
    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", borderTop: `1px solid ${MK.rule}` }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, alignItems: "baseline", padding: "11px 0", borderBottom: `1px solid ${MK.rule}` }}>
          <span aria-hidden style={{ width: 7, height: 7, background: C.rust, display: "block", transform: "translateY(-2px)" }} />
          <span style={{ fontSize: 15.5, lineHeight: 1.55, color: C.ink }}>
            {item.bold ? <strong>{item.bold}</strong> : null}
            {item.bold ? " " : null}
            {item.text}
          </span>
        </div>
      ))}
    </div>
  );
}

function Section({ id, title, first, children }: { id: string; title?: string; first?: boolean; children: ReactNode }) {
  return (
    <div id={id} style={{ scrollMarginTop: 150, marginTop: first ? 0 : 44 }}>
      {title ? (
        <h3 style={{ margin: 0, fontSize: "clamp(20px, 2vw, 28px)", lineHeight: 1, fontFamily: cond, fontWeight: 400, textTransform: "uppercase", letterSpacing: "-0.005em" }}>
          {title}
        </h3>
      ) : null}
      {children}
    </div>
  );
}

function TabHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div id={id} style={{ scrollMarginTop: 150, marginTop: 0 }}>
      <h2 style={{ margin: 0, fontSize: "clamp(32px, 3.6vw, 54px)", lineHeight: 0.96, fontFamily: cond, fontWeight: 400, textTransform: "uppercase", letterSpacing: "-0.005em" }}>
        {children}
      </h2>
    </div>
  );
}

const PRIVACY_TOC = [
  { id: "privacy-summary", label: "The short version" },
  { id: "privacy-collect", label: "What we collect" },
  { id: "privacy-use", label: "How we use it" },
  { id: "privacy-never", label: "What we never do" },
  { id: "privacy-share", label: "Who we share it with" },
  { id: "privacy-choices", label: "Your choices" },
  { id: "privacy-kids", label: "Children" },
  { id: "privacy-changes", label: "Changes to this policy" },
];

const TERMS_TOC = [
  { id: "terms-summary", label: "The short version" },
  { id: "terms-accounts", label: "Your account" },
  { id: "terms-billing", label: "Membership and billing" },
  { id: "terms-content", label: "Our information" },
  { id: "terms-use", label: "Using HUSH." },
  { id: "terms-links", label: "Links to other sites" },
  { id: "terms-liability", label: "Limits on liability" },
  { id: "terms-law", label: "Governing law" },
  { id: "terms-changes", label: "Changes to these terms" },
];

function PrivacyContent() {
  return (
    <div style={{ minWidth: 0, maxWidth: "66ch" }}>
      <TabHeading id="privacy">Privacy</TabHeading>

      <Section id="privacy-summary" title="The short version" first>
        <Para>
          We collect what we need to show you your ballot, and nothing we’d be embarrassed to explain. We
          don’t sell your data, we don’t share it with campaigns, and we don’t use it for political
          advertising.
        </Para>
      </Section>

      <Section id="privacy-collect" title="What we collect">
        <BulletList
          items={[
            { bold: "Your account:", text: "your email address and password." },
            { bold: "Where you vote:", text: "your zip code and, if you add it, your street address, used to match you to your districts." },
            { bold: "Your priorities:", text: "the issues you rank and your Stance Check answers." },
            { bold: "Payments:", text: "handled by our payment processor. We never see or store your full card number." },
            { bold: "Basic usage:", text: "pages visited, device type, and similar technical details, so we can keep the site working." },
          ]}
        />
      </Section>

      <Section id="privacy-use" title="How we use it">
        <BulletList
          items={[
            { text: "To show you the races and measures on your ballot." },
            { text: "To order your guide and feed around the issues you picked." },
            { text: "To send you the emails you asked for, like the Brief or alerts." },
            { text: "To run, secure, and improve HUSH." },
          ]}
        />
      </Section>

      <Section id="privacy-never" title="What we never do">
        <BulletList
          items={[
            { text: "Sell your personal information, to anyone, at any price." },
            { text: "Share your issues, answers, or address with campaigns, parties, PACs, or advocacy groups." },
            { text: "Use your political views to target ads at you." },
            { text: "Tell anyone how you answered or how you plan to vote." },
          ]}
        />
      </Section>

      <Section id="privacy-share" title="Who we share it with">
        <Para>
          Only the service providers we need to run HUSH., such as hosting, payments, and email delivery.
          They’re contractually limited to using your data to provide that service. We’ll also disclose
          information if the law requires it, and we’ll tell you when we’re legally allowed to.
        </Para>
      </Section>

      <Section id="privacy-choices" title="Your choices">
        <BulletList
          items={[
            { text: "See and download the data we hold about you." },
            { text: "Correct your address, issues, or email at any time." },
            { text: "Delete your account, and your data with it." },
            { text: "Unsubscribe from any email with one click." },
          ]}
        />
        <Para>
          To make a request, send us a message through our{" "}
          <Link href="/contact" className="marketing-underline-link" style={{ color: C.ink, borderBottom: `1px solid ${C.ink}` }}>
            Contact page
          </Link>{" "}
          and choose “General question.” We’ll respond within 30 days.
        </Para>
      </Section>

      <Section id="privacy-kids" title="Children">
        <Para>HUSH. isn’t intended for children under 13, and we don’t knowingly collect their information.</Para>
      </Section>

      <Section id="privacy-changes" title="Changes to this policy">
        <Para>
          If we change how we handle your data, we’ll update this page and tell you by email before the
          change takes effect. Last updated {LAST_UPDATED}.
        </Para>
      </Section>
    </div>
  );
}

function TermsContent() {
  return (
    <div style={{ minWidth: 0, maxWidth: "66ch" }}>
      <TabHeading id="terms">Terms</TabHeading>

      <Section id="terms-summary" title="The short version" first>
        <Para>
          HUSH. gives you information, not advice, and never tells you how to vote. You pay once a year if you
          choose a membership, and you can cancel whenever you like.
        </Para>
      </Section>

      <Section id="terms-accounts" title="Your account">
        <Para>
          You need to be at least 13 to create an account, and you’re responsible for keeping your password
          safe. One membership covers the number of logins included in your plan.
        </Para>
      </Section>

      <Section id="terms-billing" title="Membership and billing">
        <BulletList
          items={[
            { text: "Memberships are billed once a year. There’s no monthly option." },
            { text: "Your membership renews each year unless you cancel before the renewal date." },
            { text: "You can cancel any time from your account settings." },
            {
              text:
                "Changed your mind? If you cancel within 14 days of a new membership or a renewal, we’ll refund it in full. After that, your membership stays active until the end of the year you paid for.",
            },
          ]}
        />
      </Section>

      <Section id="terms-content" title="Our information">
        <Para>
          We work to make everything in HUSH. accurate and sourced, but we can’t guarantee it’s free of
          errors. When we get something wrong, we correct it in public. Nothing in HUSH. is legal, financial, or
          voting advice, and nothing in it is an endorsement of any candidate, party, or position.
        </Para>
      </Section>

      <Section id="terms-use" title="Using HUSH.">
        <BulletList
          items={[
            { text: "Use HUSH. for your own, personal, non-commercial research." },
            { text: "Don’t scrape, resell, or republish our content in bulk without permission." },
            { text: "Don’t try to break, overload, or get around the security of the service." },
            { text: "Don’t use HUSH. to harass anyone or to spread claims you know are false." },
          ]}
        />
      </Section>

      <Section id="terms-links" title="Links to other sites">
        <Para>
          We link to original sources, like campaign websites and government records, so you can check them
          yourself. We don’t control those sites and aren’t responsible for what’s on them.
        </Para>
      </Section>

      <Section id="terms-liability" title="Limits on liability">
        <Para>
          HUSH. is provided “as is” and “as available,” without warranties of any kind. To
          the fullest extent the law allows, HUSH. isn’t liable for indirect, incidental, or consequential
          damages, and our total liability to you for any claim is limited to the amount you paid us in the 12
          months before the claim.
        </Para>
      </Section>

      <Section id="terms-law" title="Governing law">
        <Para>These terms are governed by the laws of the State of Florida.</Para>
      </Section>

      <Section id="terms-changes" title="Changes to these terms">
        <Para>
          If we make a material change, we’ll tell you by email before it takes effect. Last updated{" "}
          {LAST_UPDATED}.
        </Para>
      </Section>
    </div>
  );
}

function PrivacyTermsSection() {
  const [tab, setTab] = useState<Tab>("privacy");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash.indexOf("#terms") === 0) setTab("terms");
  }, []);

  function selectTab(next: Tab) {
    setTab(next);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "#" + next);
    }
  }

  const toc = tab === "privacy" ? PRIVACY_TOC : TERMS_TOC;

  return (
    <section style={{ background: MK.paper, padding: "72px 34px 96px", borderBottom: `1px solid ${MK.rule}` }}>
      <div role="tablist" style={{ display: "flex", gap: 36, borderBottom: `1px solid ${MK.rule}`, marginBottom: 48 }}>
        {(["privacy", "terms"] as Tab[]).map((key) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(key)}
              className="legal-tab"
              style={{
                border: 0,
                background: "transparent",
                cursor: "pointer",
                padding: "0 0 14px",
                marginBottom: -1,
                fontFamily: cond,
                fontWeight: 400,
                textTransform: "uppercase",
                letterSpacing: "-0.005em",
                fontSize: "clamp(22px, 2.2vw, 32px)",
                color: active ? C.ink : MK.mutedDark,
                borderBottom: `3px solid ${active ? C.rust : "transparent"}`,
              }}
            >
              {key === "privacy" ? "Privacy" : "Terms"}
            </button>
          );
        })}
      </div>

      <div className="legal-toc-grid">
        <nav className="legal-toc-nav" style={{ display: "flex", flexDirection: "column", borderTop: `2px solid ${C.ink}` }}>
          <span style={{ padding: "14px 0 8px", fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.rust }}>
            {tab === "privacy" ? "Privacy" : "Terms"}
          </span>
          {toc.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="legal-toc-link"
              style={{ display: "block", padding: "9px 0", borderBottom: `1px solid ${MK.rule}`, fontSize: 14.5, color: MK.body }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {tab === "privacy" ? <PrivacyContent /> : <TermsContent />}
      </div>
    </section>
  );
}

export default function PrivacyTerms() {
  return (
    <div style={{ background: C.ink }}>
      <MarketingHeader />
      <MarketingTitleBar eyebrow="Privacy & Terms" before="The fine print, made" highlight="plain." />
      <PrivacyTermsSection />
      <MarketingFooter />
    </div>
  );
}
