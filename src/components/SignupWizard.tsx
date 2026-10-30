"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { C, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { createClient } from "@/lib/supabase/client";
import { syncOnboardingToSupabase } from "@/lib/supabase/profile";
import { Kicker, RustButton } from "@/components/ui";

const TOTAL_STEPS = 2;

const fieldStyle = {
  padding: "11px 14px",
  border: "1px solid rgba(21,21,21,0.2)",
  borderRadius: 8,
  background: C.sandDeep,
  fontSize: 14,
  outline: "none",
} as const;

const STEP_LABEL: Record<number, string> = {
  1: "Create account",
  2: "Email preferences",
};

// `topicPool` is still passed by /signup but no longer used: address and issue
// ranking now happen inside HUSH. Guide, not here.
export default function SignupWizard(_props: { topicPool?: string[] }) {
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

  // Step 2 — Email preferences
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  // Finish
  const [finishing, setFinishing] = useState(false);

  // Already signed in: there is nothing to create, so send them to HUSH.
  // Guide, which picks up wherever their setup left off.
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setCheckingSession(false);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace("/hush-guide");
        return;
      }
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
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/hush-guide?welcome=1")}`,
      },
    });

    if (error) {
      setAccountStatus("error");
      setAccountMessage(error.message);
      return;
    }

    // Mirror into Prefs immediately — this is the only place these are
    // captured, and Profile Settings reads them from here, not from
    // component state that disappears once the wizard unmounts.
    prefs.setFirstName(firstName.trim());
    prefs.setLastName(lastName.trim());
    prefs.setEmail(email.trim());
    // A new account always starts HUSH. Guide from its first step: address
    // and ranked issues are collected there, not here.
    prefs.setGuideSetupDone(false);
    prefs.setOnboarded(false);

    setAccountStatus("idle");
    setStep(2);
  }

  async function finish() {
    setFinishing(true);
    prefs.setEmailPref("hushAnnouncements", marketingOptIn);
    // Best effort: with no session yet (email not confirmed) this just fails
    // quietly and the choice stays on this device.
    await syncOnboardingToSupabase({
      firstName,
      lastName,
      marketingEmailOptIn: marketingOptIn,
    });
    router.push("/hush-guide?welcome=1");
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
              <span>
                I agree to the HUSH.{" "}
                <Link href="/privacy-terms#terms" style={{ color: C.rust }}>
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy-terms#privacy" style={{ color: C.rust }}>
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <RustButton type="submit">
              {accountStatus === "sending" ? "Creating account…" : "Create account"}
            </RustButton>
            {accountStatus === "error" ? (
              <span style={{ fontSize: 12, color: C.rust, lineHeight: 1.5 }}>{accountMessage}</span>
            ) : null}

            {/* Passive notice required by 09-privacy-and-terms.md, in
                addition to (not instead of) the required checkbox above --
                the spec's line goes under the submit button regardless of
                the consent mechanism already in place. */}
            <span style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.5 }}>
              By creating an account, you agree to our{" "}
              <Link href="/privacy-terms#terms" style={{ color: C.rust }}>
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy-terms#privacy" style={{ color: C.rust }}>
                Privacy Policy
              </Link>
              .
            </span>
          </form>

          <span style={{ fontSize: 12, color: C.muted }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: C.rust }}>
              Log in
            </Link>
          </span>
        </div>
      ) : null}

      {step === 2 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: cond, fontSize: 24 }}>Want HUSH. to keep you informed?</span>
            <span style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>
              Occasional email about new features, elections coming up, and how HUSH. is doing.
              You can turn this off any time from Profile Settings.
            </span>
          </div>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, color: C.body, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              aria-label="Send me HUSH. updates"
              style={{ marginTop: 2, width: 15, height: 15, flex: "0 0 15px", accentColor: C.rust, cursor: "pointer" }}
            />
            <span>Send me HUSH. updates.</span>
          </label>

          <RustButton onClick={finish}>{finishing ? "Finishing up…" : "Continue to HUSH. Guide"}</RustButton>
        </div>
      ) : null}
    </div>
  );
}
