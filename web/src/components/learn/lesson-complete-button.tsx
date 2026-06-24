"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

export function LessonCompleteButton({
  trackSlug,
  conceptSlug,
  alreadyCompleted,
}: {
  trackSlug: string;
  conceptSlug: string;
  alreadyCompleted: boolean;
}) {
  const router = useRouter();
  const [done, setDone] = useState(alreadyCompleted);
  const [loading, setLoading] = useState(false);

  async function markComplete() {
    setLoading(true);
    try {
      const res = await fetch("/api/user/concepts/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackSlug, conceptSlug }),
      });
      if (!res.ok) return;
      setDone(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function markIncomplete() {
    setLoading(true);
    try {
      const res = await fetch("/api/user/concepts/complete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackSlug, conceptSlug }),
      });
      if (!res.ok) return;
      setDone(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="learn-complete-actions">
        <div className="learn-complete-banner">
          <Check className="h-4 w-4 text-[var(--studio-green)]" />
          <span>Concept marked complete — progress updated on your roadmap.</span>
        </div>
        <button
          type="button"
          onClick={markIncomplete}
          disabled={loading}
          className="studio-btn-ghost"
        >
          {loading ? "Saving…" : "Mark as incomplete"}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={markComplete}
      disabled={loading}
      className="studio-btn-primary w-full sm:w-auto"
    >
      {loading ? "Saving…" : "Mark concept as learned"}
    </button>
  );
}
