import { randomBytes } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clubInvites, clubMembers, clubs, users } from "@/db/schema";

export const CLUB_INVITE_EXPIRY_DAYS = 14;

export function generateInviteToken() {
  return randomBytes(24).toString("base64url");
}

export function inviteExpiryDate() {
  return new Date(Date.now() + CLUB_INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

/** The club a user owns (role "owner", still active), or null. */
export async function getOwnedClub(userId: string) {
  const [row] = await db
    .select({ club: clubs })
    .from(clubMembers)
    .innerJoin(clubs, eq(clubs.id, clubMembers.clubId))
    .where(
      and(
        eq(clubMembers.userId, userId),
        eq(clubMembers.role, "owner"),
        eq(clubMembers.status, "active")
      )
    )
    .limit(1);
  return row?.club ?? null;
}

/** Every club a user is linked to as an active coach (not counting one they own). */
export async function getCoachMemberships(userId: string) {
  return db
    .select({ club: clubs, membership: clubMembers })
    .from(clubMembers)
    .innerJoin(clubs, eq(clubs.id, clubMembers.clubId))
    .where(
      and(
        eq(clubMembers.userId, userId),
        eq(clubMembers.role, "coach"),
        eq(clubMembers.status, "active")
      )
    );
}

/** Active coaches and pending invites for a club the caller owns. */
export async function listClubRoster(clubId: string) {
  const [members, invites] = await Promise.all([
    db
      .select({
        id: clubMembers.id,
        role: clubMembers.role,
        status: clubMembers.status,
        createdAt: clubMembers.createdAt,
        name: users.name,
        email: users.email,
        image: users.image,
      })
      .from(clubMembers)
      .innerJoin(users, eq(users.id, clubMembers.userId))
      .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.role, "coach")))
      .orderBy(desc(clubMembers.createdAt)),
    db
      .select()
      .from(clubInvites)
      .where(
        and(eq(clubInvites.clubId, clubId), eq(clubInvites.status, "pending"))
      )
      .orderBy(desc(clubInvites.createdAt)),
  ]);
  return { members, invites };
}
