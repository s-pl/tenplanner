export interface AccentColor {
  id: string;
  label: string;
  dark: string;
  light: string;
  preview: string;
  mutedDark?: string;
  mutedLight?: string;
  inkDark?: string;
  inkLight?: string;
}

export const ACCENT_COLORS: AccentColor[] = [
  {
    id: "blue",
    label: "Lima TenPlanner",
    dark: "#d6ff38",
    light: "#d6ff38",
    preview: "#d6ff38",
    mutedDark: "#2b3613",
    mutedLight: "#efffba",
    inkDark: "#d6ff38",
    inkLight: "#5f7000",
  },
  {
    id: "green",
    label: "Verde Match",
    dark: "#5cff8d",
    light: "#5cff8d",
    preview: "#5cff8d",
    mutedDark: "#14361f",
    mutedLight: "#dcffe5",
    inkDark: "#5cff8d",
    inkLight: "#137a35",
  },
  {
    id: "violet",
    label: "Cian Vidrio",
    dark: "#6ee7ff",
    light: "#6ee7ff",
    preview: "#6ee7ff",
    mutedDark: "#10313a",
    mutedLight: "#dff8ff",
    inkDark: "#6ee7ff",
    inkLight: "#08728c",
  },
  {
    id: "amber",
    label: "Arcilla",
    dark: "#ffd166",
    light: "#ffd166",
    preview: "#ffd166",
    mutedDark: "#3d2d12",
    mutedLight: "#fff2c7",
    inkDark: "#ffd166",
    inkLight: "#8a5a00",
  },
  {
    id: "rose",
    label: "Rojo Línea",
    dark: "#ff7a66",
    light: "#ff7a66",
    preview: "#ff7a66",
    mutedDark: "#3d1f1a",
    mutedLight: "#ffe2dc",
    inkDark: "#ff7a66",
    inkLight: "#b63424",
  },
];

export function applyAccentColor(id: string) {
  const isDark = document.documentElement.classList.contains("dark");
  const storedAccent = window.localStorage.getItem("accent");
  const resolvedId = storedAccent ? id : "blue";
  const color =
    ACCENT_COLORS.find((c) => c.id === resolvedId) ?? ACCENT_COLORS[0];
  const val = isDark ? color.dark : color.light;
  const muted = isDark ? color.mutedDark : color.mutedLight;
  const ink = isDark ? color.inkDark : color.inkLight;
  const el = document.documentElement;
  el.style.setProperty("--brand", val);
  el.style.setProperty("--brand-muted", muted ?? val);
  el.style.setProperty("--brand-ink", ink ?? val);
  el.style.setProperty("--brand-foreground", "#050505");
  el.style.setProperty("--primary", val);
  el.style.setProperty("--primary-foreground", "#050505");
  el.style.setProperty("--ring", val);
  el.style.setProperty("--sidebar-primary", val);
  el.style.setProperty("--sidebar-primary-foreground", "#050505");
  el.style.setProperty("--sidebar-ring", val);
}

export function applyFontSize(size: string) {
  const map: Record<string, string> = { sm: "13px", md: "15px", lg: "17px" };
  document.documentElement.style.fontSize = map[size] ?? "15px";
}
