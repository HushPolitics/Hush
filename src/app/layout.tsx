import type { Metadata, Viewport } from "next";
import { Archivo_Black, Inter, IBM_Plex_Mono } from "next/font/google";
import { PrefsProvider } from "@/lib/prefs";
import { C } from "@/lib/theme";
import "./globals.css";

// Brand-kit token swap (brand-tokens-v2, HUSH. Brand Guidelines Draft 1).
// Same surgical approach as the v1 pass: CSS variable names stay
// --font-barlow/--font-condensed/--font-mono so no call site needs to
// change just because the underlying font changed.
//
// Role split narrows here versus before: --font-condensed (theme.ts's
// `cond` export) is now Archivo Black, reserved for real display headlines
// and the wordmark only -- NOT the broad "every uppercase label/tag/button"
// role `cond` played before. That migration is Phase 3, not this file.
// --font-barlow (body text, and now also small UI labels at a semibold
// weight per your call) is Inter. --font-mono, loaded but unused since the
// v1 pass, is now IBM Plex Mono -- reserved for sourcing/citations only.
const barlow = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

// Archivo Black ships as a single cut (no weight variants -- it's a
// display-only face, the same way Barlow Condensed's heaviest weight was
// used for headlines before). Requesting anything other than "400" here
// will error; the font itself renders as visually black/900 regardless.
const barlowCondensed = Archivo_Black({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-condensed",
  display: "swap",
});

const geistMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hushpolitics.com"),
  title: {
    default: "Hush — know who you're voting for",
    template: "%s · Hush",
  },
  description:
    "Hush matches you with the politicians on your ballot by the issues you care about, and scores every one of them on whether they follow through on what they promised.",
  openGraph: {
    title: "Hush — know who you're voting for",
    description:
      "Value matching and promise-tracking HUSH. Scores for every race on your ballot.",
    url: "https://hushpolitics.com",
    siteName: "Hush",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: C.cream,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable} ${geistMono.variable}`}>
      <body>
        <PrefsProvider>{children}</PrefsProvider>
      </body>
    </html>
  );
}
