"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Search, Settings } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { ROADMAP_META } from "@/lib/content/learn/roadmap";

function isConceptsPath(pathname: string) {
  return pathname === "/brushup" || pathname.startsWith("/brushup/");
}

export function StudioHeader({ firstName }: { firstName: string }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const onConcepts = isConceptsPath(pathname);

  return (
    <header className="studio-header flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="studio-header-copy min-w-0">
        <h1 className="studio-header-title text-xl font-semibold tracking-tight text-[var(--studio-text)] sm:text-2xl">
          {onConcepts ? ROADMAP_META.title : `Hi, ${firstName} 👋`}
        </h1>
        <p className="studio-header-subtitle mt-0.5 text-sm text-[var(--studio-text-muted)]">
          Let&apos;s keep building great systems.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        <label className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--studio-text-subtle)]" />
          <input
            type="search"
            placeholder="Search anything..."
            className="h-9 w-52 rounded-xl border border-[var(--studio-border)] bg-[var(--studio-surface)] pl-9 pr-14 text-sm text-[var(--studio-text)] placeholder:text-[var(--studio-text-subtle)] focus:border-[var(--studio-purple)] focus:outline-none lg:w-64"
            disabled
            aria-label="Search (coming soon)"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-[var(--studio-border)] bg-[var(--studio-surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--studio-text-muted)]">
            ⌘ K
          </kbd>
        </label>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
          className="grid h-9 w-9 place-items-center rounded-full border border-[var(--studio-border)] text-[var(--studio-text-muted)] transition-colors hover:text-[var(--studio-text)]"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <Link
          href="/settings"
          className="grid h-9 w-9 place-items-center rounded-full border border-[var(--studio-border)] text-[var(--studio-text-muted)] transition-colors hover:text-[var(--studio-text)]"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>
        <div
          className="grid h-9 w-9 place-items-center rounded-full bg-[var(--studio-purple)] text-sm font-bold text-white"
          aria-label="Profile"
        >
          {firstName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
