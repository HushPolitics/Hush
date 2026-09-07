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
import { FEED_SCOPES, useFeedScope } from "@/lib/feedScope";
import { RustButton, SearchField } from "./ui";
import PersonalizeBanner from "./PersonalizeBanner";
import { HushScoreInfoProvider } from "./HushScoreInfo";

// Nav trimmed to three destinations plus the avatar menu (see AVATAR_MENU
// below) — Compare and the politician page are reached from other pages now
// rather than being top-level tabs, Fact Check's own page is going away
// (its card renders in three other places instead), and Profile has split
// three ways (My issues / Following live in the avatar menu, Account
// settings keeps its own route). None of those routes were deleted here —
// only their nav entries — except where a phase below says otherwise.
const NAV = [
  { href: "/feed", label: "Feed" },
  { href: "/hush-guide", label: "HUSH Guide" },
  { href: "/stance-check", label: "Stance Check" },
];

// Sized to its contents, not to a nav several times this length. 188px is
// the narrowest value in the brief's 180-200px range that comfortably fits
// the longest label ("Stance Check", ~84.5px at the active item's 600
// weight in Barlow 14px) with room to spare: 16px aside padding + 10px item
// padding + 6px dot + 10px dot-gap + 84.5px text ≈ 153px needed, leaving
// ~30px of trailing space per row at 188px -- enough that nothing feels
// cramped, without reintroducing the old 240px's ~88px of dead space per
// row. Single source of truth so reverting this change is a one-line edit.
const SIDEBAR_WIDTH = 188;

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
  const { zip, city, state, setZip, setCity, setState } = usePrefs();
  const [q, setQ] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
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
  // Feed's scope filter takes over this zone instead of jump links while on
  // /feed -- see FeedScopeList below and the doc comment on GUIDE_SECTIONS'
  // sibling in FeedView.tsx.
  const onFeed = pathname === "/feed";

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
        height: "100vh",
        width: "100%",
        color: C.ink,
        background: C.cream,
      }}
    >
      <aside
        className="app-sidebar"
        style={{
          width: SIDEBAR_WIDTH,
          flex: `0 0 ${SIDEBAR_WIDTH}px`,
          background: C.sand,
          borderRight: `1px solid ${C.line}`,
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px 18px",
        }}
      >
        <Link href="/feed" style={{ display: "flex", alignItems: "baseline", padding: "0 8px", color: C.ink }}>
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
                  // Vertical padding trimmed from the original 10px so the
                  // three-item group reads as compact at the narrower rail
                  // width instead of loose; horizontal padding is untouched
                  // -- it's part of SIDEBAR_WIDTH's fit math above.
                  padding: "7px 10px",
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

        {/*
          Section navigation: a second, lighter-weight nav zone below primary
          nav, showing where you are within the current page rather than
          another top-level destination -- see lib/sectionNav.tsx. Renders
          nothing (not an empty box) on a route with nothing to show, so the
          sidebar collapses gracefully instead of leaving a gap. On /feed
          this zone is taken over by the scope filter list instead of jump
          links -- different job (changes what the page shows, not where you
          scroll to), so it's styled to look different too (solid ink fill,
          matching primary nav's own active treatment, rather than the jump
          links' plain tint). Hidden below the tablet breakpoint -- see the
          `.sidebar-section-nav` rule in globals.css and this PR's notes on
          why (no bottom-tab-bar destination for it exists yet).
        */}
        <div className="sidebar-section-nav">
          {onFeed ? (
            <FeedScopeList />
          ) : sectionItems.length > 0 ? (
            <SectionJumpList items={sectionItems} activeId={activeSectionId} />
          ) : null}
        </div>

        {/*
          Quiet bottom anchor -- gives the rail a bottom edge without adding
          a feature. The election countdown card (and the district box
          before it, see git history) that used to sit here is gone: three
          items anchored at the top plus this one line is the whole rail
          now. Plain text, not a control -- the header's location pill is
          still the only way to edit it. `city`/`state`/`zip` come from
          `usePrefs`, whose server snapshot already resolves to real
          defaults (see lib/prefs.tsx), so this doesn't need `mounted`
          gating the way the old countdown card did.
        */}
        <div
          className="sidebar-location-anchor"
          style={{
            marginTop: "auto",
            padding: "14px 8px 0",
            fontSize: 11,
            lineHeight: 1.5,
            color: C.faint,
          }}
        >
          {city} · {state} · {zip}
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
                    left: 0,
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

        <main ref={mainRef} className="scroll" style={{ flex: 1, minHeight: 0 }}>
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
          Illustrative placeholder data — HUSH. Scores, promise records and fact-check verdicts in this
          prototype are not real.
        </footer>
      </div>
    </div>
    </HushScoreInfoProvider>
  );
}

/**
 * Section-nav jump links — deliberately lighter than primary nav's solid
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
              padding: "7px 10px 7px 22px",
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

/**
 * The Feed's scope filter (My ballot / My issues / Following), moved here
 * from horizontal chips inside FeedView -- see lib/feedScope.ts. Styled to
 * read as a set of *filters* rather than jump links: a solid ink fill on
 * the active one, the same visual weight primary nav's active item uses,
 * because picking one changes what the page shows rather than just
 * scrolling to a spot on it. Only rendered while on /feed (see `onFeed`
 * above).
 */
function FeedScopeList() {
  const [scope, setScope] = useFeedScope();
  return (
    <nav aria-label="Feed filters" style={{ display: "flex", flexDirection: "column", gap: 3, padding: "10px 0" }}>
      <span
        style={{
          fontFamily: cond,
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: C.muted,
          padding: "0 10px 3px",
        }}
      >
        Filter
      </span>
      {FEED_SCOPES.map((s) => {
        const on = scope === s.value;
        return (
          <button
            key={s.value}
            type="button"
            onClick={() => setScope(s.value)}
            aria-pressed={on}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px 10px",
              borderRadius: 7,
              border: 0,
              background: on ? C.ink : "transparent",
              color: on ? C.sand : C.body,
              fontSize: 13,
              fontWeight: on ? 600 : 500,
              cursor: "pointer",
            }}
          >
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}
