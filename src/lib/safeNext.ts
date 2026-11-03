/**
 * A `next` value that is safe to redirect to: an in-app path only. Anything
 * else (another site, protocol-relative, backslashes, control characters)
 * returns null so callers fall back to their normal destination.
 */
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 300) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return null;
  return raw;
}

/** `next` from the current page's query string (client only). */
export function nextFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  return safeNext(new URLSearchParams(window.location.search).get("next"));
}
