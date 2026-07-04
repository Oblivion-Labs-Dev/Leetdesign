import {
  PenTool,
  FolderKanban,
  Sparkles,
  Library,
  BookOpenText,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

export type StudioNavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  tour?: string;
};

export const STUDIO_NAV_ITEMS: StudioNavItem[] = [
  { href: "/dashboard", label: "Studio", icon: PenTool, tour: "nav-dashboard" },
  { href: "/projects", label: "Projects", icon: FolderKanban, tour: "nav-projects" },
  { href: "/practice", label: "Practice", icon: Sparkles, tour: "nav-practice" },
  { href: "/tasks", label: "Taskboard", shortLabel: "Tasks", icon: ListChecks },
  { href: "/library", label: "Component Library", shortLabel: "Library", icon: Library },
  { href: "/brushup", label: "Concepts", icon: BookOpenText },
];

export function isStudioNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
