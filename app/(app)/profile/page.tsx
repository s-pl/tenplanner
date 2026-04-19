import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { sessions as sessionsTable, exercises as exercisesTable, users as usersTable } from "@/db/schema";
import { eq, count, or, sql } from "drizzle-orm";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [sessionStatsRows, exerciseCountRows, dbUser] = await Promise.all([
    db
      .select({
        totalSessions: count(sessionsTable.id),
        totalMinutes: sql<number>`COALESCE(SUM(${sessionsTable.durationMinutes}), 0)`,
        upcomingSessions: sql<number>`COUNT(*) FILTER (WHERE ${sessionsTable.scheduledAt} >= now())`,
      })
      .from(sessionsTable)
      .where(eq(sessionsTable.userId, user.id)),
    db
      .select({ count: count() })
      .from(exercisesTable)
      .where(or(eq(exercisesTable.isGlobal, true), eq(exercisesTable.createdBy, user.id))),
    db.select({ image: usersTable.image }).from(usersTable).where(eq(usersTable.id, user.id)).limit(1),
  ]);

  const sessionStats = sessionStatsRows[0];
  const totalSessions = Number(sessionStats?.totalSessions ?? 0);
  const totalMinutes = Number(sessionStats?.totalMinutes ?? 0);
  const upcomingSessions = Number(sessionStats?.upcomingSessions ?? 0);

  return (
    <div className="px-6 md:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Perfil
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona tu cuenta, apariencia y datos de entrenamiento
        </p>
      </div>

      <ProfileClient
        user={{
          id: user.id,
          email: user.email ?? null,
          full_name: user.user_metadata?.full_name ?? null,
          role: user.user_metadata?.role ?? null,
          skill_level: user.user_metadata?.skill_level ?? null,
          bio: user.user_metadata?.bio ?? null,
          avatar_color: user.user_metadata?.avatar_color ?? null,
          avatar_url: dbUser[0]?.image ?? user.user_metadata?.avatar_url ?? null,
          provider: user.app_metadata?.provider ?? "email",
          created_at: user.created_at ?? "",
        }}
        stats={{
          totalSessions,
          totalMinutes,
          totalExercises: Number(exerciseCountRows[0]?.count ?? 0),
          upcomingSessions,
        }}
      />
    </div>
  );
}
