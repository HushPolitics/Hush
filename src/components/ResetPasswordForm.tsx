"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

/**
 * Completes the "Forgot password?" flow. Reached via
 * /auth/callback?next=/reset-password, which has already exchanged the
 * reset-email's code for a live session by the time this renders — that
 * session is what makes updateUser({ password }) work here rather than
 * needing the old password.
 */
export default function ResetPasswordForm() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setChecking(false);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(Boolean(data.user));
      setChecking(false);
    });
  }, []);

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
    } else {
      setStatus("done");
      setMessage("Your password has been reset.");
      setTimeout(() => router.push("/feed"), 1200);
    }
  }

  if (checking) return null;

  if (!hasSession) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: C.body }}>
          This reset link is invalid or has expired.
        </p>
        <Link href="/login" style={{ fontSize: 13, color: C.navy }}>
          Back to sign in
        </Link>
      </div>
    );
  }

  if (status === "done") {
    return <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: C.navy }}>{message}</p>;
  }

  return (
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
      <RustButton type="submit">{status === "saving" ? "Saving…" : "Set new password"}</RustButton>
      {status === "error" ? (
        <span style={{ fontSize: 12, color: C.rust, lineHeight: 1.5 }}>{message}</span>
      ) : null}
    </form>
  );
}
