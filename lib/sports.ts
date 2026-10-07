import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sportEnum, users } from "@/db/schema";

/** Valores válidos de la columna `sport` (ver db/schema.ts). */
export const SPORTS = sportEnum.enumValues;
export type Sport = (typeof SPORTS)[number];

export const DEFAULT_SPORT: Sport = "tenis";

export const SPORT_LABELS: Record<Sport, string> = {
  tenis: "Tenis",
  padel: "Pádel",
  pickleball: "Pickleball",
  tenis_playa: "Tenis playa",
};

export const SPORT_OPTIONS: { id: Sport; label: string }[] = SPORTS.map(
  (id) => ({ id, label: SPORT_LABELS[id] })
);

export function isSport(value: string): value is Sport {
  return (SPORTS as readonly string[]).includes(value);
}

/**
 * El deporte activo del usuario — el contexto que filtra todo lo que ve y
 * crea (sesiones, biblioteca, grupos...). Se elige desde el selector de
 * deporte y se recuerda hasta que lo cambie; independiente del "modo de
 * trabajo" (particular/club) de lib/clubs.ts.
 */
export async function getActiveSport(userId: string): Promise<Sport> {
  const [row] = await db
    .select({ activeSport: users.activeSport })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.activeSport ?? DEFAULT_SPORT;
}

export async function setActiveSport(userId: string, sport: Sport) {
  await db.update(users).set({ activeSport: sport }).where(eq(users.id, userId));
}
