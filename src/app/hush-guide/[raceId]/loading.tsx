import AppShell from "@/components/AppShell";

/** Shown instantly while a race comparison loads, so the click never feels dead. */
export default function Loading() {
  return (
    <AppShell>
      <div style={{ padding: "24px 28px", fontSize: 14, color: "#6B6459" }} role="status" aria-live="polite">
        Loading comparison…
      </div>
    </AppShell>
  );
}
