"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { applyAccentColor } from "@/lib/accent-colors";

type VTDocument = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    /* eslint-disable react-hooks/set-state-in-effect -- hydration-safe read from localStorage */
    setMounted(true);
    setIsDark(stored ? stored === "dark" : true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function applyTheme(next: boolean) {
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
    const accent = localStorage.getItem("accent") ?? "blue";
    applyAccentColor(accent);
  }

  async function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const next = !isDark;
    const vtDoc = document as VTDocument;

    if (!vtDoc.startViewTransition) {
      applyTheme(next);
      return;
    }

    const { clientX: x, clientY: y } = e;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = vtDoc.startViewTransition(() => applyTheme(next));

    try {
      await transition.ready;
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 420,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    } catch {
      // Transición interrumpida o no compatible
    }
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
      {isDark ? (
        <Sun className="size-4 shrink-0" />
      ) : (
        <Moon className="size-4 shrink-0" />
      )}
      {!compact && <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>}
    </button>
  );
}
