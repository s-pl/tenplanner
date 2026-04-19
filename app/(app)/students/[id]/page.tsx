import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
  ArrowLeft, Pencil, Mail, Calendar, Trophy, Ruler, Hand, ClipboardList,
  User as UserIcon, TrendingUp, Flame, ShieldCheck, Clock, Sparkles, Star,
  CalendarCheck, CalendarClock, Target, Link2,
} from "lucide-react";
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
type PlayerLevel = "beginner" | "amateur" | "intermediate" | "advanced" | "competitive";

const GENDER_LABEL: Record<Gender, string> = { male: "Masculino", female: "Femenino", other: "Otro" };
const HAND_LABEL: Record<DominantHand, string> = { left: "Zurdo", right: "Diestro" };
const LEVEL_LABEL: Record<PlayerLevel, string> = {
  beginner: "Principiante", amateur: "Amateur", intermediate: "Intermedio",
  advanced: "Avanzado", competitive: "Competitivo",
};

function initialsFromName(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
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
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}

interface PageProps { params: Promise<{ id: string }>; }

const PAST_RENDER_LIMIT = 120;
const UPCOMING_RENDER_LIMIT = 120;

export default async function StudentDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
        avgRating: sql<number | null>`AVG(${sessionStudents.rating}) FILTER (WHERE ${sessions.scheduledAt} < now() AND ${sessionStudents.rating} IS NOT NULL)`,
        avgIntensity: sql<number | null>`AVG(${sessions.intensity}) FILTER (WHERE ${sessions.scheduledAt} < now() AND ${sessions.intensity} IS NOT NULL)`,
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
      .where(and(eq(sessionStudents.studentId, student.id), sql`${sessions.scheduledAt} < now()`))
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
        .where(and(eq(sessionStudents.studentId, student.id), sql`${sessions.scheduledAt} >= now()`))
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
  const avgIntensity = stats?.avgIntensity == null ? null : Number(stats.avgIntensity);
  const pastWithAttendanceCount = Number(stats?.pastWithAttendanceCount ?? 0);
  const attendedCount = Number(stats?.attendedCount ?? 0);
  const attendanceRate = pastWithAttendanceCount > 0 ? attendedCount / pastWithAttendanceCount : null;
  const isReliable = attendanceRate != null && attendanceRate >= 0.8 && pastWithAttendanceCount >= 3;

  const recentEvolution = past.slice(0, 8).reverse();

  const sessionsPerWeek = Number(stats?.last30PastCount ?? 0) > 0 ? (Number(stats?.last30PastCount ?? 0) / 4.3).toFixed(1) : "0";

  const nextSession = upcoming[0];
  const age = student.birthDate ? ageFromBirthDate(student.birthDate) : null;
  const level = student.playerLevel as PlayerLevel | null;

  return (
    <div className="px-4 md:px-8 py-8 space-y-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/students"
            className="size-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0">
            <ArrowLeft className="size-4" />
          </Link>
          <p className="text-xs text-muted-foreground font-medium truncate">Alumnos</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/students/${student.id}/edit`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground border border-border px-3 py-2 rounded-lg hover:bg-muted hover:text-foreground transition-colors">
            <Pencil className="size-3.5" />
            <span className="hidden sm:inline">Editar</span>
          </Link>
          <DeleteStudentButton studentId={student.id} studentName={student.name} />
        </div>
      </div>

      {/* ─── Two-column grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">

        {/* ── Columna izquierda: perfil + estadísticas ────────────── */}
        <div className="space-y-4">
          {/* Hero */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="bg-brand/5 px-5 py-5 border-b border-border/50 flex items-center gap-4">
              <div className="size-14 rounded-full bg-brand/15 flex items-center justify-center shrink-0 overflow-hidden">
                {student.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={student.imageUrl} alt={student.name} className="size-full object-cover" />
                ) : (
                  <span className="text-base font-bold text-brand">{initialsFromName(student.name)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-heading text-xl font-bold tracking-tight text-foreground leading-tight">{student.name}</h1>
                  {isReliable && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand/15 border border-brand/30 text-brand">
                      <ShieldCheck className="size-3" /> Fiable
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  {level && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
                      <Trophy className="size-3.5" />
                      {LEVEL_LABEL[level]}
                    </span>
                  )}
                  {age != null && <span className="text-xs text-muted-foreground">{age} años</span>}
                  {student.email && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="size-3.5" />{student.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <InfoCard icon={UserIcon} label="Género" value={student.gender ? GENDER_LABEL[student.gender as Gender] : "—"} />
                <InfoCard icon={Calendar} label="Nacimiento" value={
                  student.birthDate
                    ? new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(student.birthDate))
                    : "—"
                } />
                <InfoCard icon={Hand} label="Mano" value={student.dominantHand ? HAND_LABEL[student.dominantHand as DominantHand] : "—"} />
                <InfoCard icon={Ruler} label="Altura" value={student.heightCm ? `${student.heightCm} cm` : "—"} />
                <InfoCard icon={Ruler} label="Peso" value={student.weightKg ? `${student.weightKg} kg` : "—"} />
                <InfoCard icon={Trophy} label="Experiencia" value={student.yearsExperience != null ? `${student.yearsExperience} año${student.yearsExperience !== 1 ? "s" : ""}` : "—"} />
              </div>
              {student.notes && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Notas</p>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{student.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Estadísticas */}
          <section className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="size-4 text-brand" />
              <h2 className="text-sm font-semibold text-foreground">Estadísticas</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <StatTile label="Total sesiones" value={totalSessions.toString()} />
              <StatTile label="Completadas" value={pastCount.toString()} />
              <StatTile label="Próximas" value={upcomingCount.toString()} accent />
              <StatTile label="Horas totales" value={`${Math.round(totalMinutes / 60)}h`} />
              <StatTile
                label="Intensidad media"
                value={avgIntensity != null ? `${avgIntensity.toFixed(1)}/5` : "—"}
                icon={<Flame className="size-3 text-amber-400" />}
              />
              <StatTile
                label="Valoración"
                value={avgRating != null ? `${avgRating.toFixed(1)}/5` : "—"}
                icon={<Star className="size-3 text-amber-400 fill-amber-400" />}
              />
            </div>
          </section>
        </div>

        {/* ── Columna derecha: analytics + enlace ────────────────── */}
        <div className="space-y-4">
          {/* Fiabilidad */}
          <section className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="size-4 text-brand" />
              <h2 className="text-sm font-semibold text-foreground">Fiabilidad</h2>
            </div>
            {pastWithAttendanceCount === 0 ? (
              <p className="text-sm text-muted-foreground">
                Registra la asistencia en sesiones pasadas para obtener esta métrica.
              </p>
            ) : (
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Asistencia</span>
                    <span className="text-2xl font-bold text-foreground">
                      {Math.round((attendanceRate ?? 0) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        (attendanceRate ?? 0) >= 0.8 ? "bg-brand" : (attendanceRate ?? 0) >= 0.5 ? "bg-amber-400" : "bg-destructive"
                      )}
                      style={{ width: `${Math.round((attendanceRate ?? 0) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {attendedCount} de {pastWithAttendanceCount} sesiones con registro.
                  </p>
                </div>
                <div className="flex flex-col items-start justify-center gap-1 sm:border-l sm:border-border/60 sm:pl-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Estado</p>
                  {isReliable ? (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                      <ShieldCheck className="size-4" /> Cliente fiable
                    </span>
                  ) : pastWithAttendanceCount < 3 ? (
                    <span className="text-sm text-muted-foreground">Pocas sesiones</span>
                  ) : (
                    <span className="text-sm text-amber-400 font-medium">Asistencia irregular</span>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Evolución */}
          <section className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="size-4 text-brand" />
              <h2 className="text-sm font-semibold text-foreground">Evolución reciente</h2>
              <span className="ml-auto text-xs text-muted-foreground">Últimas {recentEvolution.length}</span>
            </div>
            {recentEvolution.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin sesiones pasadas todavía.</p>
            ) : (
              <div className="space-y-4">
                <EvolutionChart label="Intensidad" items={recentEvolution.map((s) => s.intensity)} color="bg-amber-400" />
                <EvolutionChart label="Valoración" items={recentEvolution.map((s) => s.rating)} color="bg-brand" />
              </div>
            )}
          </section>

          {/* Proyección */}
          <section className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="size-4 text-brand" />
              <h2 className="text-sm font-semibold text-foreground">Proyección</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Próxima sesión</p>
                {nextSession ? (
                  <Link href={`/sessions/${nextSession.sessionId}`} className="group mt-1 block">
                    <p className="text-sm font-semibold text-foreground group-hover:text-brand transition-colors truncate">{nextSession.title}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(new Date(nextSession.scheduledAt))}</p>
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Ninguna</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ritmo</p>
                <p className="text-2xl font-bold text-foreground mt-1">{sessionsPerWeek}</p>
                <p className="text-xs text-muted-foreground">ses/semana (30d)</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Horas acum.</p>
                <p className="text-2xl font-bold text-foreground mt-1">{Math.round(pastMinutes / 60)}h</p>
                <p className="text-xs text-muted-foreground">entrenadas</p>
              </div>
            </div>
          </section>

          {/* Enlace de perfil */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="size-4 text-brand" />
              <h2 className="text-sm font-semibold text-foreground">Enlace de perfil</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Genera un enlace para que el alumno rellene sus datos físicos sin necesidad de cuenta.
              El enlace caduca en 7 días.
            </p>
            <GenerateProfileLinkButton studentId={student.id} />
          </div>
        </div>
      </div>

      {/* ─── Próximas sesiones (full width) ─────────────────────── */}
      <section className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock className="size-4 text-brand" />
          <h2 className="text-sm font-semibold text-foreground">Próximas sesiones</h2>
          <span className="ml-auto text-xs text-muted-foreground">{upcomingCount}</span>
        </div>
        <UpcomingList
          items={upcoming.map((s) => ({
            ssId: s.ssId,
            sessionId: s.sessionId,
            title: s.title,
            scheduledAt: new Date(s.scheduledAt).toISOString(),
            durationMinutes: s.durationMinutes,
          }))}
        />
      </section>

      {/* ─── Historial con feedback (full width) ─────────────────── */}
      <section className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarCheck className="size-4 text-brand" />
          <h2 className="text-sm font-semibold text-foreground">Historial y feedback</h2>
          <span className="ml-auto text-xs text-muted-foreground">{pastCount}</span>
        </div>
        {past.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay sesiones completadas.</p>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {past.map((s) => (
              <div key={s.ssId} className="p-4 rounded-xl border border-border">
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <ClipboardList className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/sessions/${s.sessionId}`} className="text-sm font-medium text-foreground hover:text-brand transition-colors truncate block">
                      {s.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="text-xs text-muted-foreground">{fmtDate(new Date(s.scheduledAt))}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" /> {s.durationMinutes} min
                      </span>
                      {s.intensity != null && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Flame className="size-3" /> {s.intensity}/5
                        </span>
                      )}
                    </div>
                    {s.objective && (
                      <p className="text-xs text-muted-foreground mt-1 italic truncate">{s.objective}</p>
                    )}
                  </div>
                </div>
                <SessionFeedback
                  sessionStudentId={s.ssId}
                  studentId={student.id}
                  initialAttended={s.attended}
                  initialRating={s.rating}
                  initialFeedback={s.feedback}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-muted/30 border border-border rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="size-3 text-muted-foreground" />
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function StatTile({ label, value, accent, icon }: { label: string; value: string; accent?: boolean; icon?: React.ReactNode }) {
  return (
    <div className={cn(
      "rounded-xl border px-3 py-3",
      accent ? "bg-brand/5 border-brand/20" : "bg-muted/30 border-border"
    )}>
      <div className="flex items-center gap-1 mb-1">
        {icon}
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      </div>
      <p className={cn("text-lg font-bold leading-none", accent ? "text-brand" : "text-foreground")}>{value}</p>
    </div>
  );
}

function EvolutionChart({ label, items, color }: { label: string; items: Array<number | null>; color: string }) {
  const max = 5;
  return (
    <div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{label}</p>
      <div className="flex items-end gap-1 h-16">
        {items.map((v, i) => {
          const h = v == null ? 0 : (v / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
              <div
                className={cn("w-full rounded-t-sm transition-all", v == null ? "bg-muted" : color)}
                style={{ height: v == null ? "4px" : `${Math.max(h, 8)}%` }}
                title={v == null ? "Sin datos" : `${v}/5`}
              />
              <span className="text-[9px] text-muted-foreground">{v ?? "—"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
