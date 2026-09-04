"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { C, cond } from "@/lib/theme";
import { usePrefs, type EmailPrefs } from "@/lib/prefs";
import { createClient } from "@/lib/supabase/client";
import { syncOnboardingToSupabase } from "@/lib/supabase/profile";
import { Card, Chip, Display, GhostButton, Kicker, RustButton } from "@/components/ui";

const fieldStyle = {
  padding: "11px 14px",
  border: "1px solid rgba(21,21,21,0.2)",
  borderRadius: 8,
  background: C.sandDeep,
  fontSize: 14,
  outline: "none",
} as const;

const labelStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 4,
  fontSize: 12,
  color: C.muted,
};

const textLinkStyle = {
  border: 0,
  background: "transparent",
  padding: 0,
  fontSize: 12,
  color: C.muted,
  textDecoration: "underline",
  cursor: "pointer",
};

function SectionHeader({ kicker, title, subtitle }: { kicker: string; title: string; subtitle?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Kicker>{kicker}</Kicker>
      <Display size={22}>{title}</Display>
      {subtitle ? <span style={{ fontSize: 13, color: C.body }}>{subtitle}</span> : null}
    </div>
  );
}

function StatusLine({ status, message }: { status: "idle" | "saving" | "saved" | "error"; message: string }) {
  if (status === "idle" || !message) return null;
  return (
    <span style={{ fontSize: 12, color: status === "error" ? C.rust : C.navy, lineHeight: 1.5 }}>{message}</span>
  );
}

/**
 * Profile Settings — Personal Information, Voting Location, HUSH
 * Preferences, Email Preferences and Privacy. Reuses the onboarding data
 * model (`Prefs.firstName`/`lastName`/`streetAddress`/`city`/`state` and
 * `syncOnboardingToSupabase`) end to end rather than introducing parallel
 * fields — see the doc comments on those in lib/prefs.tsx.
 */
