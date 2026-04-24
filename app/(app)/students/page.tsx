import Link from "next/link";
import { redirect } from "next/navigation";
import { and, asc, count, eq, ilike, type SQL } from "drizzle-orm";
import { Plus, Search, ArrowLeft, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { students as studentsTable } from "@/db/schema";
import { MobileFab } from "@/components/app/mobile-fab";

const PAGE_SIZE = 30;

type PlayerLevel =
  | "beginner"
  | "amateur"
  | "intermediate"
  | "advanced"
  | "competitive";

const LEVEL_LABEL: Record<PlayerLevel, string> = {
  beginner: "Principiante",
  amateur: "Amateur",
  intermediate: "Intermedio",
  advanced: "Avanzado",
  competitive: "Competitivo",
};

const LEVEL_CODE: Record<PlayerLevel, string> = {
  beginner: "L1",
  amateur: "L2",
  intermediate: "L3",
  advanced: "L4",
  competitive: "L5",
};

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

function initialsFromName(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function StudentsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/login");

  const { q, page } = await searchParams;
  const searchTerm = q?.trim() ?? "";
  const parsedPage = Number(page ?? "1");
  const currentPage =
    Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const offset = (currentPage - 1) * PAGE_SIZE;

  const conditions: SQL[] = [eq(studentsTable.coachId, user.id)];
  if (searchTerm) conditions.push(ilike(studentsTable.name, `%${searchTerm}%`));
  const listWhere = and(...conditions);

  const [rowPage, totalRows, levelRows] = await Promise.all([
    db
      .select()
      .from(studentsTable)
      .where(listWhere)
      .orderBy(asc(studentsTable.name))
      .limit(PAGE_SIZE + 1)
      .offset(offset),
    db
      .select({ total: count() })
      .from(studentsTable)
      .where(eq(studentsTable.coachId, user.id)),
    db
      .select({ level: studentsTable.playerLevel, total: count() })
      .from(studentsTable)
      .where(eq(studentsTable.coachId, user.id))
      .groupBy(studentsTable.playerLevel),
  ]);

  const hasNextPage = rowPage.length > PAGE_SIZE;
  const filtered = hasNextPage ? rowPage.slice(0, PAGE_SIZE) : rowPage;
  const totalStudents = Number(totalRows[0]?.total ?? 0);

  const levelCounts = levelRows.reduce<Record<PlayerLevel, number>>(
    (acc, r) => {
      const lvl = r.level as PlayerLevel | null;
      if (lvl) acc[lvl] = Number(r.total);
      return acc;
    },
    { beginner: 0, amateur: 0, intermediate: 0, advanced: 0, competitive: 0 }
  );

  function buildHref(params: { q?: string; page?: string }) {
    const p = new URLSearchParams();
    if (params.q) p.set("q", params.q);
    if (params.page && params.page !== "1") p.set("page", params.page);
    const s = p.toString();
    return `/students${s ? `?${s}` : ""}`;
  }

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-full opacity-[0.035]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px calc(100%/12))",
        }}
      />
      <div className="relative px-4 sm:px-6 md:px-10 py-10">
        {/* Masthead */}
        <header className="pb-6 border-b border-foreground/15">
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-foreground/50">
              Roster · Alumnos
            </p>
            <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-foreground/45">
              № {String(totalStudents).padStart(3, "0")}
            </p>
          </div>
          <div className="grid grid-cols-[1fr_auto] items-end gap-6">
            <h1 className="font-heading text-4xl md:text-5xl leading-[0.95] tracking-tight text-foreground">
              Tus <em className="italic text-brand">alumnos</em>,
              <br />
              uno a uno.
            </h1>
            {totalStudents > 0 && (
              <Link
                href="/students/new"
                className="hidden md:inline-flex items-center gap-2 border border-brand bg-brand text-brand-foreground text-[12px] font-semibold tracking-wide px-4 py-2.5 hover:bg-brand/90 transition-colors shrink-0 uppercase"
              >
                <Plus className="size-3.5" strokeWidth={2} />
                Nuevo alumno
              </Link>
            )}
          </div>
          <p className="text-[13px] text-foreground/60 mt-4 max-w-2xl">
              {totalStudents} alumno{totalStudents !== 1 ? "s" : ""} registrado
            {totalStudents !== 1 ? "s" : ""} · fichas individuales con histórico y
            nivel.
          </p>
        </header>

        {/* Level strip */}
        {totalStudents > 0 && (
          <section className="grid grid-cols-5 border-b border-foreground/15">
            {(Object.keys(LEVEL_LABEL) as PlayerLevel[]).map((lvl, i) => (
              <div
                key={lvl}
                className={`px-4 py-5 ${i > 0 ? "border-l border-foreground/10" : ""}`}
              >
                <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/45 mb-1.5">
                  {LEVEL_CODE[lvl]} · {LEVEL_LABEL[lvl]}
                </p>
                <p className="font-heading text-3xl tabular-nums text-foreground leading-none">
                  {levelCounts[lvl]}
                </p>
              </div>
            ))}
          </section>
        )}

        {/* Search rail */}
        {totalStudents > 0 && (
          <section className="py-5 border-b border-foreground/15 grid grid-cols-[auto_1fr_auto] items-center gap-4">
            <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">
              01
            </p>
            <form className="relative" action="/students" method="get">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 size-3.5 text-foreground/40 pointer-events-none" />
              <input
                type="search"
                name="q"
                placeholder="Buscar por nombre…"
                defaultValue={searchTerm}
                className="w-full sm:max-w-md h-9 pl-6 pr-4 text-[13px] bg-transparent border-0 border-b border-foreground/20 focus:outline-none focus:border-brand text-foreground placeholder:text-foreground/40 transition-colors"
              />
            </form>
            <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-foreground/50">
              {filtered.length}/{totalStudents}
            </p>
          </section>
        )}

        {/* Empty */}
        {totalStudents === 0 ? (
          <div className="py-20 text-center border-b border-foreground/15">
            <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-foreground/50 mb-4">
              Estantería vacía
            </p>
            <h2 className="font-heading text-3xl text-foreground mb-3">
              Todavía no tienes <em className="italic text-brand">alumnos</em>.
            </h2>
            <p className="text-[13px] text-foreground/55 max-w-md mx-auto mb-6">
              Crea tu primera ficha para empezar a planificar sesiones
              personalizadas.
            </p>
            <Link
              href="/students/new"
              className="inline-flex items-center gap-2 border border-brand bg-brand text-brand-foreground text-[12px] font-semibold tracking-wide px-5 py-2.5 hover:bg-brand/90 transition-colors uppercase"
            >
              <Plus className="size-3.5" strokeWidth={2} />
              Crear alumno
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center border-b border-foreground/15">
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50 mb-2">
              Sin resultados
            </p>
            <p className="font-heading text-2xl text-foreground mb-3">
              Ningún alumno coincide con &ldquo;
              <em className="italic text-brand">{searchTerm}</em>&rdquo;.
            </p>
            <Link
              href="/students"
              className="inline-flex items-center gap-1.5 text-[12px] tracking-wide text-foreground/60 hover:text-brand transition-colors uppercase border-b border-foreground/30 hover:border-brand"
            >
              Limpiar búsqueda
            </Link>
          </div>
        ) : (
          <section>
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-3 py-4 border-b border-foreground/15">
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">
                02
              </p>
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                Fichas · ordenadas alfabéticamente
              </p>
            </div>
            <ul>
              {filtered.map((student, idx) => {
                const level = student.playerLevel as PlayerLevel | null;
                const n = String(idx + 1).padStart(3, "0");
                return (
                  <li
                    key={student.id}
                    className="border-b border-foreground/10"
                  >
                    <Link
                      href={`/students/${student.id}`}
                      className="group grid grid-cols-[auto_auto_1fr_auto_auto] items-center gap-5 py-5 hover:bg-foreground/[0.02] transition-colors px-1"
                    >
                      <span className="font-sans text-[10px] tabular-nums tracking-[0.18em] text-foreground/35 w-8">
                        {n}
                      </span>
                      <div className="size-10 rounded-full border border-foreground/20 bg-foreground/[0.02] flex items-center justify-center shrink-0 overflow-hidden">
                        {student.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={student.imageUrl}
                            alt={student.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <span className="font-heading text-[12px] text-foreground/75">
                            {initialsFromName(student.name)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-heading text-[17px] italic text-foreground truncate group-hover:text-brand transition-colors">
                          {student.name}
                        </p>
                        {student.email && (
                          <p className="text-[11px] text-foreground/45 truncate mt-0.5 tabular-nums">
                            {student.email}
                          </p>
                        )}
                      </div>
                      {level ? (
                        <div className="hidden sm:flex flex-col items-end">
                          <span className="font-sans text-[9px] tracking-[0.22em] text-foreground/45 uppercase">
                            {LEVEL_CODE[level]}
                          </span>
                          <span className="text-[12px] text-foreground/70">
                            {LEVEL_LABEL[level]}
                          </span>
                        </div>
                      ) : (
                        <span className="hidden sm:inline font-sans text-[9px] tracking-[0.22em] text-foreground/30 uppercase">
                          — · sin nivel
                        </span>
                      )}
                      <span className="font-sans text-[11px] tracking-[0.22em] text-foreground/40 group-hover:text-brand transition-colors">
                        →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Pagination */}
        {(currentPage > 1 || hasNextPage) && (
          <nav className="flex items-center justify-between pt-4 border-t border-foreground/15">
            <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-foreground/45 tabular-nums">
              {filtered.length > 0
                ? `${offset + 1}–${offset + filtered.length}`
                : "0"}{" "}
              · Página {currentPage.toString().padStart(2, "0")}
            </p>
            <div className="flex items-center gap-5">
              {currentPage > 1 ? (
                <Link
                  href={buildHref({
                    q: searchTerm || undefined,
                    page: String(currentPage - 1),
                  })}
                  className="inline-flex items-center gap-1.5 text-[12px] text-foreground/70 hover:text-brand transition-colors"
                >
                  <ArrowLeft className="size-3" /> Anterior
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground/25">
                  <ArrowLeft className="size-3" /> Anterior
                </span>
              )}
              {hasNextPage ? (
                <Link
                  href={buildHref({
                    q: searchTerm || undefined,
                    page: String(currentPage + 1),
                  })}
                  className="inline-flex items-center gap-1.5 text-[12px] text-foreground/70 hover:text-brand transition-colors"
                >
                  Siguiente <ArrowUpRight className="size-3" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground/25">
                  Siguiente <ArrowUpRight className="size-3" />
                </span>
              )}
            </div>
          </nav>
        )}

        {/* Footnote */}
        <footer className="pt-8 grid grid-cols-[1fr_auto] items-end gap-4 text-[11px] text-foreground/45">
          <p className="font-heading italic text-[13px] text-foreground/55 max-w-md">
            &ldquo;Un buen entrenador conoce a sus alumnos antes de diseñar su
            primera sesión.&rdquo;
          </p>
          <p className="font-sans tracking-[0.22em] tabular-nums uppercase">
            /tenplanner · 04
          </p>
        </footer>
      </div>
      <MobileFab href="/students/new" icon="user-plus" label="Nuevo alumno" />
    </div>
  );
}
