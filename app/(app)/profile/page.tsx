import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { sessions as sessionsTable, exercises as exercisesTable } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [allSessions, exerciseCount] = await Promise.all([
    db.select({ durationMinutes: sessionsTable.durationMinutes, scheduledAt: sessionsTable.scheduledAt })
      .from(sessionsTable)
      .where(eq(sessionsTable.userId, user.id)),
    db.select({ count: count() }).from(exercisesTable),
  ]);

  const now = new Date();
  const totalMinutes = allSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const upcomingSessions = allSessions.filter((s) => new Date(s.scheduledAt) >= now).length;

  return (
    <div className="px-6 md:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Profile
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account, appearance, and training data
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
          provider: user.app_metadata?.provider ?? "email",
          created_at: user.created_at ?? "",
        }}
        stats={{
          totalSessions: allSessions.length,
          totalMinutes,
          totalExercises: exerciseCount[0]?.count ?? 0,
          upcomingSessions,
        }}
      />
    </div>
  );
}
