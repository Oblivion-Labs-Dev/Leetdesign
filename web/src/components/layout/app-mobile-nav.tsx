"use client";

import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { APP_NAV_ITEMS, isAppNavActive } from "./app-nav-items";

export function AppMobileNav() {
  return (
    <MobileBottomNav
      items={APP_NAV_ITEMS}
      isActive={isAppNavActive}
      className="border-[var(--border)] bg-[var(--background)]/95"
      activeClassName="text-[var(--foreground)]"
      inactiveClassName="text-[var(--foreground-muted)]"
    />
  );
}
