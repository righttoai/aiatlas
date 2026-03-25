"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/atlas", label: "Atlas" },
  { href: "/contribute", label: "Contribute" }
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/96">
      <div className="mx-auto flex max-w-[112rem] flex-col gap-3 px-3 py-3 sm:px-4 lg:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="rounded-full px-1 py-1 text-sm font-semibold text-foreground transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Participatory AI Atlas
          </Link>
          <ThemeToggle className="md:hidden" />
        </div>

        <div className="flex items-center justify-between gap-3 md:justify-end">
          <nav aria-label="Primary" className="flex flex-wrap items-center gap-2">
            {links.map(({ href, label }) => {
              const active =
                href === "/atlas"
                  ? pathname === "/" || pathname?.startsWith("/atlas")
                  : pathname === href || pathname?.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex items-center rounded-md border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    active
                      ? "border-border/80 bg-surface text-foreground"
                      : "border-transparent text-subtle hover:border-border hover:bg-surface-soft hover:text-foreground"
                  )}
                >
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <ThemeToggle className="hidden md:inline-flex" />
        </div>
      </div>
    </header>
  );
}
