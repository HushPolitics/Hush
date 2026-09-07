"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { C, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { initials, lastNameOf } from "@/lib/scoring";
import type { Politician } from "@/lib/types";
import { Avatar, Chip, Display, EmptyState, Kicker } from "@/components/ui";

const SORTS = ["Seniority", "A–Z"] as const;
type Sort = (typeof SORTS)[number];

/**
 * Management surface for the politicians a user follows — moved off Profile
 * (which is retired) into its own destination, reached from the avatar
 * menu's "Following" item. Same list, same data (`saved` in usePrefs()) as
 * the old Profile card; this just gives it a page of its own plus an
 * explicit unfollow control per row, so following someone actually does
 * something reachable rather than only ever being set from a politician
 * page and never managed afterward.
 */
export default function FollowingView({ politicians }: { politicians: Politician[] }) {
  const { saved, toggleSaved } = usePrefs();
  const [sort, setSort] = useState<Sort>("Seniority");

  const cards = useMemo(() => {
    const list = politicians.filter((p) => saved.includes(p.id));
    return list
      .slice()
      .sort((a, b) =>
        sort === "A–Z" ? lastNameOf(a.name).localeCompare(lastNameOf(b.name)) : a.since - b.since,
      );
  }, [politicians, saved, sort]);

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Kicker>Following</Kicker>
        <Display size={25}>Politicians You&apos;re Following · {saved.length}</Display>
        <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>Sort</span>
        {SORTS.map((s) => (
          <Chip key={s} on={sort === s} onClick={() => setSort(s)}>
            {s}
          </Chip>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))",
          gap: 14,
        }}
      >
        {cards.map((s) => {
          const recent = s.timeline.length > 0 ? s.timeline[s.timeline.length - 1] : null;
          return (
            <div
              key={s.id}
              className="lift"
              style={{
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                background: C.white,
                padding: 16,
                display: "flex",
                gap: 13,
              }}
            >
              <Link href={`/politician/${s.id}`} style={{ display: "flex", gap: 13, flex: 1, minWidth: 0, color: C.ink }}>
                <Avatar text={initials(s.name)} size={46} radius={9} font={15} />
                <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                  <span style={{ fontFamily: cond, fontSize: 19, lineHeight: 1.1 }}>{s.name}</span>
                  <span style={{ fontSize: 12, color: C.muted }}>
                    {s.office} · {s.district} · since {s.since}
                  </span>
                  {recent ? (
                    <span
                      style={{
                        fontSize: 11.5,
                        color: C.body,
                        marginTop: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {recent.date} — {recent.label}
                    </span>
                  ) : null}
                </div>
              </Link>
              <button
                type="button"
                onClick={() => toggleSaved(s.id)}
                aria-label={`Unfollow ${s.name}`}
                style={{
                  alignSelf: "flex-start",
                  border: 0,
                  background: "transparent",
                  color: C.muted,
                  fontSize: 14,
                  cursor: "pointer",
                  padding: 6,
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
        {cards.length === 0 ? (
          <EmptyState>Nothing followed yet — open a profile and hit “Save to my list”.</EmptyState>
        ) : null}
      </div>
    </div>
  );
}
