import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  ListChecks,
  BookOpenText,
  Library,
  type LucideIcon,
} from "lucide-react";

export type AppNavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  tour?: string;
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  { href: "/dashboard", label: "Studio", icon: LayoutDashboard, tour: "nav-dashboard" },
  { href: "/projects", label: "Projects", icon: FolderKanban, tour: "nav-projects" },
  { href: "/practice", label: "Practice", icon: Sparkles, tour: "nav-practice" },
  { href: "/tasks", label: "Taskboard", shortLabel: "Tasks", icon: ListChecks },
  { href: "/brushup", label: "Concepts", icon: BookOpenText },
  { href: "/library", label: "Library", icon: Library },
];

export function isAppNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
