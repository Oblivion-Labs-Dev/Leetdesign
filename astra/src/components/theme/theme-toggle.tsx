"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle({ size = "md" }: { size?: "sm" | "md" }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const Icon = isLight ? Sun : Moon;
  const label = isLight ? "Light" : "Dark";
  const dim = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Theme: ${label} — click to switch`}
      aria-label={`Switch to ${isLight ? "dark" : "light"} theme`}
      className={`grid place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)] ${dim}`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
