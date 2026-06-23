"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StudioCard } from "@/components/studio/studio-card";
import type { LearningStats } from "@/lib/learning-stats";

export function StudioCatalogProgress({ stats }: { stats: LearningStats }) {
  const total = stats.componentsTotal;
  const learned = stats.componentsSeen.length;
  const remaining = Math.max(total - learned, 0);
  const pct = total > 0 ? Math.round((learned / total) * 100) : 0;

  const radius = 42;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <StudioCard className="flex flex-col p-4" data-tour="catalog-progress">
      <h2 className="text-sm font-semibold text-[var(--studio-text)]">
        Component Catalog
      </h2>

      <div className="mt-3 flex flex-1 items-center gap-4">
        <div className="relative h-[100px] w-[100px] shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--studio-surface-2)" strokeWidth={stroke} />
            <circle
              cx="50" cy="50" r={radius} fill="none"
              stroke="var(--studio-purple)"
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <span className="text-xl font-bold tabular-nums text-[var(--studio-text)]">{pct}</span>
              <span className="text-xs text-[var(--studio-text-muted)]">%</span>
              <p className="text-[9px] text-[var(--studio-text-subtle)]">Learned</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[var(--studio-text-muted)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--studio-purple)]" />
              Learned
            </span>
            <span className="font-bold tabular-nums text-[var(--studio-text)]">{learned}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[var(--studio-text-muted)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--studio-blue)]" />
              Remaining
            </span>
            <span className="font-bold tabular-nums text-[var(--studio-text)]">{remaining}</span>
          </div>
        </div>
      </div>

      <Link href="/library" className="studio-link mt-3 inline-flex items-center gap-1">
        Browse catalog <ArrowRight className="h-3 w-3" />
      </Link>
    </StudioCard>
  );
}
