import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

export function buttonStyles({
  variant = "primary",
  size = "md",
  className
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-md border font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
    size === "md" ? "h-11 px-5 text-sm" : "h-9 px-4 text-sm",
    variant === "primary" &&
      "border-accent/80 bg-accent text-accent-foreground hover:border-accent hover:bg-accent/90",
    variant === "secondary" &&
      "border-border/55 bg-surface text-foreground hover:border-border/70 hover:bg-surface-soft",
    variant === "ghost" && "border-transparent text-subtle hover:bg-surface-soft hover:text-foreground",
    className
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={buttonStyles({ variant, size, className })} {...props} />;
}
