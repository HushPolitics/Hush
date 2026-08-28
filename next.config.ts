import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // /saved's content lives entirely on /profile now — keep old links/bookmarks working.
      { source: "/saved", destination: "/profile", permanent: true },
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
