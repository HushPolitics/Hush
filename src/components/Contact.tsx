"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import { C, cond } from "@/lib/theme";
import { MK } from "@/lib/marketingTheme";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingTitleBar } from "@/components/marketing/TitleBar";
import { SectionLabel } from "@/components/marketing/SectionLabel";
import { FormField, FIELD_STYLE } from "@/components/marketing/FormField";

// Contact (Step 8). Not in the header nav -- see MarketingHeader below, no
// `active` passed. Reached only from the footer. No email/phone/other
// contact method is shown anywhere on the page -- the form is the only way
// in. No closing-quote section, per spec.

const TOPICS = [
  "General question",
  "Membership and billing",
  "Press",
  "Feedback on the product",
  "Something isn't working",
];

type Status = "idle" | "sending" | "success" | "error";

type Fields = {
  name: string;
  email: string;
  topic: string;
  message: string;
  website: string; // honeypot -- real visitors never see or fill this
};

const EMPTY_FIELDS: Fields = { name: "", email: "", topic: TOPICS[0], message: "", website: "" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(fields: Fields): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!fields.email.trim() || !EMAIL_RE.test(fields.email.trim())) errors.email = "Enter a valid email address.";
  if (!fields.topic || !TOPICS.includes(fields.topic)) errors.topic = "Choose what this is about.";
  if (!fields.message.trim()) errors.message = "Tell us what's on your mind.";
  return errors;
}

// Owns all field/validation/send state for one submission. A fresh `key`
// from the parent (see ContactSection) remounts this with clean state,
// the same pattern used on the Dispute page.
function ContactForm({ onSuccess }: { onSuccess: () => void }) {
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function set<K extends keyof Fields>(key: K) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      const res = await fetch("/api/contact", {
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
        <FormField label="Name">
          <input type="text" className="form-field" placeholder="Your name" value={fields.name} onChange={set("name")} style={FIELD_STYLE} />
        </FormField>
        <FormField label="Email" error={errors.email}>
          <input type="email" className="form-field" placeholder="you@email.com" value={fields.email} onChange={set("email")} style={FIELD_STYLE} />
        </FormField>
      </div>

      <FormField label="What's this about?" error={errors.topic}>
        <select className="form-field" value={fields.topic} onChange={set("topic")} style={{ ...FIELD_STYLE, appearance: "auto" }}>
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Message" error={errors.message}>
        <textarea
          rows={6}
          className="form-field"
          placeholder="Tell us what's on your mind"
          value={fields.message}
          onChange={set("message")}
          style={{ ...FIELD_STYLE, lineHeight: 1.5, resize: "vertical" }}
        />
      </FormField>

      {status === "error" ? <span style={{ fontSize: 14, color: C.rust }}>{errorMessage}</span> : null}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginTop: 4 }}>
        <span style={{ fontSize: 13, color: MK.muted }}>A person reads every message.</span>
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
          <span>{sending ? "Sending…" : "Send message"}</span>
          {sending ? null : <span>→</span>}
        </button>
      </div>
    </form>
  );
}

function ContactSuccess({ onReset }: { onReset: () => void }) {
  return (
    <div>
      <span style={{ display: "block", fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.rust }}>
        Message sent
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
        Thanks. We&rsquo;ll be in touch.
      </h3>
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
        Send another
      </button>
    </div>
  );
}

function ContactSection() {
  const [formKey, setFormKey] = useState(0);
  const [succeeded, setSucceeded] = useState(false);

  return (
    <section style={{ background: MK.paper, padding: "84px 34px 96px", borderBottom: `1px solid ${MK.rule}` }}>
      <div className="story-two-col" style={{ gridTemplateColumns: "minmax(0,0.85fr) minmax(0,1.15fr)", gap: 64, alignItems: "start" }}>
        <div>
          <SectionLabel>Get in touch</SectionLabel>
          <h2
            style={{
              margin: "18px 0 0",
              fontFamily: cond,
              fontWeight: 400,
              fontSize: "clamp(32px, 3.6vw, 54px)",
              lineHeight: 0.96,
              textTransform: "uppercase",
              letterSpacing: "-0.005em",
              maxWidth: "12ch",
            }}
          >
            We read every message.
          </h2>
          <p style={{ margin: "18px 0 0", fontSize: 17, lineHeight: 1.62, color: MK.body, maxWidth: "42ch", letterSpacing: "-0.008em" }}>
            Questions, feedback, or something that isn&rsquo;t working. Send it here and a person will get back to
            you.
          </p>
          <div
            style={{
              marginTop: 28,
              borderTop: `2px solid ${C.ink}`,
              borderBottom: `1px solid ${MK.rule}`,
              padding: "15px 0",
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) auto",
              gap: 16,
              alignItems: "baseline",
            }}
          >
            <span style={{ fontSize: 15.5, fontWeight: 700, color: C.ink }}>Think we got something wrong?</span>
            <Link href="/dispute" className="hiw-card-link" style={{ fontSize: 14.5, fontWeight: 600, color: C.rust, textDecoration: "none" }}>
              File a dispute →
            </Link>
          </div>
        </div>
        <div style={{ background: MK.card, border: `1px solid ${MK.rule}`, padding: "30px 30px 32px" }}>
          {succeeded ? (
            <ContactSuccess
              onReset={() => {
                setSucceeded(false);
                setFormKey((k) => k + 1);
              }}
            />
          ) : (
            <ContactForm key={formKey} onSuccess={() => setSucceeded(true)} />
          )}
        </div>
      </div>
    </section>
  );
}

export default function Contact() {
  return (
    <div style={{ background: C.ink }}>
      <MarketingHeader />
      <MarketingTitleBar eyebrow="Contact" before="Talk to a real" highlight="person." />
      <ContactSection />
      <MarketingFooter />
    </div>
  );
}
