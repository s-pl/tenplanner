import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { sessionListItems, sessionLists, sessions } from "@/db/schema";

/**
 * Ids de sesiones que están en alguna lista de favoritas del usuario.
 * Si las tablas aún no existen (la base de datos no se ha actualizado),
 * devuelve un conjunto vacío en lugar de romper la página.
 */
export async function getFavoritedSessionIds(
  userId: string,
  sessionIds: string[]
): Promise<Set<string>> {
  if (sessionIds.length === 0) return new Set();
  try {
    const rows = await db
      .selectDistinct({ sessionId: sessionListItems.sessionId })
      .from(sessionListItems)
      .innerJoin(sessionLists, eq(sessionLists.id, sessionListItems.listId))
      .where(
        and(
          eq(sessionLists.userId, userId),
          inArray(sessionListItems.sessionId, sessionIds)
        )
      );
    return new Set(rows.map((r) => r.sessionId));
  } catch {
    return new Set();
  }
}

export type FavoriteSessionList = {
  id: string;
  name: string;
  emoji: string | null;
  isDefault: boolean;
  sessions: Array<{
    id: string;
    title: string;
    scheduledAt: string;
    durationMinutes: number;
    status: "scheduled" | "completed" | "cancelled";
  }>;
};

/** Listas de favoritas del usuario con sus sesiones. `null` si falta activar las tablas. */
export async function loadFavoriteSessionLists(
  userId: string
): Promise<FavoriteSessionList[] | null> {
  try {
    const lists = await db
      .select({
        id: sessionLists.id,
        name: sessionLists.name,
        emoji: sessionLists.emoji,
        isDefault: sessionLists.isDefault,
      })
      .from(sessionLists)
      .where(eq(sessionLists.userId, userId))
      .orderBy(desc(sessionLists.isDefault), sessionLists.createdAt);

    const rows = await db
      .select({
        listId: sessionListItems.listId,
        id: sessions.id,
        title: sessions.title,
        scheduledAt: sessions.scheduledAt,
        durationMinutes: sessions.durationMinutes,
        status: sessions.status,
      })
      .from(sessionListItems)
      .innerJoin(sessionLists, eq(sessionLists.id, sessionListItems.listId))
      .innerJoin(sessions, eq(sessions.id, sessionListItems.sessionId))
      .where(eq(sessionLists.userId, userId))
      .orderBy(desc(sessions.scheduledAt));

    return lists.map((list) => ({
      ...list,
      sessions: rows
        .filter((row) => row.listId === list.id)
        .map((row) => ({
          id: row.id,
          title: row.title,
          scheduledAt: row.scheduledAt.toISOString(),
          durationMinutes: row.durationMinutes,
          status: row.status,
        })),
    }));
  } catch {
    return null;
  }
}
