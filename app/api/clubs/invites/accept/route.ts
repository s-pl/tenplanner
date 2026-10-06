import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clubInvites, clubMembers, clubs, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({ token: z.string().min(10) });

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Token inválido." }, { status: 422 });
  }

  const [invite] = await db
    .select({ invite: clubInvites, club: clubs })
    .from(clubInvites)
    .innerJoin(clubs, eq(clubs.id, clubInvites.clubId))
    .where(eq(clubInvites.token, parsed.data.token))
    .limit(1)
    .then((rows) => rows.map((r) => ({ invite: r.invite, club: r.club })));

  if (!invite) {
    return NextResponse.json(
      { error: "Invitación no encontrada." },
      { status: 404 }
    );
  }

  if (invite.invite.status !== "pending") {
    return NextResponse.json(
      { error: "Esta invitación ya no está disponible." },
      { status: 410 }
    );
  }

  if (invite.invite.expiresAt.getTime() < Date.now()) {
    await db
      .update(clubInvites)
      .set({ status: "expired" })
      .where(eq(clubInvites.id, invite.invite.id));
    return NextResponse.json(
      { error: "Esta invitación ha caducado." },
      { status: 410 }
    );
  }

  const [account] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (
    !account ||
    account.email.toLowerCase() !== invite.invite.email.toLowerCase()
  ) {
    return NextResponse.json(
      {
        error: `Esta invitación es para ${invite.invite.email}. Entra con esa cuenta para aceptarla.`,
      },
      { status: 403 }
    );
  }

  await db.transaction(async (tx) => {
    await tx
      .insert(clubMembers)
      .values({
        clubId: invite.invite.clubId,
        userId: user.id,
        role: "coach",
        status: "active",
      })
      .onConflictDoUpdate({
        target: [clubMembers.clubId, clubMembers.userId],
        set: { role: "coach", status: "active" },
      });

    await tx
      .update(clubInvites)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(eq(clubInvites.id, invite.invite.id));
  });

  return NextResponse.json({ data: { club: invite.club } });
}
