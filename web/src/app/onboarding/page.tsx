import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { LeetdesignLogo } from "@/components/layout/logo";
import { LeetdesignBot } from "@/components/bot/bot";
import { IdentityCard } from "@/components/badge/identity-card";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { BRAND } from "@/lib/brand";
import { getCurrentUserProfile } from "@/lib/auth-guard";
import { requireBackendUser } from "@/lib/backend-auth";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const { user } = await requireBackendUser();
  if (user.firstVisitCompleted) {
    redirect("/dashboard");
  }
  const profile = await getCurrentUserProfile();
  return (
    <div className="relative z-10 min-h-screen px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <LeetdesignLogo />
          <Pill tone="brand">
            <Sparkles className="h-3 w-3" /> Day 1 · Onboarding
          </Pill>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="surface p-6 sm:p-8">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-violet-300/80">
              Welcome to {BRAND.product}
            </div>
            <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Congratulations — you have been hired as an{" "}
              <span className="brand-gradient-text">Intern at {BRAND.product}.</span>
            </h1>
            <p className="mt-4 text-sm text-[var(--foreground-muted)]">
              Your badge is ready. You will get incidents from on-call, fix
              real-feeling architecture, and ship through a simulated CI/CD
              pipeline. As you resolve incidents and pass reviews, you climb
              the ladder: Intern → SE I → SE II → Senior → Principal.
            </p>

            <div className="mt-6">
              <LeetdesignBot
                mood="happy"
                speakerName="Guide · On-call Bot"
                message="I see you have learned the Hello World. Now let's build the worlds you said hello to. Your first day is short - meet your dashboard, understand your role, and start smoothly."
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/dashboard?tour=1">
                <Button size="lg">
                  Enter the dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <IdentityCard profile={profile} />
        </div>
      </div>
    </div>
  );
}
