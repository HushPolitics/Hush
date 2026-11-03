import type { MetadataRoute } from "next";

// Only rule: keep the unlisted /guides/ pages out of crawlers. Everything else
// stays crawlable, as it was before this file existed.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: "/guides/" } };
}
