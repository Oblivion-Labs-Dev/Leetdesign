import { redirect } from "next/navigation";
import { getAuthToken, fetchCurrentUserRaw } from "@/lib/backend-auth";

export default async function WelcomePage() {
  const token = await getAuthToken();
  if (!token) redirect("/login");
  const user = await fetchCurrentUserRaw(token);
  if (!user) redirect("/login");
  redirect(user.firstVisitCompleted ? "/dashboard" : "/onboarding");
}
