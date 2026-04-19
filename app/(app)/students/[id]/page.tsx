import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import {
  ArrowLeft, Pencil, Mail, Calendar, Trophy, Ruler, Hand, ClipboardList, User as UserIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { students, sessionStudents } from "@/db/schema";
import { DeleteStudentButton } from "./delete-student-button";

type Gender = "male" | "female" | "other";
type DominantHand = "left" | "right";
type PlayerLevel = "beginner" | "amateur" | "intermediate" | "advanced" | "competitive";

const GENDER_LABEL: Record<Gender, string> = {
  male: "Masculino",
  female: "Femenino",
  other: "Otro",
};
const HAND_LABEL: Record<DominantHand, string> = { left: "Zurdo", right: "Diestro" };
const LEVEL_LABEL: Record<PlayerLevel, string> = {
  beginner: "Principiante",
  amateur: "Amateur",
  intermediate: "Intermedio",
  advanced: "Avanzado",
  competitive: "Competitivo",
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

interface PageProps {
  params: Promise<{ id: string }>;
}

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

  const assignedSessions = await db
    .select({ sessionId: sessionStudents.sessionId })
    .from(sessionStudents)
    .where(eq(sessionStudents.studentId, student.id));

  const age = student.birthDate ? ageFromBirthDate(student.birthDate) : null;
  const level = student.playerLevel as PlayerLevel | null;

  return (
    <div className="px-4 md:px-8 py-8 space-y-6 max-w-5xl">
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

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="bg-brand/5 px-6 py-6 border-b border-border/50 flex items-center gap-4">
          <div className="size-16 rounded-full bg-brand/15 flex items-center justify-center shrink-0 overflow-hidden">
            {student.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={student.imageUrl} alt={student.name} className="size-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-brand">{initialsFromName(student.name)}</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground leading-tight">{student.name}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              {level && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
                  <Trophy className="size-3.5" />
                  {LEVEL_LABEL[level]}
                </span>
              )}
              {age != null && (
                <span className="text-xs text-muted-foreground">{age} años</span>
              )}
              {student.email && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="size-3.5" />{student.email}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoCard icon={UserIcon} label="Género" value={student.gender ? GENDER_LABEL[student.gender as Gender] : "—"} />
            <InfoCard icon={Calendar} label="Fecha de nacimiento" value={
              student.birthDate
                ? new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "long", year: "numeric" })
                    .format(new Date(student.birthDate))
                : "—"
            } />
            <InfoCard icon={Hand} label="Mano dominante" value={student.dominantHand ? HAND_LABEL[student.dominantHand as DominantHand] : "—"} />
            <InfoCard icon={Ruler} label="Altura" value={student.heightCm ? `${student.heightCm} cm` : "—"} />
            <InfoCard icon={Ruler} label="Peso" value={student.weightKg ? `${student.weightKg} kg` : "—"} />
            <InfoCard icon={Trophy} label="Años de experiencia" value={student.yearsExperience != null ? `${student.yearsExperience} año${student.yearsExperience !== 1 ? "s" : ""}` : "—"} />
          </div>

          {student.notes && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Notas</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{student.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Sesiones asignadas</h2>
          <span className="ml-auto text-xs text-muted-foreground">{assignedSessions.length}</span>
        </div>
        {assignedSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Este alumno aún no tiene sesiones asignadas.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {assignedSessions.length} sesión{assignedSessions.length !== 1 ? "es" : ""} vinculada{assignedSessions.length !== 1 ? "s" : ""}. La vista completa estará disponible próximamente.
          </p>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-muted/30 border border-border rounded-xl px-4 py-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="size-3 text-muted-foreground" />
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
