import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { places } from "@/db/schema";
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
    })
    .from(places)
    .where(eq(places.coachId, user.id))
    .orderBy(places.name);

  return (
    <div className="max-w-5xl space-y-6 px-4 py-8 sm:px-6 md:px-8">
      <PlacesClient initialPlaces={rows} />
    </div>
  );
}
