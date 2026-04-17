"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { applyAccentColor } from "@/lib/accent-colors";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    setIsDark(stored ? stored === "dark" : true);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
    // Re-apply accent color since light/dark values differ
    const accent = localStorage.getItem("accent") ?? "green";
    applyAccentColor(accent);
  }

  if (!mounted) return <div className={compact ? "size-8" : "h-10"} />;

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={
        compact
          ? "size-8 flex items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-foreground"
          : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors w-full"
      }
    >
      {isDark ? <Sun className="size-4 shrink-0" /> : <Moon className="size-4 shrink-0" />}
      {!compact && <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>}
    </button>
  );
}
