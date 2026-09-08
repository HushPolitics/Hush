import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PrefsProvider } from "@/lib/prefs";
import { C } from "@/lib/theme";
import "./globals.css";

// Brand-kit token swap (brand-tokens-v1): Geist replaces Barlow/Barlow
// Condensed. The CSS variable names stay --font-barlow/--font-condensed on
// purpose -- every component that already reads them, including theme.ts's
// `cond` export used everywhere for display type, keeps working untouched.
// Renaming the variables would mean finding and updating every call site
// for no real benefit; repointing them here is the surgical version.
// Weights are widened to 700/800/900 to cover the kit's type scale, which
// uses 900 for display/section heads and 800 for card heads -- both
// heavier than anything Barlow Condensed was loading before. Without these,
// headline-scale text renders as a browser-synthesized fake bold instead of
// the real heavy cut.
const barlow = Geist({
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = Geist({
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
  variable: "--font-condensed",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
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
