import { lt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  users,
  exerciseDrafts,
  sessionDrafts,
  aiUsageEvents,
  drPlannerChats,
  drPlannerMessages,
} from "@/db/schema";
import { eq, count } from "drizzle-orm";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const [row] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  return row?.isAdmin ? user : null;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as { action: string; days?: number };
  const { action, days } = body;

  try {
    if (action === "purge_old_ai_events") {
      const cutoffDays = Math.max(Number(days ?? 90), 7);
      const cutoff = new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000);
      const result = await db
        .delete(aiUsageEvents)
        .where(lt(aiUsageEvents.createdAt, cutoff))
        .returning({ id: aiUsageEvents.id });
      return NextResponse.json({ deleted: result.length });
    }

    if (action === "purge_old_drafts") {
      const cutoffDays = Math.max(Number(days ?? 30), 1);
      const cutoff = new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000);
      const [ex, se] = await Promise.all([
        db
          .delete(exerciseDrafts)
          .where(lt(exerciseDrafts.updatedAt, cutoff))
          .returning({ id: exerciseDrafts.id }),
        db
          .delete(sessionDrafts)
          .where(lt(sessionDrafts.updatedAt, cutoff))
          .returning({ id: sessionDrafts.id }),
      ]);
      return NextResponse.json({ deleted: ex.length + se.length });
    }

    if (action === "purge_empty_chats") {
      // Delete chats with 0 user messages (only system/tool messages or nothing)
      const emptyChats = await db
        .select({ id: drPlannerChats.id })
        .from(drPlannerChats)
        .leftJoin(
          drPlannerMessages,
          eq(drPlannerMessages.chatId, drPlannerChats.id)
        )
        .groupBy(drPlannerChats.id)
        .having(sql`count(${drPlannerMessages.id}) = 0`);

      if (emptyChats.length === 0) {
        return NextResponse.json({ deleted: 0 });
      }

      const ids = emptyChats.map((c) => c.id);
      let deleted = 0;
      for (const id of ids) {
        await db.delete(drPlannerChats).where(eq(drPlannerChats.id, id));
        deleted++;
      }
      return NextResponse.json({ deleted });
    }

    if (action === "db_stats") {
      const [
        [usersCount],
        [exerciseDraftsCount],
        [sessionDraftsCount],
        [aiEventsCount],
        [chatsCount],
        [messagesCount],
      ] = await Promise.all([
        db.select({ total: count() }).from(users),
        db.select({ total: count() }).from(exerciseDrafts),
        db.select({ total: count() }).from(sessionDrafts),
        db.select({ total: count() }).from(aiUsageEvents),
        db.select({ total: count() }).from(drPlannerChats),
        db.select({ total: count() }).from(drPlannerMessages),
      ]);
      return NextResponse.json({
        users: Number(usersCount?.total ?? 0),
        exerciseDrafts: Number(exerciseDraftsCount?.total ?? 0),
        sessionDrafts: Number(sessionDraftsCount?.total ?? 0),
        aiEvents: Number(aiEventsCount?.total ?? 0),
        chats: Number(chatsCount?.total ?? 0),
        messages: Number(messagesCount?.total ?? 0),
      });
    }

    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  } catch (error) {
    console.error("[admin/tools]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
