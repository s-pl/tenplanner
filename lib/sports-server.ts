import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isSport, type Sport } from "@/lib/sports";

/** El deporte activo del usuario ahora mismo (por defecto "tenis"). */
export async function getActiveSport(userId: string): Promise<Sport> {
  const [row] = await db
    .select({ activeSport: users.activeSport })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return (row?.activeSport as Sport | undefined) ?? "tenis";
}

/**
 * Cambia el deporte activo del usuario: qué biblioteca y qué formularios
 * ve a partir de ahora. No afecta al contenido ya creado (cada ejercicio,
 * clase o sesión guarda su propio deporte).
 */
export async function setActiveSport(userId: string, sport: Sport) {
  if (!isSport(sport)) throw new Error("invalid_sport");
  await db.update(users).set({ activeSport: sport }).where(eq(users.id, userId));
}