export default function ProfileSettingsView({ topicPool }: { topicPool: string[] }) {
  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
      <PersonalInfoSection />
      <VotingLocationSection />
      <HushPreferencesSection topicPool={topicPool} />
      <EmailPreferencesSection />
      <PrivacySection />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Personal Information
// ---------------------------------------------------------------------------

function PersonalInfoSection() {
  const { firstName, lastName, email, setFirstName, setLastName, setEmail } = usePrefs();
  const [draftFirst, setDraftFirst] = useState(firstName);
  const [draftLast, setDraftLast] = useState(lastName);
  const [draftEmail, setDraftEmail] = useState(email);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");

    const first = draftFirst.trim();
    const last = draftLast.trim();
    const nextEmail = draftEmail.trim();
    setFirstName(first);
    setLastName(last);
    setEmail(nextEmail);

    let emailError = "";
    if (nextEmail && nextEmail !== email) {
      const supabase = createClient();
      if (supabase) {
        const { error } = await supabase.auth.updateUser({ email: nextEmail });
        if (error) emailError = error.message;
      }
    }

    const synced = await syncOnboardingToSupabase({ firstName: first, lastName: last });

    if (emailError) {
      setStatus("error");
      setMessage(`Name saved. Your email change needs attention: ${emailError}`);
    } else {
      setStatus("saved");
      setMessage(synced ? "Saved." : "Saved on this device — sign in to sync it to your account.");
    }
  }

  return (
    <Card style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionHeader kicker="Account" title="Personal Information" />
      <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <label style={{ ...labelStyle, flex: 1 }}>
            First name
            <input
              value={draftFirst}
              onChange={(e) => setDraftFirst(e.target.value)}
              aria-label="First name"
              style={fieldStyle}
            />
          </label>
          <label style={{ ...labelStyle, flex: 1 }}>
            Last name
            <input
              value={draftLast}
              onChange={(e) => setDraftLast(e.target.value)}
              aria-label="Last name"
              style={fieldStyle}
            />
          </label>
        </div>
        <label style={labelStyle}>
          Email
          <input
            type="email"
            value={draftEmail}
            onChange={(e) => setDraftEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address"
            style={fieldStyle}
          />
        </label>
        <RustButton type="submit" style={{ alignSelf: "flex-start" }}>
          {status === "saving" ? "Saving…" : "Save changes"}
        </RustButton>
        <StatusLine status={status} message={message} />
      </form>

      <PasswordSection />
    </Card>
  );
}

function PasswordSection() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setStatus("error");
      setMessage("Password needs to be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setMessage("Passwords don't match.");
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setStatus("error");
      setMessage("Accounts are not switched on yet — the backend is still being wired up.");
      return;
    }
    setStatus("saving");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("saved");
    setMessage("Your password has been updated.");
    setPassword("");
    setConfirm("");
  }

  return (
    <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, color: C.body }}>Password</span>
        <GhostButton
          onClick={() => setOpen((v) => !v)}
          style={{ marginLeft: "auto", padding: "8px 14px", fontSize: 12 }}
        >
          {open ? "Cancel" : "Change password"}
        </GhostButton>
      </div>
      {open ? (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            aria-label="New password"
            style={fieldStyle}
          />
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            aria-label="Confirm new password"
            style={fieldStyle}
          />
          <RustButton type="submit" style={{ alignSelf: "flex-start" }}>
            {status === "saving" ? "Saving…" : "Update password"}
          </RustButton>
          <StatusLine status={status} message={message} />
        </form>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Voting Location
// ---------------------------------------------------------------------------

function VotingLocationSection() {
  const { streetAddress, city, state, zip, setStreetAddress, setCity, setState, setZip } = usePrefs();
  const [draftStreet, setDraftStreet] = useState(streetAddress);
  const [draftCity, setDraftCity] = useState(city);
  const [draftState, setDraftState] = useState(state);
  const [draftZip, setDraftZip] = useState(zip);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    const street = draftStreet.trim();
    const c = draftCity.trim();
    const st = draftState.trim().toUpperCase().slice(0, 2);
    setStreetAddress(street);
    if (c) setCity(c);
    if (st) setState(st);
    if (draftZip.length === 5) setZip(draftZip);

    const synced = await syncOnboardingToSupabase({ streetAddress: street, city: c, state: st });
    setStatus("saved");
    setMessage(synced ? "Saved." : "Saved on this device — sign in to sync it to your account.");
  }

  return (
    <Card style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionHeader
        kicker="Ballot"
        title="Voting Location"
        subtitle="Where HUSH looks up your districts, races and polling place."
      />
      <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label style={labelStyle}>
          Street address
          <input
            value={draftStreet}
            onChange={(e) => setDraftStreet(e.target.value)}
            placeholder="Optional"
            aria-label="Street address"
            style={fieldStyle}
          />
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <label style={{ ...labelStyle, flex: 1 }}>
            City
            <input
              value={draftCity}
              onChange={(e) => setDraftCity(e.target.value)}
              aria-label="City"
              style={fieldStyle}
            />
          </label>
          <label style={{ ...labelStyle, width: 70 }}>
            State
            <input
              value={draftState}
              onChange={(e) => setDraftState(e.target.value)}
              maxLength={2}
              aria-label="State"
              style={{ ...fieldStyle, textTransform: "uppercase" }}
            />
          </label>
          <label style={{ ...labelStyle, width: 100 }}>
            ZIP
            <input
              value={draftZip}
              onChange={(e) => setDraftZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
              maxLength={5}
              aria-label="ZIP code"
              style={fieldStyle}
            />
          </label>
        </div>
        <RustButton type="submit" style={{ alignSelf: "flex-start" }}>
          {status === "saving" ? "Saving…" : "Save changes"}
        </RustButton>
        <StatusLine status={status} message={message} />
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// HUSH Preferences — a live summary; the actual editing surfaces stay on
// /profile (ranked issues, followed politicians) so there is exactly one
// place each of those is edited, not two.
// ---------------------------------------------------------------------------

function HushPreferencesSection({ topicPool }: { topicPool: string[] }) {
  const { topics, saved } = usePrefs();
  return (
    <Card style={{ padding: 20, display: "flex", flexDirection: "column", gap: 4 }}>
      <SectionHeader
        kicker="Personalization"
        title="HUSH Preferences"
        subtitle="These live on your Profile page — edit them there, they'll show up here too."
      />
      <div style={{ marginTop: 10 }}>
        <PrefRow
          label="Top issues"
          value={topics.length ? topics.join(", ") : "None selected yet"}
          href="/profile#top-issues"
          cta="Edit on Profile →"
        />
        <PrefRow
          label="Politicians you follow"
          value={`${saved.length} politician${saved.length === 1 ? "" : "s"}`}
          href="/profile#saved"
          cta="View on Profile →"
          last
        />
      </div>
      <span style={{ fontSize: 11, color: C.faint }}>
        Hush&apos;s full topic list has {topicPool.length} issues to choose from.
      </span>
    </Card>
  );
}

function PrefRow({
  label,
  value,
  href,
  cta,
  last = false,
}: {
  label: string;
  value: string;
  href: string;
  cta: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
        padding: "12px 0",
        borderBottom: last ? "none" : `1px solid ${C.line}`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 220 }}>
        <span style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {label}
        </span>
        <span style={{ fontSize: 13, color: C.ink }}>{value}</span>
      </div>
      <Link href={href} style={{ fontFamily: cond, fontSize: 13, color: C.navy, whiteSpace: "nowrap" }}>
        {cta}
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Email Preferences
// ---------------------------------------------------------------------------

const EMAIL_PREF_ROWS: { key: keyof EmailPrefs; label: string; desc: string }[] = [
  { key: "electionUpdates", label: "Election updates", desc: "Upcoming elections, deadlines and what's newly on your ballot." },
  { key: "issueUpdates", label: "Issue updates", desc: "Movement on the issues you've ranked or followed." },
  { key: "politicianUpdates", label: "Politician updates", desc: "News on the politicians you follow." },
  { key: "hushAnnouncements", label: "HUSH announcements", desc: "New features and how HUSH is doing." },
];

function EmailPreferencesSection() {
  const { emailPrefs, setEmailPref } = usePrefs();
  const anyOn = EMAIL_PREF_ROWS.some((r) => emailPrefs[r.key]);

  return (
    <Card style={{ padding: 20, display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <SectionHeader
          kicker="Notifications"
          title="Email Preferences"
          subtitle="Turn any of these off any time — it takes effect right away."
        />
        {anyOn ? (
          <button
            type="button"
            onClick={() => EMAIL_PREF_ROWS.forEach((r) => setEmailPref(r.key, false))}
            style={{ ...textLinkStyle, marginLeft: "auto" }}
          >
            Unsubscribe from all
          </button>
        ) : null}
      </div>
      <div style={{ marginTop: 10 }}>
        {EMAIL_PREF_ROWS.map((r, i) => (
          <div
            key={r.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 0",
              borderBottom: i < EMAIL_PREF_ROWS.length - 1 ? `1px solid ${C.line}` : "none",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
              <span style={{ fontSize: 13, color: C.ink }}>{r.label}</span>
              <span style={{ fontSize: 12, color: C.muted }}>{r.desc}</span>
            </div>
            <Chip on={emailPrefs[r.key]} onClick={() => setEmailPref(r.key, !emailPrefs[r.key])}>
              {emailPrefs[r.key] ? "On" : "Off"}
            </Chip>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Privacy
// ---------------------------------------------------------------------------

function PrivacyItem({ children }: { children: ReactNode }) {
  return <li style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>{children}</li>;
}

function PrivacySection() {
  return (
    <Card style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionHeader kicker="Privacy" title="Privacy" />
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
        <PrivacyItem>
          <strong style={{ color: C.ink }}>Your address</strong> is used to figure out your districts and
          pull up the races, candidates and local legislation that are actually on your ballot — it&apos;s
          never shown to other users or sold to anyone.
        </PrivacyItem>
        <PrivacyItem>
          <strong style={{ color: C.ink }}>Your top issues and the topics you follow</strong> shape what
          HUSH shows you first and how it scores how well a politician matches you — they&apos;re a
          personalization signal, not a political label attached to your account.
        </PrivacyItem>
        <PrivacyItem>You can update or clear any of this any time from this page or your Profile.</PrivacyItem>
      </ul>
      <Link href="/privacy" style={{ fontFamily: cond, fontSize: 13, color: C.navy }}>
        Read the full privacy policy →
      </Link>
    </Card>
  );
}
