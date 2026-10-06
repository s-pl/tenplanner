import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { clubInvites, clubMembers, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import {
  getOwnedClub,
  generateInviteToken,
  inviteExpiryDate,
  listClubRoster,
} from "@/lib/clubs";

const createSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function GET() {
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

  const { members, invites } = await listClubRoster(club.id);

  return NextResponse.json({ data: { club, members, invites } });
}

export async function POST(request: Request) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const email = parsed.data.email;

  // Already an active coach in this club?
  const [existingMember] = await db
    .select({ id: clubMembers.id })
    .from(clubMembers)
    .innerJoin(users, eq(users.id, clubMembers.userId))
    .where(
      and(
        eq(clubMembers.clubId, club.id),
        eq(clubMembers.status, "active"),
        eq(users.email, email)
      )
    )
    .limit(1);
  if (existingMember) {
    return NextResponse.json(
      { error: "Ese monitor ya está vinculado al club." },
      { status: 409 }
    );
  }

  // Refresh an existing pending invite instead of piling up duplicates.
  const [existingInvite] = await db
    .select()
    .from(clubInvites)
    .where(
      and(
        eq(clubInvites.clubId, club.id),
        eq(clubInvites.email, email),
        eq(clubInvites.status, "pending")
      )
    )
    .limit(1);

  const token = generateInviteToken();
  const expiresAt = inviteExpiryDate();

  const [invite] = existingInvite
    ? await db
        .update(clubInvites)
        .set({ token, expiresAt })
        .where(eq(clubInvites.id, existingInvite.id))
        .returning()
    : await db
        .insert(clubInvites)
        .values({
          clubId: club.id,
          email,
          token,
          invitedByUserId: user.id,
          expiresAt,
        })
        .returning();

  return NextResponse.json({ data: invite }, { status: 201 });
}
