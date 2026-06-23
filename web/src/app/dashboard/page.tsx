import { getCurrentUserProfile } from "@/lib/auth-guard";
import { getCurrentUserLearningStats } from "@/lib/learning-stats";
import { DashboardTourOverlay } from "@/components/onboarding/dashboard-tour-overlay";
import { StudioLayout } from "@/components/studio/studio-layout";
import { StudioHeader } from "@/components/studio/studio-header";
import { StudioStats } from "@/components/studio/studio-stats";
import { StudioContinueCard } from "@/components/studio/studio-continue-card";
import { StudioDailyInsight } from "@/components/studio/studio-daily-insight";
import { StudioHeatmap } from "@/components/studio/studio-heatmap";
import { StudioCatalogProgress } from "@/components/studio/studio-catalog-progress";
import { StudioSessions } from "@/components/studio/studio-sessions";
import { StudioActivityFeed } from "@/components/studio/studio-activity-feed";
import { StudioMomentum } from "@/components/studio/studio-momentum";
import { StudioStreak } from "@/components/studio/studio-streak";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tour?: string }>;
}) {
  const profile = await getCurrentUserProfile();
  const stats = await getCurrentUserLearningStats();
  const params = await searchParams;
  const firstName = profile.fullName.split(" ")[0] || profile.alias;

  return (
    <StudioLayout>
      <DashboardTourOverlay enabled={params.tour === "1"} />
      <StudioHeader firstName={firstName} />

      <main className="w-full flex-1 px-5 pb-5 lg:px-6">
        <div className="flex flex-col gap-3">
          <StudioStats stats={stats} />

          <div className="grid gap-3 lg:grid-cols-3 lg:items-stretch">
            <div className="h-full lg:col-span-2">
              <StudioContinueCard stats={stats} />
            </div>
            <div className="h-full">
              <StudioDailyInsight />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StudioHeatmap stats={stats} />
            <StudioCatalogProgress stats={stats} />
            <StudioSessions stats={stats} />
            <StudioActivityFeed stats={stats} />
          </div>

          <div className="grid gap-3 lg:grid-cols-3 lg:items-stretch">
            <div className="h-full lg:col-span-2">
              <StudioMomentum stats={stats} />
            </div>
            <div className="h-full">
              <StudioStreak stats={stats} />
            </div>
          </div>
        </div>
      </main>
    </StudioLayout>
  );
}
