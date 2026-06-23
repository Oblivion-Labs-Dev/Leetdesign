import {
  Code2,
  Database,
  GitBranch,
  Layers,
  Shield,
  Zap,
} from "lucide-react";

const TOPICS = [
  {
    icon: Code2,
    title: "API design",
    body: "Shape endpoints, payloads, and boundaries between the services you own.",
  },
  {
    icon: Layers,
    title: "Service composition",
    body: "Split features across services and keep communication between them clean.",
  },
  {
    icon: Zap,
    title: "Caching decisions",
    body: "What to cache in your stack, when to invalidate, and what breaks if you guess wrong.",
  },
  {
    icon: GitBranch,
    title: "Async & background work",
    body: "Queues, webhooks, and jobs — when to move work off the request path.",
  },
  {
    icon: Shield,
    title: "Graceful failures",
    body: "Retries, fallbacks, and code paths that keep a feature alive when a dependency fails.",
  },
  {
    icon: Database,
    title: "Data modeling",
    body: "Tables, documents, and access patterns that match how your app reads and writes.",
  },
];

export function LearnTopics() {
  return (
    <section id="topics" className="py-20">
      <div className="mx-auto w-full max-w-[88rem] px-5 sm:px-8 lg:px-12">
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="clay-pill mb-4">What you&apos;ll practice</p>
            <h2 className="clay-display text-3xl font-bold tracking-tight text-[var(--clay-text)] sm:text-4xl">
              The design skills developers actually need
            </h2>
          </div>
          <p className="max-w-md text-base text-[var(--clay-text-muted)]">
            Every exercise sharpens how you think about code, services, and data —
            the same muscles you use when designing a feature or whiteboarding in an interview.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((topic) => (
            <article
              key={topic.title}
              className="clay-card-inset group flex gap-4 p-5 transition hover:border-[var(--clay-primary)]/30"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--clay-border)] bg-white text-[var(--clay-primary)] shadow-[var(--clay-shadow-in)] transition group-hover:text-[var(--clay-accent)]">
                <topic.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="clay-display text-base font-semibold text-[var(--clay-text)]">
                  {topic.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--clay-text-muted)]">
                  {topic.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
