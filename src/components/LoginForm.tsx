"use client";

import { useState } from "react";
import { C } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";
import { RustButton } from "./ui";

/**
 * Magic-link sign in.
 *
 * Passwordless on purpose: there is no password to store, reset or leak, and
 * for a civic tool the email is the only identifier that matters. Swapping in
 * OAuth later is one call to signInWithOAuth alongside this.
 */
export default function LoginForm() {
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
        style={{
          padding: "11px 14px",
          border: "1px solid rgba(21,21,21,0.2)",
          borderRadius: 8,
          background: C.sandDeep,
          fontSize: 14,
          outline: "none",
        }}
      />
      <RustButton type="submit">
        {status === "sending" ? "Sending…" : "Email me a link"}
      </RustButton>
      {status === "error" ? (
        <span style={{ fontSize: 12, color: C.rust, lineHeight: 1.5 }}>{message}</span>
      ) : null}
    </form>
  );
}
