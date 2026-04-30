"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    title: "Welcome to Astra",
    description:
      "You cleared interviews and joined the org as an Intern at Astra. This is your command center.",
  },
  {
    title: "Left sidebar = your workspace map",
    description:
      "Projects for guided incidents, Practice for free-build architecture, Library for component deep-dives.",
  },
  {
    title: "Dashboard tracks your standing",
    description:
      "You level up with XP, merge acceptance, and practice review quality.",
  },
  {
    title: "Project workspace is the core game",
    description:
      "Drag components into missing slots, run simulated CI/CD, and stabilize the pipeline.",
  },
];

export function FirstTour() {
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const step = STEPS[idx];
  const isLast = idx === STEPS.length - 1;

  async function finish() {
    setLoading(true);
    await fetch("/api/user/complete-onboarding", { method: "POST" });
    router.push("/dashboard");
  }

  return (
    <div className="surface max-w-2xl p-8">
      <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-violet-300/80">
        Astra product tour · step {idx + 1}/{STEPS.length}
      </div>
      <h1 className="text-2xl font-semibold">{step.title}</h1>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
        {step.description}
      </p>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={finish} disabled={loading}>
          Skip tour
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIdx((s) => Math.max(0, s - 1))}
            disabled={idx === 0}
          >
            Previous
          </Button>
          {isLast ? (
            <Button onClick={finish} disabled={loading}>
              Finish and open dashboard
            </Button>
          ) : (
            <Button onClick={() => setIdx((s) => s + 1)}>Next</Button>
          )}
        </div>
      </div>
    </div>
  );
}
