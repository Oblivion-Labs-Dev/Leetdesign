"use client";

import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { isStudioNavActive, STUDIO_NAV_ITEMS } from "./studio-nav-items";

export function StudioMobileNav() {
  return (
    <MobileBottomNav
      items={STUDIO_NAV_ITEMS}
      isActive={isStudioNavActive}
      className="border-[var(--studio-border)] bg-[var(--studio-surface)]/95"
      activeClassName="text-[var(--studio-text)]"
      inactiveClassName="text-[var(--studio-text-muted)]"
    />
  );
}
