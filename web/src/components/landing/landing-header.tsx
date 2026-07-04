import Link from "next/link";
import { cn } from "@/lib/utils";
import { ClayLogo } from "./clay-logo";
import { ClayThemeToggle } from "./clay-theme-toggle";

export function LandingHeader() {
  return (
    <header className="mx-auto w-full max-w-[88rem] px-5 py-4 sm:px-8 sm:py-6 lg:px-12">
      <div className="flex items-center justify-between gap-3">
        <ClayLogo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-[var(--clay-text-muted)] md:flex">
          <a href="#how-it-works" className="transition hover:text-[var(--clay-text)]">
            How it works
          </a>
          <a href="#topics" className="transition hover:text-[var(--clay-text)]">
            Topics
          </a>
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ClayThemeToggle />
          <Link
            href="/dashboard"
            className={cn("clay-btn clay-btn-primary clay-btn-sm whitespace-nowrap")}
          >
            Start learning
          </Link>
        </div>
      </div>
      <nav className="mt-3 flex gap-4 overflow-x-auto text-sm font-medium text-[var(--clay-text-muted)] md:hidden">
        <a href="#how-it-works" className="shrink-0 transition hover:text-[var(--clay-text)]">
          How it works
        </a>
        <a href="#topics" className="shrink-0 transition hover:text-[var(--clay-text)]">
          Topics
        </a>
      </nav>
    </header>
  );
}
