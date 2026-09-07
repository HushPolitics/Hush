"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { C, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { useMounted } from "@/lib/hooks";
import { ELECTION_ISO } from "@/lib/seed-data";
import { createClient } from "@/lib/supabase/client";
import { jumpToSection, useScrollSpy, useSectionNavItems, type SectionNavItem } from "@/lib/sectionNav";
import { RustButton, SearchField } from "./ui";
import PersonalizeBanner from "./PersonalizeBanner";
import { HushScoreInfoProvider } from "./HushScoreInfo";

// Nav trimmed to three destinations plus the avatar menu (see AVATAR_MENU
// below). Unchanged from the sidebar era -- only the layout around it
// changed, from a vertical list to a horizontal one in the top bar.
const NAV = [
  { href: "/feed", label: "Feed" },
  { href: "/hush-guide", label: "HUSH Guide" },
  { href: "/stance-check", label: "Stance Check" },
];

const AVATAR_MENU = [
  { href: "/profile/top-issues", label: "My issues" },
  { href: "/following", label: "Following" },
  { href: "/profile/settings", label: "Account settings" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/feed") return pathname === "/feed" || pathname.startsWith("/politician");
  return pathname === href || pathname.startsWith(href + "/");
}

function daysToElection() {
  const ms = new Date(ELECTION_ISO).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 86400000));
}

/**
 * Routes that get the contextual left rail. `useRegisterSectionNav` (see
 * lib/sectionNav.tsx) is called by three views -- GuideView's tile grid,
 * PoliticianView, and StanceCheckView's summary screen -- but per the
 * top-bar brief only the first two get a rail; Stance Check keeps
 * registering its own summary sections (something else may read them
 * later) without AppShell rendering anything for them. Gating on the route
 * rather than "did the current page register anything" is what makes that
 * omission explicit rather than incidental to how sectionNav happens to work.
 */
function showsRail(pathname: string) {
  return pathname === "/hush-guide" || pathname.startsWith("/politician/");
}

// Sized to the longest section label across both rail routes -- "Bills
// being considered" (HUSH Guide) and "Claims checked" (politician page) --
// plus SectionJumpList's own "7px 10px 7px 22px" padding. Single source of
// truth so the rail's width is a one-line revert.
const RAIL_WIDTH = 200;

