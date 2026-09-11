"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { C, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { createClient } from "@/lib/supabase/client";
import { jumpToSection, useRailFooter, useScrollSpy, useSectionNavItems, type SectionNavItem } from "@/lib/sectionNav";
import { SearchField } from "./ui";
import PersonalizeBanner from "./PersonalizeBanner";
import { HushScoreInfoProvider } from "./HushScoreInfo";
import GlobalFooter from "./GlobalFooter";

// Nav: four destinations plus the avatar menu (see AVATAR_MENU below).
// Politicians added as the fourth -- same horizontal top bar, no layout
// change, just one more entry.
const NAV = [
  { href: "/feed", label: "Feed" },
  { href: "/hush-guide", label: "HUSH. Guide" },
  { href: "/stance-check", label: "Stance Check" },
  { href: "/politicians", label: "Politicians" },
];

// "My issues" is computed per-render below (points new users at the
// rank-or-quiz chooser instead of straight into the ranked editor) --
// these two are unconditional.
const AVATAR_MENU_TAIL = [
  { href: "/following", label: "Following" },
  { href: "/profile/settings", label: "Account settings" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/politicians") return pathname === "/politicians" || pathname.startsWith("/politician");
  return pathname === href || pathname.startsWith(href + "/");
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

// The top bar's responsive collapse order (app-layout-v2 amendment) is pure
// CSS, keyed off the class names below -- same architecture as the rail's
// own 1100px cutoff. Widest to narrowest: the tagline (`.topbar-tagline` +
// its divider) drops first, since it's the lowest-priority element; then
// the search field collapses to an icon that expands on click
// (`.topbar-search-toggle`/`.topbar-search-field`, reusing the shell's own
// 1100px design floor); then the nav collapses to a menu
// (`.topbar-nav`/`.topbar-nav-toggle`). The wordmark and avatar are never
// hidden. See globals.css for the exact breakpoints.

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { topics } = usePrefs();
  const avatarMenu = [
    topics.length
      ? { href: "/profile/top-issues", label: "My issues" }
      : { href: "/profile/top-issues/start", label: "Pick my issues" },
    ...AVATAR_MENU_TAIL,
  ];
  const [q, setQ] = useState("");
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);

  // Section-nav zone: registered by whichever view is mounted below (see
  // lib/sectionNav.tsx). `mainRef` is the scroll-spy's observer root -- the
  // `.scroll` pane below is the real scrolling element, not the window.
  const mainRef = useRef<HTMLElement | null>(null);
  const sectionItems = useSectionNavItems();
  const railFooter = useRailFooter();
  const activeSectionId = useScrollSpy(mainRef, sectionItems.map((i) => i.id));
  // Collapses gracefully (renders nothing, not an empty rail) on a rail
  // route that hasn't registered anything yet -- HUSH Guide's address/issues
  // onboarding steps render before the tile grid does -- same as the old
  // sidebar's section-nav zone did.
  const showRail = showsRail(pathname) && sectionItems.length > 0;

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
        The top bar -- app-layout-v2 amendment. A straight left-to-right flex
        row now rather than a three-column grid: wordmark, nav, a search
        field that fills whatever space is left, the avatar, and a tagline
        pinned at the far end. No more centered nav column -- there's nothing
        else on the left to center against once the location chip and
        election-day indicator are gone (their content lives elsewhere now,
        see the two doc comments below). Outside `.scroll` below, so it never
        scrolls away.
      */}
      <header
        className="app-topbar"
        style={{
          flex: "0 0 66px",
          height: 66,
          display: "flex",
          alignItems: "center",
          gap: 20,
          borderBottom: `1px solid ${C.line}`,
          padding: "0 28px",
          background: C.cream,
        }}
      >
        <Link
          href="/feed"
          className="topbar-logo"
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3, flex: "0 0 auto", color: C.ink }}
        >
          <span style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontFamily: cond, fontWeight: 600, fontSize: 22, letterSpacing: "0.2em" }}>
              HUSH
            </span>
            <span style={{ fontFamily: cond, fontWeight: 600, fontSize: 22, color: C.rust }}>.</span>
          </span>
          <span aria-hidden style={{ width: 22, height: 2, background: C.rust }} />
        </Link>

        <nav
          className="topbar-nav"
          aria-label="Primary"
          style={{ display: "flex", alignItems: "flex-start", gap: 20, flex: "0 0 auto" }}
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
                  flexDirection: "column",
                  alignItems: "center",
                  fontSize: 14,
                  whiteSpace: "nowrap",
                  color: on ? C.ink : C.body,
                  fontWeight: on ? 600 : 500,
                }}
              >
                <span style={{ paddingBottom: 4, borderBottom: `2px solid ${on ? C.rust : "transparent"}` }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/*
          Below the nav-collapse breakpoint, `.topbar-nav` (above) hides and
          this menu button takes its place -- same toggle-visibility
          mechanism as the search field below: both pieces always mount,
          globals.css decides which one is visible at a given width.
        */}
        <div className="topbar-nav-menu" style={{ position: "relative", flex: "0 0 auto" }}>
          <button
            type="button"
            className="topbar-nav-toggle"
            onClick={() => setNavMenuOpen((o) => !o)}
            aria-haspopup="true"
            aria-expanded={navMenuOpen}
            aria-label="Open navigation menu"
            style={{
              border: "1px solid rgba(21,21,21,0.16)",
              borderRadius: 7,
              background: "transparent",
              width: 34,
              height: 34,
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              color: C.body,
              cursor: "pointer",
            }}
          >
            <span aria-hidden>≡</span>
          </button>

          {navMenuOpen ? (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={() => setNavMenuOpen(false)} />
              <div
                role="menu"
                aria-label="Primary"
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  zIndex: 10,
                  minWidth: 180,
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
                {NAV.map((item) => {
                  const on = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setNavMenuOpen(false)}
                      style={{
                        padding: "9px 10px",
                        borderRadius: 6,
                        fontSize: 13,
                        color: on ? C.ink : C.body,
                        fontWeight: on ? 600 : 500,
                        borderLeft: `3px solid ${on ? C.rust : "transparent"}`,
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        {/*
          Search fills whatever horizontal space the rest of the bar leaves
          -- `flex: 1` rather than a fixed width, per the brief. Below the
          collapse breakpoint it becomes an icon that expands on click; the
          toggle button is only ever rendered while collapsed-and-closed, so
          there's no inline-vs-stylesheet fight over `display` -- CSS alone
          hides `.topbar-search-field` by default in that width band and
          `.is-open` (added once `searchOpen` is true) overrides it.
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
        <div className={`topbar-search-field${searchOpen ? " is-open" : ""}`} style={{ flex: 1, minWidth: 0 }}>
          <SearchField
            value={q}
            onChange={submitSearch}
            placeholder="Search politicians, issues, bills, claims"
            className="header-search"
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ position: "relative", flex: "0 0 auto" }}>
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
              background: "#4A6675",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: cond,
              fontWeight: 700,
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
                {avatarMenu.map((item) => (
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

        {/*
          Tagline -- the lowest-priority element in the bar (see the
          collapse-order doc comment above), so it's the first thing
          globals.css hides as the viewport narrows. Zip and the election-day
          countdown used to live in this same right-hand area; zip now lives
          in HUSH Guide's rail footer (see AddressRailFooter in GuideView.tsx)
          and the countdown lives in the Feed's own orientation strip
          (ElectionCard in FeedView.tsx) -- both were already built for
          app-layout-v2's earlier phases, so removing them from here duplicates
          nothing.
        */}
        <span
          className="topbar-tagline-divider"
          aria-hidden
          style={{ width: 1, alignSelf: "stretch", margin: "16px 0", background: C.line, flex: "0 0 auto" }}
        />
        <div className="topbar-tagline" style={{ display: "flex", flexDirection: "column", gap: 3, flex: "0 0 auto", minWidth: 0 }}>
          <span style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.3 }}>
            Politics is noisy,
            <br />
            your vote shouldn&apos;t be.
          </span>
          <span aria-hidden style={{ width: 26, height: 2, background: C.rust }} />
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
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflowY: "auto",
            }}
          >
            <SectionJumpList items={sectionItems} activeId={activeSectionId} />
            {/*
              Rail footer -- content a view registered via useRegisterRailFooter
              (lib/sectionNav.tsx), e.g. HUSH Guide's saved address. Pushed to
              the bottom of the rail with marginTop: auto rather than living in
              the jump list itself, and separated by a rule only when there's
              something there to separate from.
            */}
            {railFooter ? (
              <div style={{ marginTop: "auto", paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
                {railFooter}
              </div>
            ) : null}
          </aside>
        ) : null}

        <main ref={mainRef} className="scroll" style={{ flex: 1, minWidth: 0 }}>
          {children}
          <GlobalFooter />
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
