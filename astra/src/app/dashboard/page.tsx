import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUserProfile } from "@/lib/auth-guard";
import { getCurrentUserLearningStats } from "@/lib/learning-stats";
import { IdentityCard } from "@/components/badge/identity-card";
import { BADGES } from "@/lib/badges";
import { DashboardTourOverlay } from "@/components/onboarding/dashboard-tour-overlay";
import { ActivityCalendar } from "@/components/dashboard/activity-calendar";
import { SkillCoverage } from "@/components/dashboard/skill-coverage";
import { OngoingTasks } from "@/components/dashboard/ongoing-tasks";
import { LevelCard } from "@/components/dashboard/level-card";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tour?: string }>;
}) {
  const profile = await getCurrentUserProfile();
  const stats = await getCurrentUserLearningStats();
  const params = await searchParams;
  const badge = BADGES[profile.badge];

  return (
    <AppShell
      title={`Welcome, ${profile.fullName.split(" ")[0] || profile.alias}.`}
      subtitle={`You are an ${badge.title}. This is your workspace — progress, streaks, and current tasks.`}
    >
      <DashboardTourOverlay enabled={params.tour === "1"} />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <ActivityCalendar
            visits={stats.visits}
            currentStreak={stats.currentStreak}
            longestStreak={stats.longestStreak}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <SkillCoverage stats={stats} />
            <LevelCard profile={profile} />
          </div>

          <OngoingTasks stats={stats} />
        </div>

        <div className="space-y-6">
          <IdentityCard profile={profile} />
        </div>
      </div>
    </AppShell>
  );
}
