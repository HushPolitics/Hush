"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { C, cond } from "@/lib/theme";
import { usePrefs } from "@/lib/prefs";
import { initials, lastNameOf } from "@/lib/scoring";
import type { FactCheck, Politician } from "@/lib/types";
import { Avatar, Card, Chip, Display, EmptyState, Kicker, RustButton } from "@/components/ui";
import { FactCheckCard } from "./FactCheckView";
import { TopIssuesCard } from "./TopIssuesCard";

const SORTS = ["Seniority", "A–Z"] as const;
type Sort = (typeof SORTS)[number];

const heroSecondaryBtn = {
  width: "auto",
  padding: "10px 16px",
  borderRadius: 7,
  border: "1px solid rgba(243,239,228,0.32)",
  background: "transparent",
  color: C.sand,
  fontFamily: cond,
  fontSize: 13,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  cursor: "pointer",
};

/**
 * The "you" surface, rendered at /profile. (/saved redirects here — see
 * next.config.ts.) `topics` (ranked, edited from the "Your Top Issues" card
 * below) drives Value Match everywhere else in the app, and is also the same
 * list HUSH Guide and Stance Check read/write — so `hushGuideReady` below
 * just checks whether it's non-empty. `followedTopics` ("Topics You Follow")
 * is a separate, unranked watch-list with no effect on matching — see the
 * doc comments on both fields in lib/prefs.tsx.
 */
export default function ProfileView({
  politicians,
  topicPool,
  checks,
}: {
  politicians: Politician[];
  topicPool: string[];
  checks: FactCheck[];
}) {
  const router = useRouter();
  const {
    saved,
    city,
    state,
    zip,
    firstName,
    lastName,
    followedTopics,
    toggleFollowedTopic,
    topics,
  } = usePrefs();
  const [sort, setSort] = useState<Sort>("Seniority");

  const displayName = `${firstName} ${lastName}`.trim() || "HUSH Member";
  const hushGuideReady = topics.length > 0;

  const savedCards = useMemo(() => {
    const list = politicians.filter((p) => saved.includes(p.id));
    return list
      .slice()
      .sort((a, b) =>
        sort === "A–Z" ? lastNameOf(a.name).localeCompare(lastNameOf(b.name)) : a.since - b.since,
      );
  }, [politicians, saved, sort]);

  // Fact checks tied to whichever politicians the user currently follows.
  // `saved` is reactive (from usePrefs), so this list updates the moment a
  // politician is followed or unfollowed — no separate tracking needed.
  const nameById = useMemo(() => new Map(politicians.map((p) => [p.id, p.name])), [politicians]);
  const relatedChecks = useMemo(
    () => checks.filter((c) => saved.includes(c.politicianId)),
    [checks, saved],
  );

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Your Hush profile — identity block + primary actions only. Ranked
          issues used to live here too; they now have their own section
          (see TopIssuesCard) so this panel stays a quick "who you are and
          where to go next" surface rather than duplicating that card. */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          background: C.ink,
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Kicker color={C.tan} style={{ letterSpacing: "0.16em" }}>
            Your Hush profile
          </Kicker>
          <span style={{ height: 1, flex: 1, background: "rgba(243,239,228,0.2)" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Avatar text={initials(displayName)} size={66} bg={C.tan} fg={C.ink} radius={12} font={23} />
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontFamily: cond, fontSize: 32, color: C.sand, lineHeight: 1.05 }}>
              {displayName}
            </span>
            <span style={{ fontSize: 13, color: C.tan }}>
              {city}, {state} · {zip}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <RustButton
            onClick={() => router.push("/your-ballot")}
            style={{ padding: "10px 16px", borderRadius: 7, fontSize: 13 }}
          >
            My Ballot
          </RustButton>
          <button
            type="button"
            onClick={() => router.push("/profile/top-issues")}
            style={heroSecondaryBtn}
          >
            My Top Issues
          </button>
          <button
            type="button"
            onClick={() => router.push("/profile/top-issues/quiz")}
            style={heroSecondaryBtn}
          >
            Take the Issues Quiz
          </button>
          <button
            type="button"
            onClick={() => router.push("/profile/settings")}
            style={heroSecondaryBtn}
          >
            Profile Settings
          </button>
        </div>
      </section>

      <TopIssuesCard id="top-issues" topicPool={topicPool} />

      <Card id="topics-you-follow" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Kicker>Watching</Kicker>
          <Display size={25}>Topics You Follow</Display>
          <span style={{ fontSize: 13, color: C.body }}>
            Other issues you want HUSH to keep an eye on.
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {topicPool.map((name) => (
            <Chip key={name} on={followedTopics.includes(name)} onClick={() => toggleFollowedTopic(name)}>
              {name}
            </Chip>
          ))}
        </div>
      </Card>

      <Card id="hush-guide" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Kicker>Guide</Kicker>
          <Display size={25}>Your HUSH Guide</Display>
          <span style={{ fontSize: 13, color: C.body }}>
            Personalized research on the elections and issues that matter to you.
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 220 }}>
            {hushGuideReady ? (
              <>
                <span style={{ fontSize: 14, color: C.ink }}>Your ballot is ready to research.</span>
                <span style={{ fontSize: 12, color: C.muted }}>
                  {city}, {state} · {zip}
                </span>
                <span style={{ fontSize: 12, color: C.muted }}>
                  {topics.length} issue{topics.length === 1 ? "" : "s"} selected
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 14, color: C.ink }}>Build your HUSH Guide</span>
                <span style={{ fontSize: 12, color: C.muted }}>
                  Choose the issues you care about and we&apos;ll research the elections on your ballot.
                </span>
              </>
            )}
          </div>
          <RustButton
            onClick={() => router.push("/hush-guide")}
            style={{ padding: "11px 18px", borderRadius: 8, fontSize: 14 }}
          >
            {hushGuideReady ? "Open HUSH Guide →" : "Start HUSH Guide →"}
          </RustButton>
        </div>
      </Card>

      <div id="saved" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Display size={21}>Politicians You&apos;re Following · {saved.length}</Display>
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
        {savedCards.map((s) => {
          const recent = s.timeline.length > 0 ? s.timeline[s.timeline.length - 1] : null;
          return (
            <Link
              key={s.id}
              href={`/politician/${s.id}`}
              className="lift"
              style={{
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                background: C.white,
                padding: 16,
                display: "flex",
                gap: 13,
                color: C.ink,
              }}
            >
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
          );
        })}
        {savedCards.length === 0 ? (
          <EmptyState>Nothing saved yet — open a profile and hit “Save to my list”.</EmptyState>
        ) : null}
      </div>

      <Card style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Kicker>Related</Kicker>
          <Display size={25}>Related Fact Checks</Display>
          <span style={{ fontSize: 13, color: C.body }}>
            Fact checks related to politicians you&apos;re following.
          </span>
        </div>
        {relatedChecks.length === 0 ? (
          <span style={{ fontSize: 13, color: C.muted }}>
            Follow a few politicians and their fact checks will show up here.
          </span>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {relatedChecks.map((c) => (
              <FactCheckCard
                key={c.id}
                check={c}
                who={nameById.get(c.politicianId)}
                href={`/politician/${c.politicianId}`}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
