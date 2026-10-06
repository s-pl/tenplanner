import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { clubInvites } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { getOwnedClub } from "@/lib/clubs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const club = await getOwnedClub(user.id);
  if (!club) {
    return NextResponse.json({ error: "No tienes un club." }, { status: 403 });
  }

  const [updated] = await db
    .update(clubInvites)
    .set({ status: "revoked" })
    .where(and(eq(clubInvites.id, id), eq(clubInvites.clubId, club.id)))
    .returning();

  if (!updated) {
    return NextResponse.json(
      { error: "Invitación no encontrada." },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: updated });
}
