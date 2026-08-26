import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";
import { C, cond } from "@/lib/theme";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
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
          maxWidth: 400,
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
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: C.body }}>
          Sign in to keep your ranked issues, saved politicians and ballot marks across devices.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
