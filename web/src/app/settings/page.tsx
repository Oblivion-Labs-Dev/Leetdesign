import { redirect } from "next/navigation";

export default function SettingsPage() {
  // Settings live inside the unified Profile area now.
  redirect("/profile?tab=account");
}
