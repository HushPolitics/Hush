"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";
import { RustButton } from "./ui";

const fieldStyle = {
  padding: "11px 14px",
  border: "1px solid rgba(21,21,21,0.2)",
  borderRadius: 8,
  background: C.sandDeep,
  fontSize: 14,
  outline: "none",
} as const;

const textLinkStyle = {
  border: 0,
  background: "transparent",
  padding: 0,
  fontSize: 12,
  color: C.muted,
  textDecoration: "underline",
  cursor: "pointer",
  textAlign: "left" as const,
};

/**
 * Password is the default sign-in method now — a returning voter shouldn't
 * need to leave the app to find an email every time. The magic-link flow
 * below is unchanged; it's just reached via "Email me a sign-in link
 * instead" rather than being the only option.
 */
export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "otp">("password");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<"idle" | "sending" | "error">("idle");
  const [pwMessage, setPwMessage] = useState("");

  const [forgotStatus, setForgotStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [forgotMessage, setForgotMessage] = useState("");

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setPwStatus("error");
      setPwMessage("Accounts are not switched on yet — the backend is still being wired up.");
      return;
    }

    setPwStatus("sending");
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setPwStatus("error");
      setPwMessage(error.message);
    } else {
      router.push("/feed");
    }
  }

  async function requestPasswordReset() {
    const supabase = createClient();
    if (!supabase) {
      setForgotStatus("error");
      setForgotMessage("Accounts are not switched on yet — the backend is still being wired up.");
      return;
    }
    if (!email) {
      setForgotStatus("error");
      setForgotMessage('Enter your email above, then click "Forgot password?" again.');
      return;
    }

    setForgotStatus("sending");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setForgotStatus("error");
      setForgotMessage(error.message);
    } else {
      setForgotStatus("sent");
      setForgotMessage(`Check ${email} for a password reset link.`);
    }
  }

  if (forgotStatus === "sent") {
    return <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: C.navy }}>{forgotMessage}</p>;
  }

  if (mode === "otp") {
    return <OtpForm onBack={() => setMode("password")} />;
  }

  return (
    <form onSubmit={submitPassword} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        aria-label="Password"
        style={fieldStyle}
      />
      <RustButton type="submit">{pwStatus === "sending" ? "Signing in…" : "Sign in"}</RustButton>
      {pwStatus === "error" ? (
        <span style={{ fontSize: 12, color: C.rust, lineHeight: 1.5 }}>{pwMessage}</span>
      ) : null}
      {forgotStatus === "error" ? (
        <span style={{ fontSize: 12, color: C.rust, lineHeight: 1.5 }}>{forgotMessage}</span>
      ) : null}

      <button
        type="button"
        className="link-quiet"
        onClick={requestPasswordReset}
        style={textLinkStyle}
      >
        {forgotStatus === "sending" ? "Sending…" : "Forgot password?"}
      </button>

      <div style={{ height: 1, background: C.line, margin: "2px 0" }} />

      <button
        type="button"
        className="link-quiet"
        onClick={() => setMode("otp")}
        style={textLinkStyle}
      >
        Email me a sign-in link instead
      </button>
    </form>
  );
}

/**
 * Magic-link sign in — unchanged from the original passwordless flow, just
 * reached as a secondary path now instead of being LoginForm's only mode.
 */
function OtpForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setStatus("error");
      setMessage("Accounts are not switched on yet — the backend is still being wired up.");
      return;
    }

    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
      setMessage(`Check ${email} for a sign-in link.`);
    }
  }

  if (status === "sent") {
    return (
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: C.navy }}>{message}</p>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        aria-label="Email address"
        style={fieldStyle}
      />
      <RustButton type="submit">
        {status === "sending" ? "Sending…" : "Email me a link"}
      </RustButton>
      {status === "error" ? (
        <span style={{ fontSize: 12, color: C.rust, lineHeight: 1.5 }}>{message}</span>
      ) : null}
      <button type="button" className="link-quiet" onClick={onBack} style={textLinkStyle}>
        Sign in with a password instead
      </button>
    </form>
  );
}
