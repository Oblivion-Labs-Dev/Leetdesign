"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import type { ReflectionQuestion } from "@/lib/simulator/courses/types";
import { cn } from "@/lib/utils";

export function MilestoneReflection({
  question,
  onAnswer,
  showExplanation,
  learningMode,
}: {
  question: ReflectionQuestion;
  onAnswer: (answer: string) => boolean;
  showExplanation?: boolean;
  learningMode: "beginner" | "interview" | "sandbox";
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);

  const handleSelect = (option: string) => {
    if (learningMode === "sandbox") return;
    setSelected(option);
    const ok = onAnswer(option);
    if (!ok) setWrong(true);
  };

  return (
    <div className="rounded-xl border border-[var(--clay-primary)]/25 bg-[var(--clay-primary)]/5 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--clay-primary)]">
        <HelpCircle className="h-3 w-3" />
        Reflection
      </div>
      <p className="text-sm font-medium text-[var(--clay-text)]">{question.question}</p>
      <div className="mt-2 space-y-1">
        {question.options.map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={learningMode === "sandbox"}
            onClick={() => handleSelect(opt)}
            className={cn(
              "block w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors",
              selected === opt && opt === question.correctAnswer
                ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-700"
                : selected === opt && wrong
                  ? "border-rose-400/50 bg-rose-500/10 text-rose-600"
                  : "border-[var(--clay-border)] bg-[var(--clay-surface)] hover:border-[var(--clay-primary)]/30",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      {(showExplanation || (wrong && learningMode === "beginner")) && (
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--clay-text-muted)]">
          {question.explanation}
        </p>
      )}
    </div>
  );
}
