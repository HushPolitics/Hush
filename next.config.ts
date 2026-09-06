import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // /saved's content lived on /profile, which is retired (app IA
      // restructure phase 1) — the followed-politicians list it showed now
      // lives at /following instead.
      { source: "/saved", destination: "/following", permanent: true },
      // Profile itself is retired: My issues and Following moved into the
      // avatar menu, Account settings kept its own route, and the two
      // Profile-only blocks (Your HUSH Guide, Related Fact Checks) were
      // dropped as duplicates of sections that already exist elsewhere.
      { source: "/profile", destination: "/feed", permanent: true },
      // Voter's Guide moved from /ballot to /voters-guide.
      { source: "/ballot", destination: "/voters-guide", permanent: true },
      // Voter's Guide was renamed to Your Ballot, moving from /voters-guide to /your-ballot.
      { source: "/voters-guide", destination: "/your-ballot", permanent: true },
      // HUSH Guide moved from /guide to /hush-guide.
      { source: "/guide", destination: "/hush-guide", permanent: true },
      { source: "/guide/:raceId", destination: "/hush-guide/:raceId", permanent: true },
    ];
  },
};

export default nextConfig;
