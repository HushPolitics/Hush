import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import { C } from "@/lib/theme";
import { Card, Display, Kicker } from "@/components/ui";

export const metadata: Metadata = { title: "Privacy" };

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "Your address",
    body: "We use your street address, city, state and ZIP to figure out which districts you're in and pull up the races, candidates and local legislation that are actually on your ballot. It is never shown to other users, and we don't sell it.",
  },
  {
    title: "Your top issues and topics you follow",
    body: "The issues you rank and the topics you choose to follow shape what HUSH. shows you first and how closely it says a politician matches what you care about. They're a personalization signal for your account only — not a political label, and not something other users can see.",
  },
  {
    title: "HUSH. Scores, promise records and fact checks",
    body: "None of these are running yet. Deciding whether a politician kept a promise is a judgment call that takes a human reviewer, and HUSH. doesn't have reviewers doing that work today — so no politician on HUSH. carries a score, and nothing you see here is an assessment of any real person. What HUSH. does show is the public record: who holds which office, who has filed for which race, and what bills are moving.",
  },
  {
    title: "Your account",
    body: "Your name and email are used to sign you in and let HUSH. address you by name. Your password is never visible to anyone at HUSH., including us — changing it happens through Supabase's authentication service.",
  },
  {
    title: "Staying in control",
    body: "You can review or change your address, your ranked issues, and your email preferences at any time from Profile Settings.",
  },
];

export default function PrivacyPage() {
  return (
    <AppShell>
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
        <Card style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Kicker>Privacy</Kicker>
            <Display size={25}>Privacy at HUSH.</Display>
            <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
              Here&apos;s the plain-language version of how we use what you tell us.
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {SECTIONS.map((s) => (
              <div key={s.title} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>{s.title}</span>
                <p style={{ margin: 0, fontSize: 13, color: C.body, lineHeight: 1.6 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
