import type { ReactNode } from "react";
import { C } from "@/lib/theme";
import { MK } from "@/lib/marketingTheme";

// Shared visual language for every form field across the site's form pages
// (File a Dispute, Contact, and any later one) -- label 7px above a square-
// cornered #F7F3EC field, ink focus border (see .form-field in globals.css),
// persimmon inline error below.
export const FIELD_STYLE = {
  border: `1px solid ${MK.rule}`,
  background: MK.paper,
  padding: "12px 14px",
  fontFamily: "inherit",
  fontSize: 15,
  color: C.ink,
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
};

export function FormField({
  label,
  optional,
  error,
  children,
}: {
  label: string;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 0 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>
        {label}
        {optional ? <span style={{ fontWeight: 400, color: MK.muted }}> (optional)</span> : null}
      </span>
      {children}
      {error ? (
        <span role="alert" style={{ fontSize: 12.5, color: C.rust }}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
