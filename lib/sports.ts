/**
 * Deportes de la capa superior de la plataforma. Tenis es el único con
 * biblioteca propia por ahora; pádel y pickleball comparten el mismo
 * modelo de datos (sesiones, clases, ejercicios — ver db/schema.ts) pero
 * muestran una pantalla "en construcción" en vez de contenido, hasta que
 * tengan su propia biblioteca validada.
 *
 * Módulo "puro" sin dependencias de servidor (nada de `db`), para que los
 * componentes cliente puedan importarlo sin arrastrar drizzle/postgres al
 * bundle del navegador. Las funciones que tocan la base de datos viven en
 * lib/sports-server.ts.
 */
export const SPORTS = [
  { id: "tenis", label: "Tenis", status: "live" },
  { id: "padel", label: "Pádel", status: "coming_soon" },
  { id: "pickleball", label: "Pickleball", status: "coming_soon" },
] as const satisfies readonly {
  id: string;
  label: string;
  status: "live" | "coming_soon";
}[];

export type Sport = (typeof SPORTS)[number]["id"];

const SPORT_IDS = SPORTS.map((s) => s.id);

export function isSport(value: unknown): value is Sport {
  return typeof value === "string" && (SPORT_IDS as string[]).includes(value);
}

export function sportLabel(sport: Sport): string {
  return SPORTS.find((s) => s.id === sport)?.label ?? sport;
}

/** `true` si el deporte ya tiene biblioteca propia (solo tenis, de momento). */
export function sportHasContent(sport: Sport): boolean {
  return SPORTS.find((s) => s.id === sport)?.status === "live";
}
