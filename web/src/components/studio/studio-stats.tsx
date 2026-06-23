"use client";

import { BookOpen, CheckCircle2, Flame, Trophy, type LucideIcon } from "lucide-react";
import { StudioCard } from "@/components/studio/studio-card";
import type { LearningStats } from "@/lib/learning-stats";

interface StatCard {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

function buildCards(stats: LearningStats): StatCard[] {
  const topicsLearned = stats.componentsSeen.length;
  const problemsSolved = stats.activeProjects.length + stats.completedProjects.length;
  const streak = stats.currentStreak;
  const score =
    stats.componentsSeen.length * 40 +
    stats.completedProjects.length * 200 +
    stats.currentStreak * 10;

  return [
    {
      icon: BookOpen,
      label: "Topics Learned",
      value: topicsLearned,
      sub: (
        <span className="text-[var(--studio-green)]">
          ↑ 12% <span className="text-[var(--studio-text-subtle)]">vs last month</span>
        </span>
      ),
      iconBg: "color-mix(in srgb, var(--studio-purple) 18%, transparent)",
      iconColor: "var(--studio-purple-light)",
    },
    {
      icon: CheckCircle2,
      label: "Problems Solved",
      value: problemsSolved,
      sub: (
        <span className="text-[var(--studio-green)]">
          ↑ 18% <span className="text-[var(--studio-text-subtle)]">vs last month</span>
        </span>
      ),
      iconBg: "color-mix(in srgb, var(--studio-green) 15%, transparent)",
      iconColor: "var(--studio-green)",
    },
    {
      icon: Flame,
      label: "Study Streak",
      value: `${streak} days`,
      sub: (
        <span>
          🔥 <span className="text-[var(--studio-orange)]">Keep it up!</span>
        </span>
      ),
      iconBg: "color-mix(in srgb, var(--studio-blue) 15%, transparent)",
      iconColor: "var(--studio-blue)",
    },
    {
      icon: Trophy,
      label: "Score",
      value: score,
      sub: <span className="text-[var(--studio-text-subtle)]">Top 12% of learners</span>,
      iconBg: "color-mix(in srgb, var(--studio-orange) 15%, transparent)",
      iconColor: "var(--studio-orange)",
    },
  ];
}

export function StudioStats({ stats }: { stats: LearningStats }) {
  const cards = buildCards(stats);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <StudioCard key={card.label} className="flex items-center gap-3 p-4">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
              style={{ background: card.iconBg, color: card.iconColor }}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[var(--studio-text-muted)]">{card.label}</p>
              <p className="text-xl font-bold tabular-nums leading-tight text-[var(--studio-text)]">
                {card.value}
              </p>
              <p className="text-[10px]">{card.sub}</p>
            </div>
          </StudioCard>
        );
      })}
    </div>
  );
}
