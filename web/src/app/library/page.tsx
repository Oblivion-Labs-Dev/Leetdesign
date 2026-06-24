import Link from "next/link";
import { Lock } from "lucide-react";
import { StudioPageShell } from "@/components/studio/studio-page-shell";
import { ALL_COMPONENTS } from "@/lib/content/components";
import { COMPONENT_ICONS } from "@/components/pipeline/icon-map";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { SectionHeader } from "@/components/ui/section";
import type { ComponentType } from "@/types";
import { getCurrentUserLearningStats } from "@/lib/learning-stats";

export default async function LibraryPage() {
  const stats = await getCurrentUserLearningStats();
  const seenSet = new Set(stats.componentsSeen.map((c) => c.componentId));

  return (
    <StudioPageShell>
      <SectionHeader
        eyebrow="Knowledge base"
        title="Only what you have actually learned is unlocked"
        description="Open a project to be introduced to a component. Once you've seen it in context, this library lets you revisit the deep dive any time."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ALL_COMPONENTS.map((c) => {
          const Icon = COMPONENT_ICONS[c.type as ComponentType];
          const unlocked = seenSet.has(c.id);
          const inner = (
            <Card
              className={`h-full ${
                unlocked
                  ? "hover:border-violet-500/40"
                  : "cursor-not-allowed border-[var(--border)] bg-[var(--surface-2)]/40 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/30 text-violet-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{c.label}</div>
                    <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
                      {c.type.replace("_", " ")}
                    </div>
                  </div>
                </div>
                {unlocked ? (
                  <Pill tone="success">Open</Pill>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[var(--foreground-subtle)]">
                    <Lock className="h-3 w-3" /> Locked
                  </span>
                )}
              </div>
              <p className="mt-3 line-clamp-2 text-xs text-[var(--foreground-muted)]">
                {unlocked
                  ? c.shortDescription
                  : "You haven’t learned this component yet. Pick a project — it will introduce you to this when needed."}
              </p>
            </Card>
          );
          if (!unlocked) {
            return (
              <div key={c.id} aria-disabled>
                {inner}
              </div>
            );
          }
          return (
            <Link key={c.id} href={`/library/${c.id}`}>
              {inner}
            </Link>
          );
        })}
      </div>
    </StudioPageShell>
  );
}
