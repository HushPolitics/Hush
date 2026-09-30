import { NextResponse, type NextRequest } from "next/server";
import { sendMail } from "@/lib/mailer";
import { checkRateLimit } from "@/lib/rateLimit";

// Never rendered or sent to the client -- see 08-dispute-and-contact.md:
// "Never show this address on the page."
const RECIPIENT = "hunter@hushpolitics.com";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOPICS = [
  "General question",
  "Membership and billing",
  "Press",
  "Feedback on the product",
  "Something isn't working",
];

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: see dispute route for the same pattern.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`contact:${ip}`)) {
    return NextResponse.json({ ok: false, error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  const errors: Record<string, string> = {};
  if (!email || !EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (!topic || !TOPICS.includes(topic)) errors.topic = "Choose what this is about.";
  if (!message) errors.message = "Tell us what's on your mind.";
  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, fieldErrors: errors }, { status: 400 });
  }

  const subject = `HUSH. · ${topic}`;
  const text = [message, "", "—", name || "(no name given)", email].join("\n");

  try {
    // Reply-To set to the submitter's email per spec, so replies go
    // straight to them.
    await sendMail({ to: RECIPIENT, subject, text, replyTo: email });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("contact send failed:", detail);
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
