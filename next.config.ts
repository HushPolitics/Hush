import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // /saved's content lives entirely on /profile now — keep old links/bookmarks working.
      { source: "/saved", destination: "/profile", permanent: true },
      // Voter's Guide moved from /ballot to /voters-guide.
      { source: "/ballot", destination: "/voters-guide", permanent: true },
    ];
  },
};

export default nextConfig;
