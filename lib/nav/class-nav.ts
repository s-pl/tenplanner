import { db } from "@/db";
import { classes } from "@/db/schema";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";

export type ClassNavParams = Record<string, string | string[] | undefined>;

const TABS = ["all", "library", "mine", "favorites", "drafts"] as const;

function paramList(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.map((v) => v.trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

/**
 * Returns the ordered list of class ids matching the same filters as the
 * /classes list page (app/(public)/classes/page.tsx), used to compute
 * Next/Previous navigation on the class detail page.
 *
 * IMPORTANT: keep this in sync with the filter logic in that page.
 */
export async function getFilteredClassIds(
  params: ClassNavParams,
  opts: { userId: string | null }
): Promise<string[]> {
  const { userId } = opts;

  const requestedTab = (params.tab as string) ?? "all";
  const tab = TABS.includes(requestedTab as (typeof TABS)[number])
    ? (requestedTab as (typeof TABS)[number])
    : "all";
  const activeTab =
    !userId && (tab === "mine" || tab === "favorites") ? "all" : tab;

  if (activeTab === "drafts") return [];

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const nivel = typeof params.nivel === "string" ? params.nivel : "";
  const duracion = typeof params.duracion === "string" ? params.duracion : "";
  const aspectoList = paramList(params.aspecto);
  const golpeList = paramList(params.golpe);

  const conds: SQL[] = [];
  if (activeTab === "mine" && userId) {
    conds.push(eq(classes.createdBy, userId));
  } else if (activeTab === "library") {
    conds.push(eq(classes.isLibrary, true));
  } else if (activeTab === "favorites" && userId) {
    conds.push(
      sql`${classes.id} IN (SELECT class_id FROM class_favorites WHERE user_id = ${userId})`
    );
  } else {
    conds.push(
      userId
        ? or(eq(classes.isLibrary, true), eq(classes.createdBy, userId))!
        : eq(classes.isLibrary, true)
    );
  }
  if (q) conds.push(ilike(classes.name, `%${q}%`));
  if (nivel) {
    conds.push(
      or(
        sql`${classes.niveles} @> ${JSON.stringify([nivel])}::jsonb`,
        eq(classes.nivel, nivel)
      )!
    );
  }
  if (aspectoList.length > 0) {
    conds.push(
      or(
        ...aspectoList.map(
          (a) =>
            or(
              sql`${classes.aspectosJuego} @> ${JSON.stringify([a])}::jsonb`,
              eq(classes.aspectoJuego, a)
            )!
        )
      )!
    );
  }
  if (duracion === "120") {
    conds.push(sql`${classes.duracionMinutes} > 90`);
  } else if (duracion) {
    const d = Number(duracion);
    if (Number.isFinite(d)) conds.push(eq(classes.duracionMinutes, d));
  }
  if (golpeList.length > 0) {
    conds.push(
      or(
        ...golpeList.map(
          (g) => sql`${classes.golpes}::jsonb @> ${`["${g}"]`}::jsonb`
        )
      )!
    );
  }

  const rows = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(...conds))
    .orderBy(desc(classes.createdAt))
    .limit(2000);

  return rows.map((r) => r.id);
}

/** Query-string keys the /classes list uses for filtering. */
export function classNavQueryString(params: ClassNavParams): string {
  const p = new URLSearchParams();
  if (params.tab && params.tab !== "all") p.set("tab", params.tab as string);
  if (params.q) p.set("q", params.q as string);
  if (params.nivel) p.set("nivel", params.nivel as string);
  if (params.duracion) p.set("duracion", params.duracion as string);
  for (const v of paramList(params.aspecto)) p.append("aspecto", v);
  for (const v of paramList(params.golpe)) p.append("golpe", v);
  return p.toString();
}
