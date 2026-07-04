"use client";

import { CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import type { TradeoffSet } from "@/lib/simulator/courses/types";
import { cn } from "@/lib/utils";

export function TradeoffPanel({ tradeoffs, className }: { tradeoffs: TradeoffSet; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Section icon={CheckCircle2} title="What improved" items={tradeoffs.improved} tone="emerald" />
      <Section icon={MinusCircle} title="What became harder" items={tradeoffs.harder} tone="amber" />
      <Section icon={XCircle} title="Does not solve" items={tradeoffs.doesNotSolve} tone="muted" />
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: typeof CheckCircle2;
  title: string;
  items: string[];
  tone: "emerald" | "amber" | "muted";
}) {
  const colors = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    muted: "text-[var(--clay-text-muted)]",
  };

  return (
    <div className="rounded-xl border border-[var(--clay-border)] bg-[var(--clay-bg-soft)] p-3">
      <div className={cn("mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider", colors[tone])}>
        <Icon className="h-3 w-3" />
        {title}
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-[11px] leading-relaxed text-[var(--clay-text-muted)]">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
