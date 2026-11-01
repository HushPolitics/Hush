"use client";

import { useEffect, useState } from "react";
import { C } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";

/**
 * Anyone whose account was created before this moment is a Founding Member:
 * 12:00 AM ET on Nov 4, 2026, i.e. the end of Election Day (Nov 3). ET is
 * UTC-5 by then (daylight time ends Nov 1). Derived from the account's own
 * created_at, so there is nothing to store and it can't drift.
 */
export const FOUNDING_CUTOFF_ISO = "2026-11-04T05:00:00Z";

/** True when the signed-in account was created before the founding cutoff. */
export function useIsFoundingMember(): boolean {
  const [founding, setFounding] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      const created = data.session?.user?.created_at;
      if (cancelled || !created) return;
      setFounding(new Date(created).getTime() < new Date(FOUNDING_CUTOFF_ISO).getTime());
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return founding;
}

/** Small rust pill reading "Founding Member"; renders nothing for anyone else. */
export default function FoundingBadge({ style }: { style?: React.CSSProperties }) {
  const founding = useIsFoundingMember();
  if (!founding) return null;
  return (
    <span
      style={{
        alignSelf: "flex-start",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        border: `1px solid ${C.rust}`,
        background: C.rustFill,
        color: C.rust,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.2,
        ...style,
      }}
    >
      <span aria-hidden="true">★</span>
      Founding Member
    </span>
  );
}
