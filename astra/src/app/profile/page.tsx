import { AppShell } from "@/components/layout/app-shell";
import { IdentityCard } from "@/components/badge/identity-card";
import { getCurrentUserProfile } from "@/lib/auth-guard";
import { getCurrentUserLearningStats } from "@/lib/learning-stats";
import { ProfileTabs } from "@/components/profile/profile-tabs";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const profile = await getCurrentUserProfile();
  const stats = await getCurrentUserLearningStats();
  const params = await searchParams;
  const initialTab =
    params.tab && ["general", "career", "account", "theme", "connections"].includes(params.tab)
      ? (params.tab as "general" | "career" | "account" | "theme" | "connections")
      : "general";

  return (
    <AppShell title="Profile" subtitle="Your identity, theme, and connected accounts at Astra.">
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <IdentityCard profile={profile} />
        </div>

        <ProfileTabs profile={profile} stats={stats} initialTab={initialTab} />
      </div>
    </AppShell>
  );
}
