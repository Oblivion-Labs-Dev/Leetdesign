"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LeetdesignLogo } from "./logo";
import { cn } from "@/lib/utils";
import { APP_NAV_ITEMS, isAppNavActive } from "./app-nav-items";

const SECTIONS = [
  { label: "Workspace", items: APP_NAV_ITEMS.slice(0, 4) },
  { label: "Knowledge", items: APP_NAV_ITEMS.slice(4) },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col self-start overflow-hidden border-r border-[var(--border)] bg-[var(--background-elevated)]/60 backdrop-blur-md md:flex">
      <div className="flex h-16 items-center border-b border-[var(--border)] px-5">
        <LeetdesignLogo />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {SECTIONS.map((sec) => (
          <div key={sec.label}>
            <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--foreground-subtle)]">
              {sec.label}
            </div>
            <ul className="space-y-1">
              {sec.items.map((item) => {
                const active = isAppNavActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      data-tour={item.tour}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-[var(--surface-2)] text-[var(--foreground)] ring-1 ring-violet-500/30"
                          : "text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active
                            ? "text-violet-300"
                            : "text-[var(--foreground-subtle)] group-hover:text-[var(--foreground-muted)]",
                        )}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-[var(--border)] px-5 py-4 text-[11px] text-[var(--foreground-subtle)]">
        v0.1.0 · Leetdesign MVP
      </div>
    </aside>
  );
}
