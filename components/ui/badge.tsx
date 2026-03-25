import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "accent" | "neutral" | "outline" | "warning" | "success";

export function Badge({
  children,
  variant = "neutral",
  className
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-medium",
        variant === "accent" && "border-accent/20 bg-accent/10 text-accent",
        variant === "neutral" && "border-border/80 bg-surface-soft text-subtle",
        variant === "outline" && "border-border/80 bg-transparent text-subtle",
        variant === "warning" && "border-border/80 bg-surface-soft text-subtle",
        variant === "success" && "border-accent/18 bg-accent/8 text-accent",
        className
      )}
    >
      {children}
    </span>
  );
}
