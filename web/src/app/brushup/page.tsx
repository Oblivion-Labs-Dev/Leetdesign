import { Suspense } from "react";
import { LearnLayout } from "@/components/learn/learn-layout";
import { BrushupExperience } from "@/components/learn/brushup-experience";
import { getLearnRoadmapProgress } from "@/lib/content/learn/learn-progress";
import { getConceptsHeroImageSrc } from "@/lib/content/learn/hero-asset";

export default async function BrushupPage() {
  const [progress, heroImageSrc] = await Promise.all([
    getLearnRoadmapProgress(),
    Promise.resolve(getConceptsHeroImageSrc()),
  ]);

  return (
    <LearnLayout variant="roadmap">
      <Suspense
        fallback={
          <div className="text-sm text-[var(--studio-text-muted)]">
            Loading roadmap…
          </div>
        }
      >
        <BrushupExperience progress={progress} heroImageSrc={heroImageSrc} />
      </Suspense>
    </LearnLayout>
  );
}