// Above this width the top bar's right-hand group (location, search,
// election day, avatar) has room for a full search field alongside
// everything else. Below it, search collapses to an icon that expands on
// click rather than any element being dropped -- see the brief.
//
// Measured against the live preview, not reasoned: the center nav column
// and the right group both sit in a "1fr auto 1fr" grid, so the right
// group's available track is (viewport - padding - gaps - navWidth) / 2.
// With the full search field the right group needs ~623px; that track
// only clears 623px once the viewport is ~1663px wide (navWidth measured
// at ~321px). Below that, the full-search layout visibly overlaps the
// center nav. 1720 keeps a ~28px safety margin above the measured
// breakeven for font-metric variance across browsers/OSes. Keep this in
// sync with the `max-width` in globals.css's matching media query.
const SEARCH_COLLAPSE_WIDTH = 1720;

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { zip, city, state, setZip, setCity, setState } = usePrefs();
  const [q, setQ] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cityDraft, setCityDraft] = useState(city);
  const [stateDraft, setStateDraft] = useState(state);
  const [zipDraft, setZipDraft] = useState(zip);
  // Rendered client-side only so the server and client markup agree.
  const mounted = useMounted();
  const days = mounted ? daysToElection() : null;

  // Section-nav zone: registered by whichever view is mounted below (see
  // lib/sectionNav.tsx). `mainRef` is the scroll-spy's observer root -- the
  // `.scroll` pane below is the real scrolling element, not the window.
  const mainRef = useRef<HTMLElement | null>(null);
  const sectionItems = useSectionNavItems();
  const activeSectionId = useScrollSpy(mainRef, sectionItems.map((i) => i.id));
  // Collapses gracefully (renders nothing, not an empty rail) on a rail
  // route that hasn't registered anything yet -- HUSH Guide's address/issues
  // onboarding steps render before the tile grid does -- same as the old
  // sidebar's section-nav zone did.
  const showRail = showsRail(pathname) && sectionItems.length > 0;

  function openLocationForm() {
    setCityDraft(city);
    setStateDraft(state);
    setZipDraft(zip);
    setLocationOpen(true);
  }

  function submitLocation() {
    if (cityDraft.trim()) setCity(cityDraft.trim());
    if (stateDraft.trim()) setState(stateDraft.trim());
    if (zipDraft.length === 5) setZip(zipDraft);
    setLocationOpen(false);
  }

  function submitSearch(v: string) {
    setQ(v);
    const target = v.trim() ? `/feed?q=${encodeURIComponent(v.trim())}` : "/feed";
    router.replace(target, { scroll: false });
  }

  // Accounts aren't switched on everywhere yet (see createClient's doc
  // comment) — when there's no Supabase client there's no real session to
  // end, so this just sends the visitor to /login rather than throwing.
  async function logOut() {
    setAvatarOpen(false);
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <HushScoreInfoProvider>
    <div
      className="app-shell"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        color: C.ink,
        background: C.cream,
      }}
    >
      {/*
        The top bar. A three-column grid (not flex) so the center nav group
        is genuinely centered regardless of how wide the left (logo) and
        right (location/search/election day/avatar) groups end up -- flex's
        `justify-content: space-between` can't do that once the two flanks
        are different widths. Outside `.scroll` below, so it never scrolls
        away -- same structural trick the old header/sidebar used, just
        without needing `position: sticky` to say so.
      */}
      <header
        className="app-topbar"
        style={{
          flex: "0 0 66px",
          height: 66,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          columnGap: 20,
          borderBottom: `1px solid ${C.line}`,
          padding: "0 28px",
          background: C.cream,
        }}
      >
        <Link
          href="/feed"
          className="topbar-logo"
          style={{ display: "flex", alignItems: "baseline", justifySelf: "start", color: C.ink }}
        >
          <span style={{ fontFamily: cond, fontWeight: 600, fontSize: 22, letterSpacing: "0.2em" }}>
            HUSH
          </span>
          <span style={{ fontFamily: cond, fontWeight: 600, fontSize: 22, color: C.rust }}>.</span>
        </Link>

        <nav
          className="topbar-nav"
          aria-label="Primary"
          style={{ display: "flex", gap: 4, justifySelf: "center" }}
        >
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
                  gap: 8,
                  padding: "9px 14px",
                  borderRadius: 8,
                  fontSize: 14,
                  whiteSpace: "nowrap",
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
          className="header-right"
          style={{ display: "flex", alignItems: "center", gap: 12, justifySelf: "end", minWidth: 0 }}
        >
          <div className="header-pill" style={{ position: "relative", flex: "0 0 auto" }}>
            <button
              type="button"
              onClick={() => (locationOpen ? setLocationOpen(false) : openLocationForm())}
              aria-haspopup="true"
              aria-expanded={locationOpen}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "7px 12px",
                border: "1px solid rgba(21,21,21,0.16)",
                borderRadius: 7,
                background: locationOpen ? C.hover : "transparent",
                fontSize: 13,
                whiteSpace: "nowrap",
                cursor: "pointer",
                color: C.ink,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.navy }} />
              {city} · {state} · {zip}
            </button>

            {locationOpen ? (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 9 }}
                  onClick={() => setLocationOpen(false)}
                />
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitLocation();
                  }}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    zIndex: 10,
                    width: 240,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    padding: 14,
                    border: `1px solid ${C.line}`,
                    borderRadius: 10,
                    background: C.white,
                    boxShadow: "0 8px 24px rgba(21,21,21,0.14)",
                  }}
                >
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12, color: C.muted }}>
                    City
                    <input
                      value={cityDraft}
                      onChange={(e) => setCityDraft(e.target.value)}
                      aria-label="City"
                      style={{
                        padding: "8px 10px",
                        border: "1px solid rgba(21,21,21,0.2)",
                        borderRadius: 6,
                        fontSize: 14,
                        color: C.ink,
                        outline: "none",
                      }}
                    />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12, color: C.muted }}>
                    State
                    <input
                      value={stateDraft}
                      onChange={(e) => setStateDraft(e.target.value.toUpperCase().slice(0, 2))}
                      maxLength={2}
                      aria-label="State"
                      style={{
                        padding: "8px 10px",
                        border: "1px solid rgba(21,21,21,0.2)",
                        borderRadius: 6,
                        fontSize: 14,
                        color: C.ink,
                        outline: "none",
                        textTransform: "uppercase",
                      }}
                    />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12, color: C.muted }}>
                    ZIP
                    <input
                      value={zipDraft}
                      onChange={(e) => setZipDraft(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
                      maxLength={5}
                      inputMode="numeric"
                      aria-label="ZIP code"
                      style={{
                        padding: "8px 10px",
                        border: "1px solid rgba(21,21,21,0.2)",
                        borderRadius: 6,
                        fontSize: 14,
                        color: C.ink,
                        outline: "none",
                      }}
                    />
                  </label>
                  <RustButton type="submit" style={{ padding: "8px 14px", fontSize: 12 }}>
                    Save
                  </RustButton>
                </form>
              </>
            ) : null}
          </div>

          {/*
            Search collapses to an icon below SEARCH_COLLAPSE_WIDTH (see
            that constant) rather than anything being dropped. The toggle
            button is only ever rendered while collapsed-and-closed, so
            there's no inline-vs-stylesheet specificity fight over
            `display` -- CSS alone hides `.topbar-search-field` by default
            in that width band and `.is-open` (added once `searchOpen` is
            true) overrides it; above the band neither rule applies and the
            field just shows, same as before this brief.
          */}
          {!searchOpen ? (
            <button
              type="button"
              className="topbar-search-toggle"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              style={{
                border: "1px solid rgba(21,21,21,0.16)",
                borderRadius: 7,
                background: "transparent",
                width: 34,
                height: 34,
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                color: C.faint,
                cursor: "pointer",
                flex: "0 0 auto",
              }}
            >
              <span aria-hidden>⌕</span>
            </button>
          ) : null}
          <div className={`topbar-search-field${searchOpen ? " is-open" : ""}`} style={{ minWidth: 0 }}>
            <SearchField
              value={q}
              onChange={submitSearch}
              placeholder="Search politicians, promises, or issues"
              className="header-search"
              style={{ width: 260 }}
            />
          </div>

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

          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setAvatarOpen((o) => !o)}
              aria-haspopup="true"
              aria-expanded={avatarOpen}
              aria-label="Account menu"
              className="header-avatar"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: 0,
                background: C.navy,
                color: C.sand,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: cond,
                fontSize: 13,
                cursor: "pointer",
                flex: "0 0 auto",
              }}
            >
              JR
            </button>

            {avatarOpen ? (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 9 }}
                  onClick={() => setAvatarOpen(false)}
                />
                <div
                  role="menu"
                  aria-label="Account menu"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    zIndex: 10,
                    minWidth: 190,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    padding: 6,
                    border: `1px solid ${C.line}`,
                    borderRadius: 10,
                    background: C.white,
                    boxShadow: "0 8px 24px rgba(21,21,21,0.14)",
                  }}
                >
                  {AVATAR_MENU.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setAvatarOpen(false)}
                      style={{
                        padding: "9px 10px",
                        borderRadius: 6,
                        fontSize: 13,
                        color: C.ink,
                      }}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <span style={{ height: 1, background: C.line, margin: "4px 2px" }} />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={logOut}
                    style={{
                      border: 0,
                      background: "transparent",
                      borderRadius: 6,
                      padding: "9px 10px",
                      textAlign: "left",
                      fontSize: 13,
                      color: C.rust,
                      cursor: "pointer",
                    }}
                  >
                    Log out
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <PersonalizeBanner />

      <div style={{ flex: 1, display: "flex", minWidth: 0, minHeight: 0 }}>
        {/*
          The contextual left rail -- only on HUSH Guide and a politician
          page (see showsRail above), and only once that page has actually
          registered sections to jump to. Every other route renders this as
          `null`, so content simply starts at the shell's left edge -- no
          reserved, permanently-empty column the way the old sidebar was.
        */}
        {showRail ? (
          <aside
            className="app-rail"
            style={{
              width: RAIL_WIDTH,
              flex: `0 0 ${RAIL_WIDTH}px`,
              borderRight: `1px solid ${C.line}`,
              padding: "18px 8px",
            }}
          >
            <SectionJumpList items={sectionItems} activeId={activeSectionId} />
          </aside>
        ) : null}

        <main ref={mainRef} className="scroll" style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>

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
        Illustrative placeholder data — HUSH. Scores, promise records and fact-check verdicts in this
        prototype are not real.
      </footer>
    </div>
    </HushScoreInfoProvider>
  );
}

/**
 * Section-nav jump links -- deliberately lighter than primary nav's solid
 * ink-filled active state (no fill at all when idle, a plain tint when
 * active, no party/rust dot) so the hierarchy between "a top-level
 * destination" and "a spot on this page" stays unmistakable at a glance.
 * Clicking scrolls to the section instead of navigating -- see
 * `jumpToSection` -- and the active item follows scroll position via
 * `activeId` (AppShell's scroll-spy), not the click itself.
 */
function SectionJumpList({ items, activeId }: { items: SectionNavItem[]; activeId: string | null }) {
  return (
    <nav aria-label="Section navigation" style={{ display: "flex", flexDirection: "column", gap: 1, padding: "10px 0" }}>
      {items.map((item) => {
        const on = activeId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => jumpToSection(item.id)}
            aria-current={on ? "true" : undefined}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "7px 10px 7px 14px",
              borderRadius: 7,
              border: 0,
              background: on ? C.hover : "transparent",
              color: on ? C.ink : C.muted,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
