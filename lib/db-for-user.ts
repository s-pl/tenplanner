import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Runs `work` in a transaction with Postgres GUC `request.jwt.claim.sub`
 * pinned to `userId`. Needed for Row Level Security policies that read
 * `auth.uid()` via the Supabase helper.
 *
 * Se usa solo en rutas ya autenticadas (user.id viene de supabase.auth.getUser()).
 * Sin esto, la migración 001_enable_rls.sql deja la app en no-op (o la bloquea,
 * dependiendo del rol con el que conectes).
 */
export async function dbForUser<T>(
  userId: string,
  work: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('request.jwt.claim.sub', ${userId}, true)`
    );
    return work(tx);
  });
}
