"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * True once the component has hydrated on the client.
 *
 * Use it to gate anything whose value differs between server and browser (a
 * clock, a stored preference) so the first paint matches the server HTML and
 * React is not asked to reconcile a mismatch.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * A ticking clock as an external store.
 *
 * The snapshot is cached and only advances on the interval, which is what
 * `useSyncExternalStore` requires — returning a fresh `Date.now()` on every
 * read would loop forever.
 */
function makeClock(intervalMs: number) {
  let snapshot = 0;
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setInterval> | null = null;

  function tick() {
    snapshot = Date.now();
    listeners.forEach((l) => l());
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (!timer) {
        snapshot = Date.now();
        timer = setInterval(tick, intervalMs);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && timer) {
          clearInterval(timer);
          timer = null;
        }
      };
    },
    getSnapshot: () => snapshot || (snapshot = Date.now()),
    getServerSnapshot: () => 0,
  };
}

const clocks = new Map<number, ReturnType<typeof makeClock>>();

/** Current epoch ms, refreshed on the given interval. Returns 0 before hydration. */
export function useNow(intervalMs = 1000): number {
  let clock = clocks.get(intervalMs);
  if (!clock) {
    clock = makeClock(intervalMs);
    clocks.set(intervalMs, clock);
  }
  return useSyncExternalStore(clock.subscribe, clock.getSnapshot, clock.getServerSnapshot);
}
