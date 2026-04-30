import { redirect } from "next/navigation";
import type { UserProfile } from "@/types";
import {
  fetchCurrentUserRaw,
  getAuthToken,
  getCurrentUserProfile as getProfileFromBackend,
  requireBackendUser,
} from "@/lib/backend-auth";

export async function requireAuth() {
  return requireBackendUser();
}

export async function resolvePostLoginRedirect(): Promise<string> {
  const token = await getAuthToken();
  if (!token) return "/login";
  const user = await fetchCurrentUserRaw(token);
  if (!user || !user.firstVisitCompleted) return "/onboarding";
  return "/dashboard";
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  const profile = await getProfileFromBackend();
  if (!profile) redirect("/login");
  return profile;
}
