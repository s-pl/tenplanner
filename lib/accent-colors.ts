export interface AccentColor {
  id: string;
  label: string;
  dark: string;
  light: string;
  preview: string;
}

export const ACCENT_COLORS: AccentColor[] = [
  {
    id: "blue",
    label: "Verde Marcador",
    dark: "oklch(0.78 0.17 148)",
    light: "oklch(0.43 0.145 150)",
    preview: "#12b76a",
  },
  {
    id: "green",
    label: "Lima Pista",
    dark: "oklch(0.82 0.18 132)",
    light: "oklch(0.49 0.16 132)",
    preview: "#84cc16",
  },
  {
    id: "violet",
    label: "Vidrio Frío",
    dark: "oklch(0.72 0.11 205)",
    light: "oklch(0.46 0.10 205)",
    preview: "#0ea5b7",
  },
  {
    id: "amber",
    label: "Arcilla",
    dark: "oklch(0.78 0.14 58)",
    light: "oklch(0.55 0.13 55)",
    preview: "#c47a20",
  },
  {
    id: "rose",
    label: "Rojo Línea",
    dark: "oklch(0.70 0.18 28)",
    light: "oklch(0.52 0.17 28)",
    preview: "#e0523f",
  },
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
