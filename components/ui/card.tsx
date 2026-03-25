import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "surface-panel rounded-md border border-border/50 p-5 shadow-none sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
