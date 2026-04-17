export interface AccentColor {
  id: string;
  label: string;
  dark: string;
  light: string;
  preview: string;
}

export const ACCENT_COLORS: AccentColor[] = [
  { id: "green",  label: "Padel Green", dark: "oklch(0.73 0.19 148)", light: "oklch(0.48 0.18 148)", preview: "#4ade80" },
  { id: "blue",   label: "Ocean Blue",  dark: "oklch(0.68 0.18 230)", light: "oklch(0.48 0.18 230)", preview: "#60a5fa" },
  { id: "violet", label: "Violet",      dark: "oklch(0.68 0.18 290)", light: "oklch(0.50 0.18 290)", preview: "#a78bfa" },
  { id: "amber",  label: "Amber",       dark: "oklch(0.78 0.18 70)",  light: "oklch(0.58 0.18 70)",  preview: "#fbbf24" },
  { id: "rose",   label: "Rose",        dark: "oklch(0.70 0.20 15)",  light: "oklch(0.52 0.20 15)",  preview: "#fb7185" },
];

export function applyAccentColor(id: string) {
  const isDark = document.documentElement.classList.contains("dark");
  const color = ACCENT_COLORS.find((c) => c.id === id) ?? ACCENT_COLORS[0];
  const val = isDark ? color.dark : color.light;
  const el = document.documentElement;
  el.style.setProperty("--brand", val);
  el.style.setProperty("--primary", val);
  el.style.setProperty("--ring", val);
  el.style.setProperty("--sidebar-primary", val);
  el.style.setProperty("--sidebar-ring", val);
}

export function applyFontSize(size: string) {
  const map: Record<string, string> = { sm: "13px", md: "15px", lg: "17px" };
  document.documentElement.style.fontSize = map[size] ?? "15px";
}

export function loadAndApplySettings() {
  try {
    const accent = localStorage.getItem("accent") ?? "green";
    const fontSize = localStorage.getItem("font-size") ?? "md";
    applyAccentColor(accent);
    applyFontSize(fontSize);
  } catch {}
}
