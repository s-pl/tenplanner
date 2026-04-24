import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Zap } from "lucide-react";
import { db } from "@/db";
import { students, users } from "@/db/schema";
import { ProfileForm } from "./profile-form";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function StudentProfilePage({ params }: PageProps) {
  const { token } = await params;

  const [student] = await db
    .select({
      id: students.id,
      name: students.name,
      coachId: students.coachId,
      profileToken: students.profileToken,
      profileTokenExpiresAt: students.profileTokenExpiresAt,
    })
    .from(students)
    .where(eq(students.profileToken, token))
    .limit(1);

  if (!student) notFound();

  const [coach] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, student.coachId))
    .limit(1);

  const now = new Date();
  const expired =
    !student.profileTokenExpiresAt || student.profileTokenExpiresAt < now;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="size-8 rounded-lg bg-brand flex items-center justify-center">
            <Zap className="size-4 text-brand-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-semibold text-lg">
            ten<span className="text-brand">planner</span>
          </span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {expired ? (
            <div className="py-4 text-center space-y-2">
              <p className="text-base font-semibold text-foreground">
                Enlace caducado
              </p>
              <p className="text-sm text-muted-foreground">
                Este enlace ya no es válido. Pide a tu entrenador que genere uno
                nuevo.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-foreground">
                  Hola, {student.name}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {coach?.name ?? "Tu entrenador/a"} te ha invitado a completar
                  tu perfil de jugador. Solo tardas un minuto.
                </p>
              </div>
              <ProfileForm
                token={token}
                initialName={student.name}
                coachName={coach?.name ?? null}
              />
            </>
          )}
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-6">
          Este enlace expira en 7 días y es de uso exclusivo para ti. Al
          enviarlo aceptas la{" "}
          <Link href="/privacidad" target="_blank" className="underline">
            política de privacidad
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
