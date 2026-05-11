import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { places, sessions } from "@/db/schema";
import { PlacesClient } from "./places-client";

export default async function PlacesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rows = await db
    .select({
      id: places.id,
      name: places.name,
      description: places.description,
      createdAt: sql<string>`${places.createdAt}::text`,
      updatedAt: sql<string>`${places.updatedAt}::text`,
      totalSessions: sql<number>`COUNT(${sessions.id})::int`,
      upcomingSessions: sql<number>`COUNT(${sessions.id}) FILTER (WHERE ${sessions.scheduledAt} >= now())::int`,
      totalMinutes: sql<number>`COALESCE(SUM(${sessions.durationMinutes}), 0)::int`,
      lastScheduledAt: sql<string | null>`MAX(${sessions.scheduledAt})::text`,
    })
    .from(places)
    .leftJoin(
      sessions,
      and(eq(sessions.placeId, places.id), eq(sessions.userId, user.id))
    )
    .where(eq(places.coachId, user.id))
    .groupBy(places.id)
    .orderBy(places.name);

  return (
    <div className="tp-page">
      <div className="tp-page-pad">
        <PlacesClient initialPlaces={rows} />
      </div>
    </div>
  );
}
