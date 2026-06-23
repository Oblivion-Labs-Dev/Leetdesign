import Link from "next/link";
import { cn } from "@/lib/utils";

type ClayButtonProps = {
  href: string;
  variant?: "primary" | "secondary";
  size?: "sm" | "lg";
  className?: string;
  children: React.ReactNode;
};

export function ClayButton({
  href,
  variant = "primary",
  size = "lg",
  className,
  children,
}: ClayButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "clay-btn",
        variant === "primary" ? "clay-btn-primary" : "clay-btn-secondary",
        size === "lg" ? "clay-btn-lg" : "clay-btn-sm",
        className,
      )}
    >
      {children}
    </Link>
  );
}
