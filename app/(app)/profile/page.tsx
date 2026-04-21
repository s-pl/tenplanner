import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  sessions as sessionsTable,
  exercises as exercisesTable,
  users as usersTable,
} from "@/db/schema";
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
      .where(
        or(
          eq(exercisesTable.isGlobal, true),
          eq(exercisesTable.createdBy, user.id)
        )
      ),
    db
      .select({ image: usersTable.image })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1),
  ]);

  const sessionStats = sessionStatsRows[0];
  const totalSessions = Number(sessionStats?.totalSessions ?? 0);
  const totalMinutes = Number(sessionStats?.totalMinutes ?? 0);
  const upcomingSessions = Number(sessionStats?.upcomingSessions ?? 0);

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-full opacity-[0.035]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px calc(100%/12))",
        }}
      />
      <div className="relative px-4 sm:px-6 md:px-10 py-10 space-y-8">
        <header className="pb-6 border-b border-foreground/15">
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-foreground/50">
              Cuenta · Preferencias
            </p>
            <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-foreground/45">
              № 06
            </p>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl leading-[0.95] tracking-tight text-foreground">
            Tu <em className="italic text-brand">perfil</em>,
            <br />
            tu manera de entrenar.
          </h1>
          <p className="text-[13px] text-foreground/60 mt-4 max-w-2xl">
            Ajusta los datos que te representan, la apariencia de la app y el
            resumen de tu actividad como entrenador.
          </p>
        </header>

        <ProfileClient
          user={{
            id: user.id,
            email: user.email ?? null,
            full_name: user.user_metadata?.full_name ?? null,
            role: user.user_metadata?.role ?? null,
            skill_level: user.user_metadata?.skill_level ?? null,
            bio: user.user_metadata?.bio ?? null,
            avatar_color: user.user_metadata?.avatar_color ?? null,
            avatar_url:
              dbUser[0]?.image ?? user.user_metadata?.avatar_url ?? null,
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
    </div>
  );
}
