"use client";

import { Moon, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const THEME_STORAGE_KEY = "pai-atlas-theme";
const THEME_EVENT_NAME = "atlas-theme-change";

type Theme = "light" | "dark";

function setThemeOnDocument(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  document.body?.setAttribute("data-theme", theme);
}

function readThemeFromDocument(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  setThemeOnDocument(theme);
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new CustomEvent(THEME_EVENT_NAME, { detail: theme }));
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const currentTheme = readThemeFromDocument();
    setTheme(currentTheme);
    setMounted(true);

    function syncTheme() {
      setTheme(readThemeFromDocument());
    }

    window.addEventListener(THEME_EVENT_NAME, syncTheme);
    window.addEventListener("storage", syncTheme);

    return () => {
      window.removeEventListener(THEME_EVENT_NAME, syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  function handleToggle() {
    const nextTheme = theme === "light" ? "dark" : "light";
    applyTheme(nextTheme);
    setTheme(nextTheme);
  }

  const nextTheme = theme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={mounted ? `Switch to ${nextTheme} theme` : "Toggle theme"}
      title={mounted ? `${nextTheme === "dark" ? "Dark" : "Light"} theme` : "Toggle theme"}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-md border border-border/55 surface-panel text-foreground transition hover:border-border/70 hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      {theme === "light" ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
    </button>
  );
}
