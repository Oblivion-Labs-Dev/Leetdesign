"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type MobileNavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  tour?: string;
};

export function MobileBottomNav({
  items,
  isActive,
  className,
  activeClassName,
  inactiveClassName,
}: {
  items: MobileNavItem[];
  isActive: (pathname: string, href: string) => boolean;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-md md:hidden",
        className,
      )}
      aria-label="Primary navigation"
    >
      <div className="flex items-stretch justify-around gap-0.5 overflow-x-auto px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          const displayLabel = item.shortLabel ?? item.label;

          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.tour}
              className={cn(
                "flex min-w-[4.25rem] flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors",
                active ? activeClassName : inactiveClassName,
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "opacity-100" : "opacity-70")} />
              <span className="max-w-[4.5rem] truncate leading-tight">{displayLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
