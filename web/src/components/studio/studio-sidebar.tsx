"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { LeetdesignLogo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";
import { isStudioNavActive, STUDIO_NAV_ITEMS } from "./studio-nav-items";

export function StudioSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r border-[var(--studio-border)] bg-[var(--studio-surface)]/80 backdrop-blur-sm md:flex">
      <div className="px-5 py-5">
        <LeetdesignLogo variant="clay" />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {STUDIO_NAV_ITEMS.map((item) => {
          const active = isStudioNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.tour}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-[color-mix(in_srgb,var(--studio-purple)_18%,transparent)] font-medium text-[var(--studio-text)]"
                  : "text-[var(--studio-text-muted)] hover:bg-[var(--studio-surface-2)] hover:text-[var(--studio-text)]",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-[var(--studio-purple-light)]" : "opacity-70",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <Link
          href="/projects"
          className="flex items-center gap-3 rounded-2xl border border-[var(--studio-border)] bg-[var(--studio-surface-2)] p-3.5 transition-colors hover:border-[color-mix(in_srgb,var(--studio-purple)_40%,var(--studio-border))]"
        >
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--studio-purple)] text-white">
            <Plus className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--studio-text)]">Start a project</div>
            <div className="text-[11px] text-[var(--studio-text-muted)]">Pick a guided incident</div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
