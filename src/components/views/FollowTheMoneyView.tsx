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
                    flex layout to starve the name column for space instead,
                    down to the point of the name's own text overflowing its
                    box on narrow screens. Letting the status wrap is what
                    gives the name room to stay legible.
                    Deliberately NOT setting minWidth: 0 here -- that would
                    strip the Pill's own automatic min-content floor (the
                    width of its longest word), letting ITS text overflow
                    past a too-narrow box instead. Since it's right-aligned,
                    that overflow would spill left on top of the name --
                    the same failure this is meant to fix, just moved to the
                    other side. Keeping the default floor caps how far the
                    name gets squeezed, without ever letting the Pill itself
                    overflow. */}
                <Pill
                  bg={status.tone === "ink" ? C.shell : "transparent"}
                  fg={status.tone === "ink" ? C.ink : C.muted}
                  style={{ whiteSpace: "normal", textAlign: "right" }}
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
