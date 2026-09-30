"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { C, cond } from "@/lib/theme";
import { MK } from "@/lib/marketingTheme";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingTitleBar } from "@/components/marketing/TitleBar";
import { SectionLabel } from "@/components/marketing/SectionLabel";
import { FormField, FIELD_STYLE } from "@/components/marketing/FormField";

// File a Dispute (Step 8). Not in the header nav -- see MarketingHeader
// below, no `active` passed. Reached from the footer, from Our Methodology's
// "File a dispute" callout, and from the Contact page's own dispute link.
// No closing-quote section on this page, per spec.

type Status = "idle" | "sending" | "success" | "error";

type Fields = {
  name: string;
  email: string;
  claim: string;
  source: string;
  message: string;
  website: string; // honeypot -- real visitors never see or fill this
};

const EMPTY_FIELDS: Fields = { name: "", email: "", claim: "", source: "", message: "", website: "" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(fields: Fields): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!fields.email.trim() || !EMAIL_RE.test(fields.email.trim())) errors.email = "Enter a valid email address.";
  if (!fields.claim.trim()) errors.claim = "Tell us which claim or page.";
  if (!fields.source.trim()) errors.source = "A source is required.";
  if (!fields.message.trim()) errors.message = "Tell us what's wrong.";
  return errors;
}

// Owns all field/validation/send state for one submission. A fresh `key`
// from the parent (see DisputeSection) remounts this with clean state,
// which is simpler than lifting every field up just to clear them for
// "File another."
function DisputeForm({ onSuccess }: { onSuccess: () => void }) {
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function set<K extends keyof Fields>(key: K) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFields((f) => ({ ...f, [key]: e.target.value }));
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const fieldErrors = validate(fields);
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      const res = await fetch("/api/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) {
          setErrors(data.fieldErrors);
          setStatus("idle");
        } else {
          setErrorMessage(data.error || "Something went wrong. Please try again.");
          setStatus("error");
        }
        return;
      }
      setStatus("success");
      onSuccess();
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  const sending = status === "sending";

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }} noValidate>
      {/* Honeypot: invisible and unreachable to real visitors/screen readers,
          but a plain fillable field spam bots commonly target. */}
      <input
        type="text"
        name="website"
        value={fields.website}
        onChange={set("website")}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
      />

      <div className="form-row-2">
        <FormField label="Your name" optional>
          <input type="text" className="form-field" placeholder="Jane Doe" value={fields.name} onChange={set("name")} style={FIELD_STYLE} />
        </FormField>
        <FormField label="Email" error={errors.email}>
          <input type="email" className="form-field" placeholder="you@email.com" value={fields.email} onChange={set("email")} style={FIELD_STYLE} />
        </FormField>
      </div>

      <FormField label="Which claim or page?" error={errors.claim}>
        <input
          type="text"
          className="form-field"
          placeholder="Paste the link or name the politician and claim"
          value={fields.claim}
          onChange={set("claim")}
          style={FIELD_STYLE}
        />
      </FormField>

      <FormField label="Your source" error={errors.source}>
        <input
          type="text"
          className="form-field"
          placeholder="Link to the document, vote, or filing"
          value={fields.source}
          onChange={set("source")}
          style={FIELD_STYLE}
        />
      </FormField>

      <FormField label="What's wrong?" error={errors.message}>
        <textarea
          rows={5}
          className="form-field"
          placeholder="Tell us what the record actually shows"
          value={fields.message}
          onChange={set("message")}
          style={{ ...FIELD_STYLE, lineHeight: 1.5, resize: "vertical" }}
        />
      </FormField>

      {status === "error" ? <span style={{ fontSize: 14, color: C.rust }}>{errorMessage}</span> : null}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginTop: 4 }}>
        <span style={{ fontSize: 13, color: MK.muted }}>A primary source is required for a response.</span>
        <button
          type="submit"
          disabled={sending}
          className="wi-cta-dark"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "15px 24px",
            background: C.ink,
            color: MK.paper,
            border: "none",
            fontSize: 14,
            fontWeight: 700,
            cursor: sending ? "default" : "pointer",
            opacity: sending ? 0.7 : 1,
          }}
        >
          <span>{sending ? "Sending…" : "File a dispute"}</span>
          {sending ? null : <span>→</span>}
        </button>
      </div>
    </form>
  );
}

function DisputeSuccess({ onReset }: { onReset: () => void }) {
  return (
    <div>
      <span style={{ display: "block", fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.ink }}>
        Dispute received
      </span>
      <h3
        style={{
          margin: "14px 0 0",
          fontFamily: cond,
          fontWeight: 400,
          fontSize: "clamp(22px, 2.2vw, 30px)",
          lineHeight: 1.05,
          textTransform: "uppercase",
          letterSpacing: "-0.005em",
        }}
      >
        Thanks. We&rsquo;ll check it against the record.
      </h3>
      <p style={{ margin: "14px 0 0", fontSize: 15, lineHeight: 1.55, color: MK.body }}>
        Our response will be published next to the claim.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="marketing-underline-link"
        style={{
          marginTop: 22,
          background: "none",
          border: "none",
          borderBottom: `1.5px solid ${C.ink}`,
          padding: 0,
          fontSize: 14,
          fontWeight: 600,
          color: C.ink,
          cursor: "pointer",
        }}
      >
        File another
      </button>
    </div>
  );
}

function DisputeSection() {
  const [formKey, setFormKey] = useState(0);
  const [succeeded, setSucceeded] = useState(false);

  return (
    <section id="dispute" style={{ background: MK.paper, padding: "72px 34px", borderBottom: `1px solid ${MK.rule}`, scrollMarginTop: 130 }}>
      <div className="story-two-col" style={{ gridTemplateColumns: "minmax(0,0.85fr) minmax(0,1.15fr)", gap: 56, alignItems: "start" }}>
        <div>
          <SectionLabel>How to dispute something</SectionLabel>
          <h2
            style={{
              margin: "18px 0 0",
              fontFamily: cond,
              fontWeight: 400,
              fontSize: "clamp(32px, 3.6vw, 54px)",
              lineHeight: 0.98,
              textTransform: "uppercase",
              letterSpacing: "-0.005em",
              maxWidth: "14ch",
            }}
          >
            Send us the record.
          </h2>
          <p style={{ margin: "18px 0 0", fontSize: 17, lineHeight: 1.62, color: MK.body, maxWidth: "46ch", letterSpacing: "-0.008em" }}>
            Tell us which claim, and send the document that shows it. Disputes that come with a primary source get a
            written response, published next to the claim — whether we change it or not.
          </p>
        </div>
        <div style={{ background: MK.card, border: `1px solid ${MK.rule}`, padding: "28px 28px 30px" }}>
          {succeeded ? (
            <DisputeSuccess
              onReset={() => {
                setSucceeded(false);
                setFormKey((k) => k + 1);
              }}
            />
          ) : (
            <DisputeForm key={formKey} onSuccess={() => setSucceeded(true)} />
          )}
        </div>
      </div>
    </section>
  );
}

export default function Dispute() {
  return (
    <div style={{ background: C.ink }}>
      <MarketingHeader />
      <MarketingTitleBar eyebrow="File a Dispute" before="Think we got it" highlight="wrong?" />
      <DisputeSection />
      <MarketingFooter />
    </div>
  );
}
