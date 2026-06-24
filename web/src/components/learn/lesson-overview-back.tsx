"use client";

import { ArrowLeft } from "lucide-react";

export function LessonOverviewBack({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="lesson-clay-back"
      aria-label="Back to concepts overview"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
    </button>
  );
}
