"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  BookOpen, CheckCircle2, CircleDot, Eye, Shield, ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { StudioCard } from "@/components/studio/studio-card";
import type { LearningStats } from "@/lib/learning-stats";

type Activity = {
  icon: LucideIcon;
  label: string;
  time: string;
  color: string;
};

const FALLBACK: Activity[] = [
  { icon: BookOpen, label: "Started URL Shortener", time: "2h ago", color: "var(--studio-blue)" },
  { icon: CheckCircle2, label: 'Completed "Load Balancing"', time: "Yesterday", color: "var(--studio-green)" },
  { icon: CircleDot, label: 'Solved "Rate Limiting"', time: "2 days ago", color: "var(--studio-green)" },
  { icon: Eye, label: 'Reviewed "Caching Strategies"', time: "3 days ago", color: "var(--studio-orange)" },
  { icon: Shield, label: 'Completed "Database Sharding"', time: "5 days ago", color: "var(--studio-purple-light)" },
];

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(ms / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function StudioActivityFeed({ stats }: { stats: LearningStats }) {
  const activities: Activity[] = useMemo(() => {
    const result: Activity[] = [];

    stats.activeProjects.forEach((p) =>
      result.push({
        icon: BookOpen,
        label: `Started ${p.title}`,
        time: timeAgo(p.updatedAt),
        color: "var(--studio-blue)",
      }),
    );

    stats.completedProjects.forEach((p) =>
      result.push({
        icon: CheckCircle2,
        label: `Completed "${p.title}"`,
        time: timeAgo(p.updatedAt),
        color: "var(--studio-green)",
      }),
    );

    stats.componentsSeen.slice(-3).reverse().forEach((c) =>
      result.push({
        icon: Eye,
        label: `Reviewed "${c.label}"`,
        time: timeAgo(c.seenAt),
        color: "var(--studio-orange)",
      }),
    );

    if (result.length >= 3) return result.slice(0, 5);
    return [...result, ...FALLBACK].slice(0, 5);
  }, [stats]);

  return (
    <StudioCard className="flex flex-col p-4">
      <h2 className="text-sm font-semibold text-[var(--studio-text)]">Recent Activity</h2>

      <ul className="mt-3 flex-1 space-y-3">
        {activities.map((a, i) => {
          const Icon = a.icon;
          return (
            <li key={i} className="flex items-center gap-2.5">
              <Icon className="h-4 w-4 shrink-0" style={{ color: a.color }} />
              <p className="min-w-0 flex-1 truncate text-[12px] text-[var(--studio-text)]">
                {a.label}
              </p>
              <span className="shrink-0 text-[10px] text-[var(--studio-text-subtle)]">
                {a.time}
              </span>
            </li>
          );
        })}
      </ul>

      <Link href="/projects" className="studio-link mt-3 inline-flex items-center gap-1">
        View all activity <ArrowRight className="h-3 w-3" />
      </Link>
    </StudioCard>
  );
}
