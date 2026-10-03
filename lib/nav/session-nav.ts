import { db } from "@/db";
import { sessions as sessionsTable } from "@/db/schema";
import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";

type Filter = "upcoming" | "past" | "all" | "drafts";

export type SessionNavParams = { filter?: string; q?: string; sort?: string };

export const SESSION_SORTS = ["alpha", "popular", "recent", "oldest"] as const;
export type SessionSort = (typeof SESSION_SORTS)[number];

/** Default ("oldest") preserves the list's original chronological order (soonest first) when no sort is chosen. */
export function parseSessionSort(params: SessionNavParams): SessionSort {
  const v = params.sort ?? "";
  return (SESSION_SORTS as readonly string[]).includes(v)
    ? (v as SessionSort)
    : "oldest";
}

/** Times the session is saved in one of the coach's favorite lists — used to rank "más populares". */
const SESSION_POPULARITY_SQL = sql`(select count(*)::int from session_list_items sli where sli.session_id = ${sessionsTable.id})`;

/**
 * Returns the ORDER BY clauses for a given sort mode. Shared by the list
 * page's display query and the nav-ids query so pagination and Next/Previous
 * always reflect the same order the coach sees on screen.
 */
export function sessionOrderBy(sort: SessionSort) {
  switch (sort) {
    case "alpha":
      return [asc(sessionsTable.title)];
    case "popular":
      return [
        sql`${SESSION_POPULARITY_SQL} desc`,
        asc(sessionsTable.scheduledAt),
      ];
    case "recent":
      return [desc(sessionsTable.scheduledAt)];
    case "oldest":
    default:
      return [asc(sessionsTable.scheduledAt)];
  }
}

/**
 * Returns the ordered list of session ids matching the same filter/search as
 * the /sessions list page (app/(app)/sessions/page.tsx), used to compute
 * Next/Previous navigation on the session detail page.
 *
 * IMPORTANT: keep this in sync with the filter logic in that page.
 */
export async function getFilteredSessionIds(
  params: SessionNavParams,
  opts: { userId: string }
): Promise<string[]> {
  const { userId } = opts;
  const activeFilter: Filter =
    params.filter === "past" ||
    params.filter === "upcoming" ||
    params.filter === "all" ||
    params.filter === "drafts"
      ? (params.filter as Filter)
      : "all";

  if (activeFilter === "drafts") return [];

  const searchTerm = params.q?.trim() ?? "";

  const whereConditions: SQL[] = [eq(sessionsTable.userId, userId)];
  if (activeFilter === "upcoming")
    whereConditions.push(sql`${sessionsTable.scheduledAt} >= now()`);
  else if (activeFilter === "past")
    whereConditions.push(sql`${sessionsTable.scheduledAt} < now()`);
  if (searchTerm) {
    const searchWhere = or(
      ilike(sessionsTable.title, `%${searchTerm}%`),
      ilike(sessionsTable.description, `%${searchTerm}%`),
      ilike(sessionsTable.objective, `%${searchTerm}%`),
      sql`${sessionsTable.tags}::text ILIKE ${`%${searchTerm}%`}`
    );
    if (searchWhere) whereConditions.push(searchWhere);
  }
  const whereClause =
    and(...whereConditions) ?? eq(sessionsTable.userId, userId);

  const rows = await db
    .select({ id: sessionsTable.id })
    .from(sessionsTable)
    .where(whereClause)
    .orderBy(...sessionOrderBy(parseSessionSort(params)))
    .limit(2000);

  return rows.map((r) => r.id);
}

/** Query-string keys the /sessions list uses for filtering (excludes "page"). */
export function sessionNavQueryString(params: SessionNavParams): string {
  const p = new URLSearchParams();
  if (params.filter && params.filter !== "all") p.set("filter", params.filter);
  if (params.q) p.set("q", params.q);
  const sort = parseSessionSort(params);
  if (sort !== "oldest") p.set("sort", sort);
  return p.toString();
}
