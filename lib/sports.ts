import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { DEFAULT_SPORT, type Sport } from "@/lib/sport-constants";

export {
  SPORTS,
  DEFAULT_SPORT,
  SPORT_LABELS,
  SPORT_OPTIONS,
  isSport,
  type Sport,
} from "@/lib/sport-constants";

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
