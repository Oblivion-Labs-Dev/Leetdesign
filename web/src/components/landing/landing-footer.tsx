import Link from "next/link";
import { ClayLogo } from "./clay-logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Open studio", href: "/dashboard" },
      { label: "Component library", href: "/library" },
      { label: "Practice", href: "/practice" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Topics", href: "#topics" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Brush-up", href: "/brushup" },
      { label: "Settings", href: "/settings" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--clay-border)] bg-[var(--clay-surface)]">
      <div className="mx-auto w-full max-w-[88rem] px-5 py-14 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <ClayLogo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--clay-text-muted)]">
              Hands-on system design for developers. Compose services, run live
              pipelines, and build the architectural intuition interviews test.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--clay-text)]">
                {col.title}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("#") ? (
                      <a
                        href={link.href}
                        className="text-sm text-[var(--clay-text-muted)] transition hover:text-[var(--clay-text)]"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-[var(--clay-text-muted)] transition hover:text-[var(--clay-text)]"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--clay-border)] bg-[var(--clay-bg-soft)]/58">
        <div className="mx-auto flex w-full max-w-[88rem] flex-col items-center justify-between gap-3 px-5 py-5 text-xs text-[var(--clay-text-subtle)] sm:flex-row sm:px-8 lg:px-12">
          <p>© {new Date().getFullYear()} Leetdesign. All rights reserved.</p>
          <p>Learn system design by building — in your browser.</p>
        </div>
      </div>
    </footer>
  );
}
