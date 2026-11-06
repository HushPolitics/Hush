"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

// Vercel Web Analytics, page views only (no track(), no custom events).
//
// This is a client component because beforeSend is a function, and a function
// cannot be passed from the server-rendered root layout into Analytics.
//
// Redaction: only the origin and path are ever sent. The query string and hash
// are dropped on every page view, so nothing like an auth code (?code=), a
// search the user typed (/feed?q=), a ?next= path, or a #access_token can reach
// Vercel. If the URL can't be parsed, the event is dropped instead of sent.
function redact(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    const url = new URL(event.url);
    url.search = "";
    url.hash = "";
    return { ...event, url: url.toString() };
  } catch {
    return null;
  }
}

export default function VercelAnalytics() {
  return <Analytics beforeSend={redact} />;
}
