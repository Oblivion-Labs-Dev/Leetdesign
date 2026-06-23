import Link from "next/link";
import { ArrowRight, Play, Puzzle, Wrench } from "lucide-react";
import { WalkthroughThinkingBoard } from "@/components/landing/walkthrough-thinking-board";

const STEPS = [
  {
    n: "01",
    icon: Puzzle,
    title: "Compose from a component library",
    body: "APIs, caches, queues, data stores — drag the pieces you'd actually name in a design review, not abstract infra boxes.",
    tone: "#6B8CAE",
  },
  {
    n: "02",
    icon: Wrench,
    title: "Wire the data path yourself",
    body: "Draw how a request moves. Where does it hit cache first? What goes async? The connections are where the thinking happens.",
    tone: "#9B8DC4",
  },
  {
    n: "03",
    icon: Play,
    title: "Run it and read the story",
    body: "Hit play and watch your pipeline execute. See which hop slows down, what fails, and what you'd change before the next iteration.",
    tone: "#7BA892",
  },
];

export function ProductWalkthrough() {
  return (
    <section
      id="how-it-works"
      className="border-y border-[var(--clay-border)] bg-[var(--clay-bg-soft)]/72 py-20"
    >
      <div className="mx-auto w-full max-w-[88rem] px-5 sm:px-8 lg:px-12">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Decision board — non-flow visual to avoid repeating hero */}
          <div className="order-2 lg:order-1" id="live-demo">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
              Practice system judgment
            </p>
            <WalkthroughThinkingBoard />
          </div>

          {/* Copy — new info, not hero repeat */}
          <div className="order-1 lg:order-2">
            <h2 className="clay-display text-3xl font-bold leading-tight text-[var(--clay-text)] sm:text-4xl">
              Three moves.
              <br />
              One complete design loop.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--clay-text-muted)]">
              Most prep is passive — read a blog, copy a diagram. Here you build
              the architecture, connect the paths, and watch what your decisions
              actually do.
            </p>

            <ol className="mt-8 space-y-6">
              {STEPS.map((step) => (
                <li key={step.n} className="flex gap-4">
                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--clay-border)]"
                    style={{
                      background: `color-mix(in srgb, ${step.tone} 14%, var(--clay-surface))`,
                      color: step.tone,
                    }}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
                      Step {step.n}
                    </p>
                    <h3 className="clay-display mt-0.5 text-base font-semibold text-[var(--clay-text)]">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--clay-text-muted)]">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--clay-primary)] hover:underline"
            >
              Try it in the studio
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
