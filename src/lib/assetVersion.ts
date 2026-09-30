/**
 * Cache-busting for static hero photos under /public/images.
 *
 * Feed/Guide/Stance Check/Politicians all swap their hero photo by
 * overwriting the same filename in place (see each page's own Hero doc
 * comment) so no code change is needed for a same-filename swap. The
 * tradeoff: browsers cache an <img> response against its URL, and an
 * unchanged filename means an unchanged URL, so a visitor who'd loaded the
 * page before a swap can keep seeing the old photo indefinitely -- a hard
 * refresh fixes it for them, but nobody should have to know that.
 *
 * versionedAsset() appends a query string derived from the deployed
 * commit, which Vercel exposes at build time as VERCEL_GIT_COMMIT_SHA.
 * Every deploy therefore gets a genuinely new URL for the same file,
 * so this is set-and-forget: it never needs touching again, on this swap
 * or any future one. Falls back to a fixed string outside Vercel (local
 * `next dev`/`next build`) where that env var isn't set.
 */

const ASSET_VERSION = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? "dev";

export function versionedAsset(path: string): string {
  return `${path}?v=${ASSET_VERSION}`;
}
