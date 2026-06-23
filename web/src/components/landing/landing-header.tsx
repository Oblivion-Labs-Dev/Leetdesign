import Link from "next/link";
import { cn } from "@/lib/utils";
import { ClayLogo } from "./clay-logo";
import { ClayThemeToggle } from "./clay-theme-toggle";

export function LandingHeader() {
  return (
    <header className="mx-auto flex w-full max-w-[88rem] items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
      <ClayLogo />
      <nav className="hidden items-center gap-8 text-sm font-medium text-[var(--clay-text-muted)] md:flex">
        <a href="#how-it-works" className="transition hover:text-[var(--clay-text)]">
          How it works
        </a>
        <a href="#topics" className="transition hover:text-[var(--clay-text)]">
          Topics
        </a>
      </nav>
      <div className="flex items-center gap-3">
        <ClayThemeToggle />
        <Link
          href="/dashboard"
          className={cn("clay-btn clay-btn-primary clay-btn-sm")}
        >
          Start learning
        </Link>
      </div>
    </header>
  );
}
