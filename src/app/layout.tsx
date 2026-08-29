import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { PrefsProvider } from "@/lib/prefs";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-condensed",
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
  themeColor: "#FFFDF9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body>
        <PrefsProvider>{children}</PrefsProvider>
      </body>
    </html>
  );
}
