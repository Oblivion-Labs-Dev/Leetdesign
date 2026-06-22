import type { UserProfile } from "@/types";
import {
  completeOnboarding,
  getProfile,
  isOnboardingComplete,
} from "@/lib/local-store";

export async function getCurrentUserProfile(): Promise<UserProfile> {
  return getProfile();
}

export async function requireAuth(): Promise<UserProfile> {
  return getCurrentUserProfile();
}

export async function resolveAppEntryRedirect(): Promise<string> {
  const done = await isOnboardingComplete();
  return done ? "/dashboard" : "/onboarding";
}

export { completeOnboarding, isOnboardingComplete };
