"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Lightbulb } from "lucide-react";
import { StudioCard } from "@/components/studio/studio-card";

const INSIGHTS = [
  { q: "Fan-out on write vs read?", a: "Write: pre-compute feeds (fast reads, expensive for celebrities). Read: compute on demand. Real systems: hybrid." },
  { q: "Why do URL shorteners use 302, not 301?", a: "302 sends every click back to your server for analytics. 301 gets cached by browsers." },
  { q: "Cache-aside: what happens on a miss?", a: "Read cache → miss → read DB → write to cache. Next read is a hit." },
];

const AVATAR_COLORS = ["#7c5cfa", "#22c55e", "#3b82f6", "#f59e0b"];

export function StudioDailyInsight() {
  const insight = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
    );
    return INSIGHTS[dayOfYear % INSIGHTS.length];
  }, []);

  const [revealed, setRevealed] = useState(false);

  return (
    <StudioCard className="flex h-full flex-col justify-between p-5">
      <div>
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--studio-text-subtle)]">
            Think about it
          </p>
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--studio-purple)_18%,transparent)] text-[var(--studio-purple-light)]">
            <Lightbulb className="h-4 w-4" />
          </div>
        </div>
        <h2 className="mt-4 text-xl font-bold leading-snug text-[var(--studio-text)]">
          {insight.q}
        </h2>
        {revealed && (
          <p className="mt-3 text-sm leading-relaxed text-[var(--studio-text-muted)]">
            {insight.a}
          </p>
        )}
        <button
          type="button"
          onClick={() => setRevealed(!revealed)}
          className="studio-link mt-3 inline-flex items-center gap-1"
        >
          {revealed ? "Hide answer" : "Reveal answer"}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-6 flex items-center gap-2 border-t border-[var(--studio-border)] pt-4">
        <div className="flex items-center">
          {AVATAR_COLORS.map((color, i) => (
            <div
              key={i}
              className="-ml-2 grid h-7 w-7 place-items-center rounded-full border-2 border-[var(--studio-surface)] text-[9px] font-bold text-white first:ml-0"
              style={{ background: color }}
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
        <span className="rounded-md bg-[var(--studio-surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--studio-text-muted)]">
          +342
        </span>
        <span className="text-[11px] text-[var(--studio-text-muted)]">
          342 learners discussed this
        </span>
      </div>
    </StudioCard>
  );
}
