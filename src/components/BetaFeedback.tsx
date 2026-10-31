"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { C, cond } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";
import { Chip, RustButton } from "@/components/ui";

type Kind = "bug" | "wrong_info" | "suggestion";

const KIND_LABEL: Record<Kind, string> = {
  bug: "Bug",
  wrong_info: "Wrong or missing info",
  suggestion: "Suggestion",
};

const PLACEHOLDER: Record<Kind, string> = {
  bug: "What happened, and what did you expect?",
  wrong_info: "What's wrong, missing or out of date? A link helps.",
  suggestion: "What would make HUSH. better for you?",
};

const EVENT = "hush:feedback";

/** Opens the feedback panel from anywhere, optionally pre-filled (used by the
 *  per-position "Report a problem" links). */
export function openFeedback(opts?: { kind?: Kind; context?: string }) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: opts ?? {} }));
}

/**
 * Beta pill, shown only to signed-in users. A small fixed tab in the corner
 * rather than a banner or popup, so it never interrupts the Guide. The panel
 * sends the page they were on (and, for position reports, which candidate and
 * issue) along with the message, so reports arrive with context.
 */
export default function BetaFeedback() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("bug");
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("");
  const [honey, setHoney] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setSignedIn(!!data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session?.user);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function onOpen(e: Event) {
      const d = (e as CustomEvent<{ kind?: Kind; context?: string }>).detail ?? {};
      setKind(d.kind ?? "bug");
      setContext(d.context ?? "");
      setState("idle");
      setError("");
      setOpen(true);
    }
    window.addEventListener(EVENT, onOpen);
    return () => window.removeEventListener(EVENT, onOpen);
  }, []);

  const hiddenRoute = pathname === "/login" || pathname === "/signup" || pathname.startsWith("/reset-password");
  if (!signedIn || hiddenRoute) return null;

  function close() {
    setOpen(false);
    if (state === "sent") {
      setMessage("");
      setContext("");
      setState("idle");
    }
  }

  async function send() {
    if (state === "sending") return;
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          message,
          context,
          website: honey,
          page: window.location.pathname + window.location.search.replace(/[?&]welcome=1/, ""),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        setState("sent");
      } else {
        setError(json.error || "Something went wrong. Please try again.");
        setState("error");
      }
    } catch {
      setError("Couldn't reach HUSH. Check your connection and try again.");
      setState("error");
    }
  }

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => openFeedback()}
          aria-label="Beta: send feedback"
          className="beta-pill"
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 14px",
            borderRadius: 999,
            border: `1px solid ${C.lineHard}`,
            background: C.white,
            color: C.ink,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(21,21,21,0.12)",
          }}
        >
          <span>
            <span style={{ color: C.rust }}>Beta</span> - Send Feedback
          </span>
        </button>
      ) : (
        <div
          role="dialog"
          aria-label="Send feedback"
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: 20,
            width: "min(360px, calc(100vw - 32px))",
            padding: 16,
            borderRadius: 12,
            border: `1px solid ${C.lineHard}`,
            background: C.white,
            boxShadow: "0 12px 32px rgba(21,21,21,0.18)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: cond, fontSize: 20 }}>Help us get it right</span>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              style={{ border: 0, background: "transparent", fontSize: 18, lineHeight: 1, cursor: "pointer", color: C.muted }}
            >
              ×
            </button>
          </div>

          {state === "sent" ? (
            <>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: C.body }}>
                Thank you. A person reads every one of these.
              </p>
              <RustButton onClick={close}>Done</RustButton>
            </>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: C.body }}>
                HUSH. is an early release through the election. Tell us what&apos;s broken, wrong or missing.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
                  <Chip key={k} on={kind === k} onClick={() => setKind(k)}>
                    {KIND_LABEL[k]}
                  </Chip>
                ))}
              </div>
              {context ? (
                <span style={{ fontSize: 12, color: C.muted }}>About: {context}</span>
              ) : null}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={PLACEHOLDER[kind]}
                rows={4}
                maxLength={4000}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: 10,
                  borderRadius: 8,
                  border: `1px solid ${C.lineHard}`,
                  fontSize: 14,
                  fontFamily: "inherit",
                  resize: "vertical",
                  background: C.white,
                  color: C.ink,
                }}
              />
              {/* Honeypot: hidden from people, filled by bots. */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={honey}
                onChange={(e) => setHoney(e.target.value)}
                style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }}
              />
              {state === "error" ? (
                <span role="alert" style={{ fontSize: 12, color: C.rust }}>
                  {error}
                </span>
              ) : null}
              <RustButton
                onClick={send}
                style={{ opacity: message.trim().length < 3 || state === "sending" ? 0.55 : 1 }}
              >
                {state === "sending" ? "Sending…" : "Send"}
              </RustButton>
              <span style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>
                We attach the page you&apos;re on and your account email so we can follow up.
              </span>
            </>
          )}
        </div>
      )}
    </>
  );
}
