import { ArrowRight, Code2, Layers, Sparkles } from "lucide-react";
import { ClayButton } from "@/components/landing/clay-button";
import { HeroShowcase } from "@/components/landing/hero/hero-showcase";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { LearnTopics } from "@/components/landing/learn-topics";
import { ProductWalkthrough } from "@/components/landing/product-walkthrough";

const HERO_STATS = [
  { icon: Layers, label: "Tactile studio", value: "Sketch & connect" },
  { icon: Code2, label: "Developer-first", value: "APIs & data flows" },
  { icon: Sparkles, label: "Zero friction", value: "Open & start" },
];

export default function LandingPage() {
  return (
    <div className="clay-landing relative min-h-screen overflow-x-hidden">
      <LandingHeader />

      <main>
        <section className="mx-auto w-full max-w-[88rem] px-5 pb-16 pt-6 sm:px-8 lg:px-12 lg:pb-20 lg:pt-10">
          <div className="grid items-center gap-10 xl:grid-cols-[0.92fr_1.28fr] xl:gap-12">
            <div className="max-w-xl xl:max-w-2xl">
              <p className="clay-pill mb-5">System design, hands-on</p>
              <h1 className="clay-display text-4xl font-bold leading-[1.06] tracking-tight text-[var(--clay-text)] sm:text-5xl xl:text-[3.4rem]">
                The studio where
                <br />
                <span className="clay-gradient-text">system design clicks</span>
              </h1>
              <p className="mt-5 text-base leading-relaxed text-[var(--clay-text-muted)] sm:text-lg">
                Compose services, wire data flows, and watch your pipeline run —
                the hands-on way to build architectural thinking as a developer.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ClayButton href="/dashboard">
                  Start learning
                  <ArrowRight className="h-4 w-4" />
                </ClayButton>
                <ClayButton href="#how-it-works" variant="secondary">
                  See how it works
                </ClayButton>
              </div>

              <ul className="mt-10 grid gap-3 sm:grid-cols-3">
                {HERO_STATS.map((stat) => (
                  <li
                    key={stat.label}
                    className="clay-card-inset flex items-center gap-3 px-4 py-3"
                  >
                    <stat.icon className="h-4 w-4 shrink-0 text-[var(--clay-primary)]" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
                        {stat.label}
                      </p>
                      <p className="text-xs font-semibold text-[var(--clay-text)]">
                        {stat.value}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative w-full min-w-0">
              <HeroShowcase />
            </div>
          </div>
        </section>

        <ProductWalkthrough />
        <LearnTopics />

        <section className="mx-auto w-full max-w-[88rem] px-5 py-20 sm:px-8 lg:px-12">
          <div className="clay-card relative overflow-hidden px-8 py-12 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10 lg:px-12 lg:py-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[var(--clay-primary)]/10 blur-3xl" />
            <div>
              <h2 className="clay-display text-2xl font-bold text-[var(--clay-text)] sm:text-3xl lg:text-4xl">
                Ready to think like a
                <br />
                system-minded developer?
              </h2>
              <p className="mt-3 max-w-xl text-[var(--clay-text-muted)]">
                Open the studio in your browser — no account, no install.
              </p>
            </div>
            <ClayButton href="/dashboard" className="mt-8 shrink-0 lg:mt-0">
              Open your studio
              <ArrowRight className="h-4 w-4" />
            </ClayButton>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
