import { redirect } from "next/navigation";

/** Saved is now a tab on the Profile page rather than its own route — send old links/bookmarks there. */
export default function SavedPage() {
  redirect("/profile?tab=saved");
}
