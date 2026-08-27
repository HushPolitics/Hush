"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { C, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { rankWeights } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/client";
import { syncOnboardingToSupabase } from "@/lib/supabase/profile";
import { Bar, Chip, GhostButton, Kicker, RustButton } from "@/components/ui";

const TOTAL_STEPS = 5;
const MAX_RANKED_TOPICS = 5;

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
  fontSize: 13,
  color: C.muted,
  textDecoration: "underline",
  cursor: "pointer",
};

const STEP_LABEL: Record<number, string> = {
  1: "Create account",
  2: "Where you live",
  3: "Personalize your Hush",
  4: "Email preferences",
  5: "Privacy",
};

export default function SignupWizard({ topicPool }: { topicPool: string[] }) {
  const router = useRouter();
  const prefs = usePrefs();

  const [checkingSession, setCheckingSession] = useState(true);
  const [step, setStep] = useState(1);

  // Step 1 — Create Account
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tosAccepted, setTosAccepted] = useState(false);
  const [accountStatus, setAccountStatus] = useState<"idle" | "sending" | "error">("idle");
  const [accountMessage, setAccountMessage] = useState("");

  // Step 2 — Address
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  // Step 3 — Personalize
  const [capNote, setCapNote] = useState(false);

  // Step 4 — Email preferences
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  // Step 5 — Finish
  const [finishing, setFinishing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [finishMessage, setFinishMessage] = useState("");

  // Already signed in (e.g. arrived here from "finish personalizing" after
  // confirming email) — skip straight past account creation.
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setCheckingSession(false);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setStep(2);
      setCheckingSession(false);
    });
  }, []);

  async function submitAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!tosAccepted) {
      setAccountStatus("error");
      setAccountMessage("You need to agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setAccountStatus("error");
      setAccountMessage("Accounts are not switched on yet — the backend is still being wired up.");
      return;
    }

    setAccountStatus("sending");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setAccountStatus("error");
      setAccountMessage(error.message);
      return;
    }

    setAccountStatus("idle");
    setStep(2);
  }

  function continueAddress() {
    if (streetAddress.trim()) prefs.setStreetAddress(streetAddress.trim());
    if (city.trim()) prefs.setCity(city.trim());
    if (state.trim()) prefs.setState(state.trim().toUpperCase().slice(0, 2));
    if (zip.length === 5) prefs.setZip(zip);
    setStep(3);
  }

  function toggleRankedTopic(name: string) {
    if (!prefs.topics.includes(name) && prefs.topics.length >= MAX_RANKED_TOPICS) {
      setCapNote(true);
      return;
    }
    setCapNote(false);
    prefs.toggleTopic(name);
  }

  const ranked = rankWeights(prefs.topics);

  async function finish() {
    setFinishing(true);
    prefs.setOnboarded(true);
    const synced = await syncOnboardingToSupabase({
      firstName,
      lastName,
      streetAddress: prefs.streetAddress,
      city: prefs.city,
      state: prefs.state,
      marketingEmailOptIn: marketingOptIn,
      rankedTopics: prefs.topics,
      markOnboarded: true,
    });
    setFinishing(false);
    setFinished(true);
    setFinishMessage(
      synced
        ? "You're all set."
        : "Saved on this device — check your email to confirm your account, then sign in to sync everything.",
    );
  }

  if (checkingSession) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <Kicker>
          Step {step} of {TOTAL_STEPS}
        </Kicker>
        <span style={{ height: 1, flex: 1, background: C.line }} />
      </div>

      {step === 1 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: cond, fontSize: 24 }}>{STEP_LABEL[1]}</span>
            <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
              Just the basics — we&apos;ll get to what you care about after.
            </span>
          </div>

          <form onSubmit={submitAccount} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                aria-label="First name"
                style={{ ...fieldStyle, flex: 1 }}
              />
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                aria-label="Last name"
                style={{ ...fieldStyle, flex: 1 }}
              />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
              style={fieldStyle}
            />
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (at least 8 characters)"
              aria-label="Password"
              style={fieldStyle}
            />

            <label style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 12, color: C.body, lineHeight: 1.5, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={tosAccepted}
                onChange={(e) => setTosAccepted(e.target.checked)}
                required
                aria-label="Agree to Terms of Service and Privacy Policy"
                style={{ marginTop: 2, width: 15, height: 15, flex: "0 0 15px", accentColor: C.rust, cursor: "pointer" }}
              />
              <span>I agree to HUSH&apos;s Terms of Service and Privacy Policy.</span>
            </label>

            <RustButton type="submit">
              {accountStatus === "sending" ? "Creating account…" : "Create account"}
            </RustButton>
            {accountStatus === "error" ? (
              <span style={{ fontSize: 12, color: C.rust, lineHeight: 1.5 }}>{accountMessage}</span>
            ) : null}
          </form>

          <span style={{ fontSize: 12, color: C.muted }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: C.navy }}>
              Log in
            </Link>
          </span>
        </div>
      ) : null}

      {step === 2 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: cond, fontSize: 24 }}>Where do you live?</span>
            <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
              This is how HUSH finds your federal, state and local voting districts — what&apos;s
              actually on your ballot, the legislation moving through your city and state, and the
              elected officials who represent you. You can skip this and add it later; until you
              do, HUSH shows a general preview district instead of yours.
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={labelStyle}>
              Street address
              <input
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="123 Main St"
                aria-label="Street address"
                style={fieldStyle}
              />
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <label style={{ ...labelStyle, flex: 1 }}>
                City
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Austin"
                  aria-label="City"
                  style={fieldStyle}
                />
              </label>
              <label style={{ ...labelStyle, width: 70 }}>
                State
                <input
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                  maxLength={2}
                  placeholder="TX"
                  aria-label="State"
                  style={{ ...fieldStyle, textTransform: "uppercase" }}
                />
              </label>
              <label style={{ ...labelStyle, width: 100 }}>
                ZIP
                <input
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
                  maxLength={5}
                  inputMode="numeric"
                  placeholder="78701"
                  aria-label="ZIP code"
                  style={fieldStyle}
                />
              </label>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <RustButton onClick={continueAddress} style={{ flex: 1 }}>
              Continue
            </RustButton>
            <GhostButton onClick={() => setStep(3)}>Skip for now</GhostButton>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: cond, fontSize: 24 }}>What matters most to you?</span>
            <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
              Pick up to {MAX_RANKED_TOPICS} issues, then use the arrows to put them in the order
              you care about most. HUSH uses this to match you with politicians and rank what
              shows up in your feed — not to guess your politics or hand you a label.
            </span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {topicPool.map((name) => (
              <Chip key={name} on={prefs.topics.includes(name)} onClick={() => toggleRankedTopic(name)}>
                {name}
              </Chip>
            ))}
          </div>
          {capNote ? (
            <span style={{ fontSize: 12, color: C.rust }}>
              That&apos;s {MAX_RANKED_TOPICS} — remove one to add another.
            </span>
          ) : null}

          {ranked.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Kicker size={10}>Your order</Kicker>
              {ranked.map((i, idx) => (
                <div key={i.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: cond, fontSize: 14, color: C.tan, width: 14 }}>{i.rank}</span>
                  <span
                    style={{
                      fontSize: 13,
                      width: 130,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {i.name}
                  </span>
                  <Bar pct={Math.min(100, i.pct)} color={C.navy} />
                  <button
                    type="button"
                    className="link-quiet"
                    onClick={() => prefs.moveTopic(idx, -1)}
                    aria-label={`Move ${i.name} up`}
                    style={{ border: 0, background: "transparent", color: C.muted, cursor: "pointer", fontSize: 13, padding: 8 }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="link-quiet"
                    onClick={() => prefs.moveTopic(idx, 1)}
                    aria-label={`Move ${i.name} down`}
                    style={{ border: 0, background: "transparent", color: C.muted, cursor: "pointer", fontSize: 13, padding: 8 }}
                  >
                    ↓
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 13, color: C.muted }}>
              Pick a few topics above and they&apos;ll show up here, ranked.
            </span>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <RustButton onClick={() => setStep(4)} style={{ flex: 1 }}>
              Continue
            </RustButton>
            <GhostButton onClick={() => setStep(4)}>Skip for now</GhostButton>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: cond, fontSize: 24 }}>Want HUSH to keep you informed?</span>
            <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
              Occasional email about new features, elections coming up, and how HUSH is doing.
              You can turn this off any time from Profile Settings.
            </span>
          </div>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, color: C.body, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              aria-label="Send me HUSH updates"
              style={{ marginTop: 2, width: 15, height: 15, flex: "0 0 15px", accentColor: C.rust, cursor: "pointer" }}
            />
            <span>Send me HUSH updates.</span>
          </label>

          <RustButton onClick={() => setStep(5)}>Continue</RustButton>
        </div>
      ) : null}

      {step === 5 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: cond, fontSize: 24 }}>Your privacy</span>
            <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
              Here&apos;s the short version of how we use what you told us:
            </span>
          </div>

          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            <li style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
              <strong style={{ color: C.ink }}>Your address</strong> is used to figure out your
              districts and pull up the races, candidates and local legislation that are actually
              on your ballot — it&apos;s never shown to other users or sold to anyone.
            </li>
            <li style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
              <strong style={{ color: C.ink }}>Your ranked issues</strong> shape what HUSH shows
              you first and how it scores how well a politician matches you — they&apos;re a
              personalization signal, not a political label attached to your account.
            </li>
            <li style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
              You can update or clear either one any time from Profile Settings.
            </li>
          </ul>

          {finished ? (
            <>
              <span style={{ fontSize: 13, color: C.navy, lineHeight: 1.5 }}>{finishMessage}</span>
              <RustButton onClick={() => router.push("/feed")}>Continue to HUSH</RustButton>
            </>
          ) : (
            <RustButton onClick={finish}>{finishing ? "Finishing up…" : "Finish"}</RustButton>
          )}
        </div>
      ) : null}
    </div>
  );
}
