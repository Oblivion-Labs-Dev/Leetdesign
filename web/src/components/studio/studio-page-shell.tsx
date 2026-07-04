import { getCurrentUserProfile } from "@/lib/auth-guard";
import { StudioLayout } from "@/components/studio/studio-layout";
import { StudioHeader } from "@/components/studio/studio-header";
import { cn } from "@/lib/utils";

export async function StudioPageShell({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "roadmap";
}) {
  const profile = await getCurrentUserProfile();
  const firstName = profile.fullName.split(" ")[0] || profile.alias;
  const isRoadmap = variant === "roadmap";

  return (
    <StudioLayout fixedViewport={isRoadmap}>
      <div className="studio-header-shell shrink-0 border-b border-[var(--studio-border)] px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4 lg:px-6">
        <StudioHeader firstName={firstName} />
      </div>
      <main
        className={cn(
          "w-full flex-1 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4 lg:px-6",
          isRoadmap && "studio-main--roadmap min-h-0 overflow-hidden",
        )}
      >
        {children}
      </main>
    </StudioLayout>
  );
}
