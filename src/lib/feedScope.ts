"use client";

import { useSyncExternalStore } from "react";

/**
 * The Feed's scope filter -- what set of events it shows. "My ballot" and
 * "Following" existed as horizontal chips inside FeedView; "My issues" is
 * new (see `matchesIssues` in lib/feed.ts). Per the sidebar contextual-nav
 * brief, these render as a vertical filter list in AppShell's sidebar
 * instead, which means the state has to live somewhere both AppShell and
 * FeedView can reach -- a module-level `useSyncExternalStore` store, the
 * same shape `lib/prefs.tsx` and `lib/sectionNav.tsx` use, just in-memory:
 * unlike prefs, a page filter isn't worth persisting across a reload.
 */
export type FeedScope = "ballot" | "issues" | "following";

export const FEED_SCOPES: { value: FeedScope; label: string }[] = [
  { value: "ballot", label: "My Ballot" },
  { value: "issues", label: "My Issues" },
  { value: "following", label: "Following" },
];

let scope: FeedScope = "ballot";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => scope;
const getServerSnapshot = (): FeedScope => "ballot";

export function useFeedScope(): [FeedScope, (next: FeedScope) => void] {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [
    value,
    (next: FeedScope) => {
      scope = next;
      emit();
    },
  ];
}
