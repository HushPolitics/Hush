import type { Metadata } from "next";
import SignupWizard from "@/components/SignupWizard";
import { topicPool } from "@/lib/repo";
import { C, cond } from "@/lib/theme";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.sand,
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: C.white,
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontFamily: cond, fontWeight: 600, fontSize: 28, letterSpacing: "0.22em" }}>
            HUSH
          </span>
          <span style={{ fontFamily: cond, fontWeight: 600, fontSize: 28, color: C.rust }}>.</span>
        </div>
        <SignupWizard topicPool={topicPool()} />
      </div>
    </div>
  );
}
