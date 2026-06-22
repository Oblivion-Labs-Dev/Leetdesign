import { redirect } from "next/navigation";
import { resolveAppEntryRedirect } from "@/lib/auth-guard";

export default async function WelcomePage() {
  redirect(await resolveAppEntryRedirect());
}
