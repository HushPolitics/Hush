"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";

export interface SectionNavItem {
  id: string;
  label: string;
}

/**
 * The current route's section-nav list, as a module-level store rather than
 * React context: the data has to flow child (the page's view component) to
 * ancestor (AppShell's sidebar), the opposite of what context supports.
 * Same `useSyncExternalStore` module-store shape as `lib/prefs.tsx`, just
 * in-memory -- there is nothing here worth persisting across a reload.
 */
let items: SectionNavItem[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => items;
const getServerSnapshot = (): SectionNavItem[] => [];

/**
 * Registers this route's section-nav list -- called once by whichever view
 * component owns the current page (GuideView, PoliticianView, StanceCheckView's
 * summary screen). Pass `null` or `[]` for a route with nothing to jump to
 * (Stance Check mid-run, Compare); the sidebar treats both the same way --
 * it renders nothing rather than an empty box, so the column "collapses
 * gracefully" instead of leaving a gap.
 *
 * Re-registers whenever the item list's content changes (not just on
 * mount), so a conditional list -- Stance Check's summary sections appear
 * only once the underlying data produces them -- stays in sync. Clears on
 * unmount so navigating to a route with no section nav, or unmounting a
 * conditionally-rendered results screen, doesn't leave a stale list
 * showing in the sidebar.
 */
export function useRegisterSectionNav(next: SectionNavItem[] | null) {
  const key = JSON.stringify(next ?? []);
  useEffect(() => {
    items = next ?? [];
    emit();
    return () => {
      items = [];
      emit();
    };
    // Re-run only when the actual content changes, not on every render --
    // `next` is a fresh array literal at most call sites.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/** The active route's registered section-nav list -- read by AppShell's sidebar. */
export function useSectionNavItems(): SectionNavItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Scroll-spy: which of `ids` is currently in view inside `containerRef`
 * (AppShell's `.scroll` main pane -- the real scrolling element, not the
 * window). An `IntersectionObserver` rooted on that container, with its
 * bottom margin pulled in so a section counts as "current" once it reaches
 * the top ~30% of the pane rather than merely being partly visible at the
 * very bottom edge. Among sections currently intersecting, the topmost one
 * in `ids`' own order wins, so scrolling down the page advances the active
 * id top-to-bottom the way a reader would expect.
 */
export function useScrollSpy(containerRef: RefObject<HTMLElement | null>, ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  const idsKey = ids.join("|");

  useEffect(() => {
    const root = containerRef.current;
    if (!root || ids.length === 0) {
      setActive(null);
      return;
    }

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        }
        const current = ids.find((id) => visible.has(id));
        setActive(current ?? null);
      },
      { root, rootMargin: "0px 0px -70% 0px", threshold: [0, 1] },
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, idsKey]);

  return active;
}

/** Smooth-scrolls to a section id within whatever scrollable ancestor contains it. */
export function jumpToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Convenience re-export so call sites don't need a second import for the ref type. */
export function useMainRef() {
  return useRef<HTMLElement | null>(null);
}

/**
 * Rail footer: a second, small module store mirroring `items`/`emit`/
 * `subscribe` above, but for a single arbitrary node instead of a list --
 * lets a page register content (HUSH Guide's saved-address block) to render
 * pinned at the bottom of AppShell's contextual left rail, below the jump
 * list, without threading it through props or context. Same child-to-
 * ancestor rationale as `useRegisterSectionNav`.
 */
let railFooter: ReactNode = null;
const railFooterListeners = new Set<() => void>();

function emitRailFooter() {
  railFooterListeners.forEach((l) => l());
}

function subscribeRailFooter(listener: () => void) {
  railFooterListeners.add(listener);
  return () => railFooterListeners.delete(listener);
}

const getRailFooterSnapshot = () => railFooter;
const getRailFooterServerSnapshot = (): ReactNode => null;

/**
 * Registers this route's rail-footer content -- called by whichever view
 * owns the current page (currently only GuideView, for the saved address).
 * Pass `null` for a route with nothing to pin there; clears on unmount so
 * navigating away doesn't leave a stale footer showing under some other
 * page's jump list.
 */
export function useRegisterRailFooter(node: ReactNode | null) {
  useEffect(() => {
    railFooter = node ?? null;
    emitRailFooter();
    return () => {
      railFooter = null;
      emitRailFooter();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node]);
}

/** The active route's registered rail-footer content -- read by AppShell's sidebar. */
export function useRailFooter(): ReactNode {
  return useSyncExternalStore(subscribeRailFooter, getRailFooterSnapshot, getRailFooterServerSnapshot);
}
