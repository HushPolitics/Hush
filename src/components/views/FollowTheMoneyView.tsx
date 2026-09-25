"use client";

import Link from "next/link";
import { C, PARTY, cond } from "@/lib/theme";
import { Card, Display, Kicker, Pill } from "@/components/ui";
import type { FundingSummary, Politician } from "@/lib/types";

/**
 * The Follow the Money hub -- a directory into the funding feature that
 * already exists on every politician's own page (see PoliticianView.tsx's
 * FundingSection), not a rebuild of it. Deliberately never renders a
 * dollar amount or an aggregate count: `getFundingSummary`'s own doc
 * comment states that funding is the one dataset this app was never going
 * to fabricate plausible fictional numbers for, and since nothing has
 * synced from the FEC yet, most politicians here will show "matched -- no
 * filings synced yet," which is accurate, not broken.
 */
function fundingStatus(politician: Politician, funding: FundingSummary | null): { label: string; tone: "muted" | "ink" } {
  if (!politician.fecCandidateId) return { label: "Not federally regulated", tone: "muted" };
  if (!funding) return { label: "Funding data unavailable right now", tone: "muted" };
  if (funding.filings.length === 0) return { label: "Matched — no filings synced yet", tone: "muted" };
  return { label: "Filings on record", tone: "ink" };
}

export default function FollowTheMoneyView({
  politicians,
  fundingById,
}: {
  politicians: Politician[];
  fundingById: Record<string, FundingSummary | null>;
}) {
  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Kicker>Campaign Finance</Kicker>
        <Display size={28}>Follow the Money</Display>
        <span style={{ fontSize: 13, color: C.body, maxWidth: 640, lineHeight: 1.5 }}>
          Federal campaign finance filings for the politicians on your ballot, sourced from the FEC. HUSH reports
          totals, shares, and named committee contributions with a source and filing date — never a ranking, and
          never an individual donor&apos;s name.
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {politicians.map((p) => {
          const status = fundingStatus(p, fundingById[p.id] ?? null);
          return (
            <Link
              key={p.id}
              href={`/politician/${p.id}#funding`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Card
                style={{
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 2, background: PARTY[p.party], flex: "0 0 8px" }} />
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontFamily: cond, fontSize: 15, color: C.ink }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: C.muted }}>{p.office}</span>
                </div>
                {/* Overrides Pill's own `whiteSpace: nowrap` -- some status
                    phrases here ("Funding data unavailable right now") are
                    long enough that refusing to wrap forced this whole row's
                    flex layout to starve the name column for space instead.
                    Wrapping alone isn't enough, though: the name column's
                    `flex: 1` gives it a 0% flex-basis, so with the Pill's
                    own flex-basis left at its default `auto` (~its full
                    unwrapped text width), the row's total content still
                    fits without ever entering the shrink phase -- the Pill
                    renders at full width uncontested and the name is left
                    to grow into whatever's left over, often just a few
                    pixels. Setting the Pill's own flexBasis to 0 puts it in
                    the same position the name is already in: it now only
                    gets its automatic min-content floor (the width of its
                    longest word, since whiteSpace stays "normal" and
                    minWidth stays at its default "auto", not 0), and the
                    name's flex-grow claims the rest. */}
                <Pill
                  bg={status.tone === "ink" ? C.shell : "transparent"}
                  fg={status.tone === "ink" ? C.ink : C.muted}
                  style={{ whiteSpace: "normal", textAlign: "right", flexBasis: 0 }}
                >
                  {status.label}
                </Pill>
                <span aria-hidden style={{ color: C.muted }}>
                  ›
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
