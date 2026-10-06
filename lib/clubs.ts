import { randomBytes } from "crypto";
import { and, desc, eq, inArray, or, type SQL } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";
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

/**
 * {id, name} of every club a user can tag their own work with: the club
 * they own (if any) plus every club they coach for. Tagging an item with
 * one of these shares it with every other active member of that same
 * club (see getActiveClubIds) — an untagged item stays private to its
 * creator, including from their own club's owner.
 */
export async function getClubOptionsForUser(userId: string) {
  const [owned, coachOf] = await Promise.all([
    getOwnedClub(userId),
    getCoachMemberships(userId),
  ]);
  const options: { id: string; name: string }[] = [];
  if (owned) options.push({ id: owned.id, name: owned.name });
  for (const { club } of coachOf) options.push({ id: club.id, name: club.name });
  return options;
}

/** @deprecated use getClubOptionsForUser — kept as an alias during migration. */
export const getCoachClubOptions = getClubOptionsForUser;

/**
 * Whether `userId` may tag an item with `clubId` — true for any club
 * they're an active member of (owner or coach). Used to validate the
 * club-context selector server-side on create/update, so nobody can tag
 * work with a club they don't belong to.
 */
export async function canTagWithClub(userId: string, clubId: string) {
  const [row] = await db
    .select({ id: clubMembers.id })
    .from(clubMembers)
    .where(
      and(
        eq(clubMembers.userId, userId),
        eq(clubMembers.clubId, clubId),
        eq(clubMembers.status, "active")
      )
    )
    .limit(1);
  return !!row;
}

/**
 * Every club `userId` is an active member of (owner or coach). An item
 * tagged with one of these clubIds is shared among all of that club's
 * active members — this is the list to check against for "can I see
 * this club-tagged item" / "OR clubId IN (...)" visibility queries.
 */
export async function getActiveClubIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ clubId: clubMembers.clubId })
    .from(clubMembers)
    .where(and(eq(clubMembers.userId, userId), eq(clubMembers.status, "active")));
  return rows.map((r) => r.clubId);
}

/**
 * {id, name} of every distinct active member (owner + coaches) across the
 * given clubs. Used to build a "filter by monitor" selector once club-shared
 * content is merged into a list.
 */
export async function getClubMembersDirectory(clubIds: string[]) {
  if (clubIds.length === 0) return [];
  const rows = await db
    .select({ userId: clubMembers.userId, name: users.name })
    .from(clubMembers)
    .innerJoin(users, eq(users.id, clubMembers.userId))
    .where(
      and(inArray(clubMembers.clubId, clubIds), eq(clubMembers.status, "active"))
    );
  const byId = new Map<string, string>();
  for (const row of rows) byId.set(row.userId, row.name);
  return Array.from(byId, ([id, name]) => ({ id, name }));
}

/**
 * Visibility condition for "mine, or shared with a club I'm active in":
 * `ownerColumn = userId OR clubColumn IN (clubIds)`. Use this instead of
 * a bare `eq(table.userId, user.id)` wherever a monitor's club can see
 * another member's club-tagged sessions/events/groups/students/classes.
 * An item left untagged (clubId null) is never matched by the club half,
 * so it stays private to its creator — including from their own club's
 * owner — exactly as getClubOptionsForUser's per-item tagging intends.
 */
export function sharedWithClubCondition(
  ownerColumn: AnyColumn,
  clubColumn: AnyColumn,
  userId: string,
  clubIds: string[]
): SQL {
  if (clubIds.length === 0) return eq(ownerColumn, userId);
  return or(eq(ownerColumn, userId), inArray(clubColumn, clubIds))!;
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
