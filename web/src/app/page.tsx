import Link from "next/link";
import {
  ArrowRight,
  Bot,
  GitBranch,
  Network,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { LeetdesignLogo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { BRAND } from "@/lib/brand";

export default function Landing() {
  return (
    <div className="relative z-10 min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <LeetdesignLogo />
        <nav className="hidden items-center gap-7 text-sm text-[var(--foreground-muted)] md:flex">
          <a href="#how" className="hover:text-[var(--foreground)]">
            How it works
          </a>
          <a href="#what" className="hover:text-[var(--foreground)]">
            What you build
          </a>
          <a href="#progress" className="hover:text-[var(--foreground)]">
            Progression
          </a>
        </nav>
        <Link href="/login">
          <Button variant="outline" size="sm">
            Sign in
          </Button>
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-12 pb-20 text-center">
        <Pill tone="brand" className="mx-auto mb-5">
          <Sparkles className="h-3 w-3" /> {BRAND.lockup}
        </Pill>
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
          Learn system design by{" "}
          <span className="brand-gradient-text">working at a company</span>
          <br />
          that lives in your browser.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-[var(--foreground-muted)] sm:text-lg">
          Learn like you are embedded on a platform team—badge progression,
          incidents, and a pipeline you drag, fix, and ship through simulated
          CI/CD.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/login?mode=signup">
            <Button size="lg">
              Create account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Sign in
            </Button>
          </Link>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-3">
          <FeatureChip
            icon={Workflow}
            title="Live pipeline"
            text="Drag components into missing slots and watch the system stabilize."
          />
          <FeatureChip
            icon={GitBranch}
            title="Real delivery flow"
            text="Branches, CI checks, conflicts, and merges to main."
          />
          <FeatureChip
            icon={Bot}
            title="On-call bot"
            text="Guide narrates incidents and reacts to your fix in real time."
          />
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={ShieldCheck}
            title="Badge-led progression"
            text="Start as an Leetdesign Intern. Earn XP from incidents and reviews to climb to Software Engineer I, II, Senior, and Principal."
          />
          <FeatureCard
            icon={Zap}
            title="Guided incidents"
            text="Tutorials hand you a half-built system. Drop the right components in, and connections auto-wire."
          />
          <FeatureCard
            icon={Network}
            title="Free-build practice"
            text="Practice prompts let you build the full architecture, then submit it to a VP review meeting for AI grading."
          />
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-12 text-center text-xs text-[var(--foreground-subtle)]">
        Leetdesign · v0.1.0
      </footer>
    </div>
  );
}

function FeatureChip({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="surface flex items-start gap-3 px-4 py-4 text-left">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-500/10 text-violet-300">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-[var(--foreground-muted)]">{text}</div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="surface p-6">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 text-violet-200">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-base font-semibold">{title}</div>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">{text}</p>
    </div>
  );
}
