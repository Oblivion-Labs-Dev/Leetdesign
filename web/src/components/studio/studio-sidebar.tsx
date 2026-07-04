"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { LeetdesignLogo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";
import { isStudioNavActive, STUDIO_NAV_ITEMS } from "./studio-nav-items";

function isProjectWorkspace(pathname: string) {
  return /^\/projects\/[^/]+$/.test(pathname);
}

export function StudioSidebar({ collapsed: collapsedProp }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const collapsed = collapsedProp ?? isProjectWorkspace(pathname);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[var(--studio-border)] bg-[color-mix(in_srgb,var(--clay-surface)_82%,transparent)] backdrop-blur-sm transition-[width] duration-200 ease-out md:flex",
        collapsed ? "w-[4.25rem]" : "w-[240px]",
      )}
    >
      <div className={cn("py-5", collapsed ? "px-2.5" : "px-5")}>
        <LeetdesignLogo variant="clay" compact={collapsed} />
      </div>

      <nav className={cn("flex-1 space-y-0.5 overflow-y-auto", collapsed ? "px-2" : "px-3")}>
        {STUDIO_NAV_ITEMS.map((item) => {
          const active = isStudioNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.tour}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-xl text-sm transition-colors",
                collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
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
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn("p-4", collapsed && "p-2")}>
        <Link
          href="/projects"
          title={collapsed ? "Start a project" : undefined}
          className={cn(
            "flex items-center rounded-2xl border border-[var(--studio-border)] bg-[var(--studio-surface-2)] transition-colors hover:border-[color-mix(in_srgb,var(--clay-primary)_40%,var(--studio-border))] hover:shadow-[var(--clay-shadow-out)]",
            collapsed ? "justify-center p-2.5" : "gap-3 p-3.5",
          )}
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-[#84a3c2] to-[var(--clay-primary)] text-white shadow-[0_8px_20px_-10px_rgba(107,140,174,0.55)]">
            <Plus className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-semibold text-[var(--studio-text)]">Start a project</div>
              <div className="text-[11px] text-[var(--studio-text-muted)]">Pick a guided incident</div>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
