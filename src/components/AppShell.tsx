"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { C, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { useMounted } from "@/lib/hooks";
import { DEFAULT_DISTRICT, ELECTION_ISO } from "@/lib/seed-data";
import { SearchField } from "./ui";

const NAV = [
  { href: "/", label: "Feed" },
  { href: "/compare", label: "Compare" },
  { href: "/ballot", label: "Ballot" },
  { href: "/fact-check", label: "Fact Check" },
  { href: "/saved", label: "Saved" },
  { href: "/profile", label: "Profile" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/politician");
  return pathname === href || pathname.startsWith(href + "/");
}

function daysToElection() {
  const ms = new Date(ELECTION_ISO).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 86400000));
}

export default function AppShell({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { zip } = usePrefs();
  const [q, setQ] = useState("");
  // Rendered client-side only so the server and client markup agree.
  const days = useMounted() ? daysToElection() : null;

  function submitSearch(v: string) {
    setQ(v);
    const target = v.trim() ? `/?q=${encodeURIComponent(v.trim())}` : "/";
    router.replace(target, { scroll: false });
  }

  return (
    <div
      className="app-shell"
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        color: C.ink,
        background: C.cream,
      }}
    >
      <aside
        className="app-sidebar"
        style={{
          width: 240,
          flex: "0 0 240px",
          background: C.sand,
          borderRight: `1px solid ${C.line}`,
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px 18px",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "baseline", padding: "0 8px", color: C.ink }}>
          <span style={{ fontFamily: cond, fontWeight: 600, fontSize: 28, letterSpacing: "0.22em" }}>
            HUSH
          </span>
          <span style={{ fontFamily: cond, fontWeight: 600, fontSize: 28, color: C.rust }}>.</span>
        </Link>
        <div style={{ height: 2, width: 46, margin: "8px 8px 26px", background: C.rust }} />

        <nav className="sidebar-nav" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map((item) => {
            const on = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="nav-item"
                aria-current={on ? "page" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 10,
                  borderRadius: 8,
                  fontSize: 14,
                  background: on ? C.ink : "transparent",
                  color: on ? C.sand : C.body,
                  fontWeight: on ? 600 : 500,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: on ? C.rust : "rgba(21,21,21,0.22)",
                  }}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          className="district-card"
          style={{
            marginTop: "auto",
            padding: 13,
            border: "1px solid rgba(21,21,21,0.14)",
            borderRadius: 10,
            background: "rgba(255,255,255,0.55)",
          }}
        >
          <div
            style={{
              fontFamily: cond,
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: C.rust,
            }}
          >
            Your district
          </div>
          <div style={{ fontFamily: cond, fontSize: 19 }}>
            {DEFAULT_DISTRICT.district} · {zip}
          </div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.4, marginTop: 3 }}>
            {DEFAULT_DISTRICT.county} · {DEFAULT_DISTRICT.raceCount} races on your ballot
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header
          className="app-header"
          style={{
            height: 66,
            flex: "0 0 66px",
            borderBottom: `1px solid ${C.line}`,
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "0 28px",
            background: C.cream,
          }}
        >
          <div
            className="header-title"
            style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0, overflow: "hidden" }}
          >
            <span
              style={{
                fontFamily: cond,
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: C.rust,
                whiteSpace: "nowrap",
              }}
            >
              {kicker}
            </span>
            <h1
              style={{
                fontFamily: cond,
                fontSize: 22,
                fontWeight: 400,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </h1>
          </div>

          <div
            className="header-pill"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "7px 12px",
              border: "1px solid rgba(21,21,21,0.16)",
              borderRadius: 7,
              fontSize: 13,
              whiteSpace: "nowrap",
              flex: "0 0 auto",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.navy }} />
            {DEFAULT_DISTRICT.city} · {zip}
          </div>

          <SearchField
            value={q}
            onChange={submitSearch}
            placeholder="Search politicians, promises, or issues"
            className="header-search"
            style={{ flex: 1, maxWidth: 430 }}
          />

          <div className="header-right" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <span
              className="header-days"
              style={{
                fontFamily: cond,
                fontSize: 12,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: C.muted,
                whiteSpace: "nowrap",
              }}
            >
              Nov 3 {days === null ? "" : `· ${days} days`}
            </span>
            <Link
              href="/profile"
              className="header-avatar"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: C.navy,
                color: C.sand,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: cond,
                fontSize: 13,
              }}
            >
              JR
            </Link>
          </div>
        </header>

        <main className="scroll" style={{ flex: 1, minHeight: 0 }}>
          {children}
        </main>

        <footer
          style={{
            flex: "0 0 34px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 28px",
            background: C.sand,
            borderTop: `1px solid ${C.line}`,
            fontSize: 11,
            color: C.muted,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.rust, flex: "0 0 6px" }} />
          Illustrative placeholder data — trust scores, promise records and fact-check verdicts in this
          prototype are not real.
        </footer>
      </div>
    </div>
  );
}
