import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { Pencil, ClipboardList, Clock, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { students, sessionStudents, sessions } from "@/db/schema";
import { cn } from "@/lib/utils";
import { DeleteStudentButton } from "./delete-student-button";
import { SessionFeedback } from "./session-feedback";
import { UpcomingList } from "./upcoming-list";
import { GenerateProfileLinkButton } from "./generate-profile-link";

type Gender = "male" | "female" | "other";
type DominantHand = "left" | "right";
type PlayerLevel =
  | "beginner"
  | "amateur"
  | "intermediate"
  | "advanced"
  | "competitive";

const GENDER_LABEL: Record<Gender, string> = {
  male: "Masculino",
  female: "Femenino",
  other: "Otro",
};
const HAND_LABEL: Record<DominantHand, string> = {
  left: "Zurdo",
  right: "Diestro",
};
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

function initialsFromName(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
function ageFromBirthDate(birthDate: string) {
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}
function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const PAST_RENDER_LIMIT = 120;
const UPCOMING_RENDER_LIMIT = 120;

export default async function StudentDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/login");

  const [student] = await db
    .select()
    .from(students)
    .where(and(eq(students.id, id), eq(students.coachId, user.id)))
    .limit(1);
  if (!student) notFound();

  const [statsRows, past, upcoming] = await Promise.all([
    db
      .select({
        totalSessions: sql<number>`COUNT(*)`,
        totalMinutes: sql<number>`COALESCE(SUM(${sessions.durationMinutes}), 0)`,
        pastCount: sql<number>`COUNT(*) FILTER (WHERE ${sessions.scheduledAt} < now())`,
        upcomingCount: sql<number>`COUNT(*) FILTER (WHERE ${sessions.scheduledAt} >= now())`,
        pastMinutes: sql<number>`COALESCE(SUM(${sessions.durationMinutes}) FILTER (WHERE ${sessions.scheduledAt} < now()), 0)`,
        avgRating: sql<
          number | null
        >`AVG(${sessionStudents.rating}) FILTER (WHERE ${sessions.scheduledAt} < now() AND ${sessionStudents.rating} IS NOT NULL)`,
        avgIntensity: sql<
          number | null
        >`AVG(${sessions.intensity}) FILTER (WHERE ${sessions.scheduledAt} < now() AND ${sessions.intensity} IS NOT NULL)`,
        pastWithAttendanceCount: sql<number>`COUNT(*) FILTER (WHERE ${sessions.scheduledAt} < now() AND ${sessionStudents.attended} IS NOT NULL)`,
        attendedCount: sql<number>`COUNT(*) FILTER (WHERE ${sessions.scheduledAt} < now() AND ${sessionStudents.attended} = true)`,
        last30PastCount: sql<number>`COUNT(*) FILTER (WHERE ${sessions.scheduledAt} >= (now() - INTERVAL '30 days') AND ${sessions.scheduledAt} < now())`,
      })
      .from(sessionStudents)
      .innerJoin(sessions, eq(sessionStudents.sessionId, sessions.id))
      .where(eq(sessionStudents.studentId, student.id)),
    db
      .select({
        ssId: sessionStudents.id,
        attended: sessionStudents.attended,
        rating: sessionStudents.rating,
        feedback: sessionStudents.feedback,
        sessionId: sessions.id,
        title: sessions.title,
        scheduledAt: sessions.scheduledAt,
        durationMinutes: sessions.durationMinutes,
        intensity: sessions.intensity,
        objective: sessions.objective,
      })
      .from(sessionStudents)
      .innerJoin(sessions, eq(sessionStudents.sessionId, sessions.id))
      .where(
        and(
          eq(sessionStudents.studentId, student.id),
          sql`${sessions.scheduledAt} < now()`
        )
      )
      .orderBy(desc(sessions.scheduledAt))
      .limit(PAST_RENDER_LIMIT),
    db
      .select({
        ssId: sessionStudents.id,
        sessionId: sessions.id,
        title: sessions.title,
        scheduledAt: sessions.scheduledAt,
        durationMinutes: sessions.durationMinutes,
      })
      .from(sessionStudents)
      .innerJoin(sessions, eq(sessionStudents.sessionId, sessions.id))
      .where(
        and(
          eq(sessionStudents.studentId, student.id),
          sql`${sessions.scheduledAt} >= now()`
        )
      )
      .orderBy(asc(sessions.scheduledAt))
      .limit(UPCOMING_RENDER_LIMIT),
  ]);

  const stats = statsRows[0];
  const totalSessions = Number(stats?.totalSessions ?? 0);
  const totalMinutes = Number(stats?.totalMinutes ?? 0);
  const pastCount = Number(stats?.pastCount ?? 0);
  const upcomingCount = Number(stats?.upcomingCount ?? 0);
  const pastMinutes = Number(stats?.pastMinutes ?? 0);
  const avgRating = stats?.avgRating == null ? null : Number(stats.avgRating);
  const avgIntensity =
    stats?.avgIntensity == null ? null : Number(stats.avgIntensity);
  const pastWithAttendanceCount = Number(stats?.pastWithAttendanceCount ?? 0);
  const attendedCount = Number(stats?.attendedCount ?? 0);
  const attendanceRate =
    pastWithAttendanceCount > 0
      ? attendedCount / pastWithAttendanceCount
      : null;
  const isReliable =
    attendanceRate != null &&
    attendanceRate >= 0.8 &&
    pastWithAttendanceCount >= 3;

  const recentEvolution = past.slice(0, 8).reverse();

  const sessionsPerWeek =
    Number(stats?.last30PastCount ?? 0) > 0
      ? (Number(stats?.last30PastCount ?? 0) / 4.3).toFixed(1)
      : "0";

  const nextSession = upcoming[0];
  const age = student.birthDate ? ageFromBirthDate(student.birthDate) : null;
  const level = student.playerLevel as PlayerLevel | null;

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
      <div className="relative px-4 sm:px-6 md:px-10 py-10 space-y-10">
        {/* Masthead */}
        <header className="pb-6 border-b border-foreground/15">
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <div className="flex items-baseline gap-3">
              <Link
                href="/students"
                className="font-sans text-[10px] uppercase tracking-[0.28em] text-foreground/45 hover:text-brand transition-colors"
              >
                ← Alumnos
              </Link>
              <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-foreground/30">
                /
              </span>
              <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-foreground/50">
                Ficha individual
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/students/${student.id}/edit`}
                className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-foreground/60 border-b border-foreground/20 hover:border-brand hover:text-brand transition-colors pb-0.5"
              >
                <Pencil className="size-3" strokeWidth={1.6} />
                Editar
              </Link>
              <DeleteStudentButton
                studentId={student.id}
                studentName={student.name}
              />
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-6 items-end">
            <div className="size-20 rounded-full border border-foreground/25 bg-foreground/[0.02] flex items-center justify-center shrink-0 overflow-hidden">
              {student.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={student.imageUrl}
                  alt={student.name}
                  className="size-full object-cover"
                />
              ) : (
                <span className="font-heading text-2xl text-foreground/80">
                  {initialsFromName(student.name)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-4xl md:text-5xl leading-[0.95] tracking-tight text-foreground">
                <em className="italic text-brand">{student.name}</em>
              </h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-[12px] tabular-nums">
                {level && (
                  <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/60">
                    {LEVEL_CODE[level]} · {LEVEL_LABEL[level]}
                  </span>
                )}
                {age != null && (
                  <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/55">
                    {age} años
                  </span>
                )}
                {isReliable && (
                  <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-brand">
                    ◆ Fiable
                  </span>
                )}
                {student.email && (
                  <span className="text-foreground/50 truncate">
                    {student.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Stats strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 border-y border-foreground/15">
          <StatCell label="Sesiones totales" value={totalSessions.toString()} />
          <StatCell label="Completadas" value={pastCount.toString()} />
          <StatCell label="Próximas" value={upcomingCount.toString()} accent />
          <StatCell
            label="Horas totales"
            value={`${Math.round(totalMinutes / 60)}h`}
          />
          <StatCell
            label="Intensidad media"
            value={avgIntensity != null ? `${avgIntensity.toFixed(1)}/5` : "—"}
          />
          <StatCell
            label="Valoración media"
            value={avgRating != null ? `${avgRating.toFixed(1)}/5` : "—"}
          />
        </section>

        {/* Perfil + enlace */}
        <section className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-10">
          <div>
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-3 pb-3 border-b border-foreground/15">
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">
                01
              </p>
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                Ficha física
              </p>
            </div>
            <dl className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-foreground/10 border-b border-foreground/10">
              <InfoRow
                label="Género"
                value={
                  student.gender ? GENDER_LABEL[student.gender as Gender] : "—"
                }
              />
              <InfoRow
                label="Nacimiento"
                value={
                  student.birthDate
                    ? new Intl.DateTimeFormat("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(student.birthDate))
                    : "—"
                }
              />
              <InfoRow
                label="Mano"
                value={
                  student.dominantHand
                    ? HAND_LABEL[student.dominantHand as DominantHand]
                    : "—"
                }
              />
              <InfoRow
                label="Altura"
                value={student.heightCm ? `${student.heightCm} cm` : "—"}
              />
              <InfoRow
                label="Peso"
                value={student.weightKg ? `${student.weightKg} kg` : "—"}
              />
              <InfoRow
                label="Experiencia"
                value={
                  student.yearsExperience != null
                    ? `${student.yearsExperience} año${student.yearsExperience !== 1 ? "s" : ""}`
                    : "—"
                }
              />
            </dl>
            {student.notes && (
              <div className="mt-6">
                <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50 mb-2">
                  Notas del entrenador
                </p>
                <p className="font-heading italic text-[15px] text-foreground/80 leading-relaxed whitespace-pre-wrap border-l-2 border-brand/40 pl-4">
                  {student.notes}
                </p>
              </div>
            )}
          </div>

          <aside>
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-3 pb-3 border-b border-foreground/15">
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">
                02
              </p>
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                Enlace de perfil
              </p>
            </div>
            <p className="text-[13px] text-foreground/60 leading-relaxed mt-4 mb-4">
              Genera un enlace temporal para que el alumno rellene sus datos
              físicos sin necesidad de cuenta. Caduca en 7 días.
            </p>
            <GenerateProfileLinkButton studentId={student.id} />
          </aside>
        </section>

        {/* Fiabilidad + Proyección */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-3 pb-3 border-b border-foreground/15">
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">
                03
              </p>
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                Fiabilidad · asistencia
              </p>
            </div>
            {pastWithAttendanceCount === 0 ? (
              <p className="text-[13px] text-foreground/55 mt-4">
                Registra la asistencia en sesiones pasadas para ver esta
                métrica.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/55">
                    Asistencia
                  </span>
                  <span className="font-heading text-3xl tabular-nums text-foreground">
                    {Math.round((attendanceRate ?? 0) * 100)}%
                  </span>
                </div>
                <div className="h-px bg-foreground/10 relative overflow-hidden">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 h-[3px] -translate-y-px",
                      (attendanceRate ?? 0) >= 0.8
                        ? "bg-brand"
                        : (attendanceRate ?? 0) >= 0.5
                          ? "bg-foreground/60"
                          : "bg-destructive"
                    )}
                    style={{
                      width: `${Math.round((attendanceRate ?? 0) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-foreground/50 tabular-nums">
                  {attendedCount} de {pastWithAttendanceCount} sesiones con
                  registro ·{" "}
                  {isReliable
                    ? "Cliente fiable"
                    : pastWithAttendanceCount < 3
                      ? "Pocas sesiones"
                      : "Asistencia irregular"}
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-3 pb-3 border-b border-foreground/15">
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">
                04
              </p>
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                Proyección · ritmo
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-5">
              <div>
                <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/45 mb-1">
                  Próxima
                </p>
                {nextSession ? (
                  <Link
                    href={`/sessions/${nextSession.sessionId}`}
                    className="group block"
                  >
                    <p className="font-heading italic text-[14px] text-foreground leading-tight group-hover:text-brand transition-colors truncate">
                      {nextSession.title}
                    </p>
                    <p className="text-[11px] text-foreground/50 mt-0.5 tabular-nums">
                      {fmtDate(new Date(nextSession.scheduledAt))}
                    </p>
                  </Link>
                ) : (
                  <p className="text-[13px] text-foreground/50">Ninguna</p>
                )}
              </div>
              <div>
                <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/45 mb-1">
                  Ritmo
                </p>
                <p className="font-heading text-3xl tabular-nums text-foreground leading-none">
                  {sessionsPerWeek}
                </p>
                <p className="text-[11px] text-foreground/50 mt-1">
                  ses/semana · 30d
                </p>
              </div>
              <div>
                <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/45 mb-1">
                  Acumuladas
                </p>
                <p className="font-heading text-3xl tabular-nums text-foreground leading-none">
                  {Math.round(pastMinutes / 60)}h
                </p>
                <p className="text-[11px] text-foreground/50 mt-1">
                  entrenadas
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Evolución */}
        {recentEvolution.length > 0 && (
          <section>
            <div className="grid grid-cols-[auto_1fr_auto] items-baseline gap-3 pb-3 border-b border-foreground/15">
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">
                05
              </p>
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                Evolución reciente
              </p>
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-foreground/40">
                últimas {recentEvolution.length}
              </p>
            </div>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-8">
              <EvolutionChart
                label="Intensidad"
                items={recentEvolution.map((s) => s.intensity)}
              />
              <EvolutionChart
                label="Valoración"
                items={recentEvolution.map((s) => s.rating)}
              />
            </div>
          </section>
        )}

        {/* Próximas */}
        <section>
          <div className="grid grid-cols-[auto_1fr_auto] items-baseline gap-3 pb-3 border-b border-foreground/15">
            <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">
              06
            </p>
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
              Próximas sesiones
            </p>
            <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-foreground/40">
              {upcomingCount}
            </p>
          </div>
          <div className="pt-4">
            <UpcomingList
              items={upcoming.map((s) => ({
                ssId: s.ssId,
                sessionId: s.sessionId,
                title: s.title,
                scheduledAt: new Date(s.scheduledAt).toISOString(),
                durationMinutes: s.durationMinutes,
              }))}
            />
          </div>
        </section>

        {/* Historial */}
        <section>
          <div className="grid grid-cols-[auto_1fr_auto] items-baseline gap-3 pb-3 border-b border-foreground/15">
            <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">
              07
            </p>
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
              Historial y feedback
            </p>
            <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-foreground/40">
              {pastCount}
            </p>
          </div>
          {past.length === 0 ? (
            <p className="text-[13px] text-foreground/55 mt-6">
              Todavía no hay sesiones completadas.
            </p>
          ) : (
            <ul className="divide-y divide-foreground/10">
              {past.map((s, idx) => (
                <li
                  key={s.ssId}
                  className="py-5 grid grid-cols-1 lg:grid-cols-[auto_1fr_1fr] gap-5 items-start"
                >
                  <div className="flex items-start gap-4">
                    <span className="font-sans text-[10px] tabular-nums tracking-[0.18em] text-foreground/35 w-8 pt-1">
                      {String(idx + 1).padStart(3, "0")}
                    </span>
                    <div className="size-9 border border-foreground/20 flex items-center justify-center shrink-0">
                      <ClipboardList
                        className="size-3.5 text-foreground/60"
                        strokeWidth={1.6}
                      />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/sessions/${s.sessionId}`}
                      className="font-heading italic text-[17px] text-foreground hover:text-brand transition-colors truncate block"
                    >
                      {s.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-[11px] text-foreground/55 tabular-nums">
                      <span>{fmtDate(new Date(s.scheduledAt))}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" strokeWidth={1.6} />{" "}
                        {s.durationMinutes}′
                      </span>
                      {s.intensity != null && (
                        <span className="inline-flex items-center gap-1">
                          <Flame className="size-3" strokeWidth={1.6} />{" "}
                          {s.intensity}/5
                        </span>
                      )}
                    </div>
                    {s.objective && (
                      <p className="text-[12px] text-foreground/55 italic mt-1 truncate">
                        {s.objective}
                      </p>
                    )}
                  </div>
                  <div className="min-w-0">
                    <SessionFeedback
                      sessionStudentId={s.ssId}
                      studentId={student.id}
                      initialAttended={s.attended}
                      initialRating={s.rating}
                      initialFeedback={s.feedback}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="pt-4 grid grid-cols-[1fr_auto] items-end gap-4 text-[11px] text-foreground/45 border-t border-foreground/10">
          <p className="font-heading italic text-[13px] text-foreground/55 max-w-md">
            &ldquo;Entrenar es acompañar — cada ficha, una conversación.&rdquo;
          </p>
          <p className="font-sans tracking-[0.22em] tabular-nums uppercase">
            /tenplanner · 04·{student.id.slice(0, 4)}
          </p>
        </footer>
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="px-4 py-5 border-l first:border-l-0 border-foreground/10">
      <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/45 mb-1.5">
        {label}
      </p>
      <p
        className={cn(
          "font-heading text-3xl tabular-nums leading-none",
          accent ? "text-brand" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-4">
      <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/45 mb-1">
        {label}
      </p>
      <p className="text-[14px] text-foreground">{value}</p>
    </div>
  );
}

function EvolutionChart({
  label,
  items,
}: {
  label: string;
  items: Array<number | null>;
}) {
  const max = 5;
  return (
    <div>
      <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/55 mb-3">
        {label}
      </p>
      <div className="flex items-end gap-1.5 h-20 border-b border-foreground/15">
        {items.map((v, i) => {
          const h = v == null ? 0 : (v / max) * 100;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end gap-1.5"
            >
              <div
                className={cn(
                  "w-full transition-all",
                  v == null ? "bg-foreground/10" : "bg-brand"
                )}
                style={{ height: v == null ? "2px" : `${Math.max(h, 8)}%` }}
                title={v == null ? "Sin datos" : `${v}/5`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-start gap-1.5 mt-1.5">
        {items.map((v, i) => (
          <span
            key={i}
            className="flex-1 text-center font-sans text-[9px] tabular-nums text-foreground/40"
          >
            {v ?? "—"}
          </span>
        ))}
      </div>
    </div>
  );
}
