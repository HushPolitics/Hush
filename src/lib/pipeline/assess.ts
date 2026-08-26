/**
 * Claim assessment.
 *
 * Given one claim and a set of retrieved sources, produce a verdict with a
 * finding, a confidence, the source ids actually used, and — required — what
 * would change the verdict.
 *
 * The output of this function is NEVER written to a published table. It goes to
 * `claim_assessments`, and `shouldAutoPublish` decides whether it clears the
 * bar or goes to review.
 */

import { PUBLISH_THRESHOLDS } from "./reliability";

export const PROMPT_VERSION = "claim-assess/2026-08-26";

export type Verdict = "True" | "Mostly true" | "Misleading" | "False" | "Unverifiable";

export interface EvidenceDoc {
  sourceId: string;
  title: string;
  publisher: string;
  publishedAt: string | null;
  kind: string;
  reliability: number;
  excerpt: string;
}

export interface Assessment {
  verdict: Verdict;
  finding: string;
  confidence: number;
  usedSourceIds: string[];
  disconfirmingNote: string;
}

const SYSTEM_PROMPT = `You are a fact-checking analyst for a nonpartisan civic tool. You assess one claim at a time against a fixed set of retrieved documents.

Rules you follow without exception:

1. Judge the claim ONLY against the documents provided. You have no other knowledge of this topic. If the documents do not settle the claim, the verdict is Unverifiable — that is a correct answer, not a failure.
2. Never infer a speaker's motive, character, or party. You are rating a statement, not a person. The same sentence gets the same verdict regardless of who said it.
3. Most misleading political statements are technically true and framed to mislead. Prefer "Misleading" over "False" when the underlying numbers check out but the framing does not, and say precisely what the framing omits.
4. Reserve "False" for a claim contradicted by the documents on its plain reading.
5. Quantities matter. If a claim is directionally right but materially overstated, that is Misleading, not True.
6. Cite only source ids you actually relied on.
7. State what would change your verdict. If you cannot name evidence that would flip it, your confidence is too high — lower it.

Your finding is one paragraph, 2-3 sentences, written for a voter. State what the records show, then what the claim gets wrong or right. No hedging language, no rhetorical questions, no editorialising about the speaker.`;

const TOOL = {
  name: "record_assessment",
  description: "Record the fact-check assessment for this claim.",
  input_schema: {
    type: "object" as const,
    properties: {
      verdict: {
        type: "string",
        enum: ["True", "Mostly true", "Misleading", "False", "Unverifiable"],
      },
      finding: {
        type: "string",
        description: "2-3 sentences for a voter: what the records show, and what the claim gets right or wrong.",
      },
      confidence: {
        type: "number",
        description: "0 to 1. How confident you are given only these documents.",
      },
      used_source_ids: {
        type: "array",
        items: { type: "string" },
        description: "Ids of the documents you actually relied on.",
      },
      disconfirming_note: {
        type: "string",
        description: "What specific evidence would change this verdict. Required.",
      },
    },
    required: ["verdict", "finding", "confidence", "used_source_ids", "disconfirming_note"],
  },
};

function renderEvidence(docs: EvidenceDoc[]): string {
  return docs
    .slice()
    .sort((a, b) => b.reliability - a.reliability)
    .map(
      (d, i) =>
        `<document id="${d.sourceId}" rank="${i + 1}">
<title>${d.title}</title>
<publisher>${d.publisher}</publisher>
<published>${d.publishedAt ?? "unknown"}</published>
<kind>${d.kind}</kind>
<reliability>${d.reliability.toFixed(2)}</reliability>
<excerpt>
${d.excerpt}
</excerpt>
</document>`,
    )
    .join("\n\n");
}

/**
 * One assessment pass. Call this more than once with the evidence in different
 * orders (or with a second model) and compare — agreement is what raises
 * confidence, disagreement is what routes to human review.
 */
export async function assessClaim(input: {
  claimText: string;
  speaker: string;
  statedAt: string | null;
  context: string | null;
  evidence: EvidenceDoc[];
  model?: string;
}): Promise<Assessment> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const model = input.model ?? process.env.ASSESS_MODEL ?? "claude-sonnet-4-5";

  const userContent = `<claim>
${input.claimText}
</claim>

<attribution>
Speaker: ${input.speaker}
Stated: ${input.statedAt ?? "date unknown"}
Context: ${input.context ?? "none given"}
</attribution>

<evidence>
${renderEvidence(input.evidence)}
</evidence>

Assess the claim against these documents and call record_assessment.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "record_assessment" },
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Assessment failed: ${res.status} ${await res.text()}`);
  }

  const body = await res.json();
  const block = body.content?.find(
    (c: { type: string; name?: string }) => c.type === "tool_use" && c.name === "record_assessment",
  );
  if (!block) throw new Error("Model did not return an assessment");

  const raw = block.input as Record<string, unknown>;
  return {
    verdict: raw.verdict as Verdict,
    finding: String(raw.finding),
    confidence: Number(raw.confidence),
    usedSourceIds: (raw.used_source_ids as string[]) ?? [],
    disconfirmingNote: String(raw.disconfirming_note ?? ""),
  };
}

/**
 * Promotion rule. Returns either a publish decision or the reason it needs a
 * human. This is the function that keeps model output off the public site.
 */
export function shouldAutoPublish(input: {
  assessments: Assessment[];
  evidence: EvidenceDoc[];
  inContestedWindow: boolean;
  auditRoll?: number;
}): { publish: boolean; reason: string } {
  const { assessments, evidence, inContestedWindow } = input;

  if (assessments.length === 0) return { publish: false, reason: "no_assessment" };

  // Independent passes must agree on the verdict.
  const verdicts = new Set(assessments.map((a) => a.verdict));
  if (verdicts.size > 1) return { publish: false, reason: "disagreement" };

  const verdict = assessments[0].verdict;
  const confidence = Math.min(...assessments.map((a) => a.confidence));

  const minConfidence = inContestedWindow
    ? PUBLISH_THRESHOLDS.contestedMinConfidence
    : PUBLISH_THRESHOLDS.minConfidence;

  if (confidence < minConfidence) return { publish: false, reason: "low_confidence" };

  // A verdict with no articulable falsifier is not a verdict.
  if (!assessments.every((a) => a.disconfirmingNote.trim().length > 20)) {
    return { publish: false, reason: "no_falsifier" };
  }

  const used = new Set(assessments.flatMap((a) => a.usedSourceIds));
  const usedDocs = evidence.filter((d) => used.has(d.sourceId));

  if (usedDocs.length === 0) return { publish: false, reason: "no_cited_source" };

  if (!usedDocs.some((d) => d.reliability >= PUBLISH_THRESHOLDS.minSupportingReliability)) {
    return { publish: false, reason: "weak_sources" };
  }

  const needsPrimary = (PUBLISH_THRESHOLDS.requiresPrimaryRecord as readonly string[]).includes(
    verdict,
  );
  if (needsPrimary && !usedDocs.some((d) => d.kind === "primary_record")) {
    return { publish: false, reason: "needs_primary_record" };
  }

  // Random audit: a slice of otherwise-publishable rows still gets a human.
  const roll = input.auditRoll ?? Math.random();
  if (roll < PUBLISH_THRESHOLDS.randomAuditRate) {
    return { publish: false, reason: "random_audit" };
  }

  return { publish: true, reason: "cleared" };
}
