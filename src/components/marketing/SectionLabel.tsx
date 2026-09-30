import type { ReactNode } from "react";
import { C } from "@/lib/theme";

// The small uppercase eyebrow used above almost every H2 on the inner
// marketing pages (Inter 600, 12px, 0.16em, uppercase). Ink by default;
// pass `color` for the rare persimmon variant (e.g. the "How it works"
// header row on the HUSH. Guide page).
export function SectionLabel({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span style={{ display: "block", fontSize: 12, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: color ?? C.ink }}>
      {children}
    </span>
  );
}
