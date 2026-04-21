import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Zap } from "lucide-react";
import { db } from "@/db";
import { students } from "@/db/schema";
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
      profileToken: students.profileToken,
      profileTokenExpiresAt: students.profileTokenExpiresAt,
    })
    .from(students)
    .where(eq(students.profileToken, token))
    .limit(1);

  if (!student) notFound();

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
                  Tu entrenador te ha invitado a completar tu perfil de jugador.
                  Solo tardas un minuto.
                </p>
              </div>
              <ProfileForm token={token} initialName={student.name} />
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Este enlace expira en 7 días y es de uso exclusivo para ti.
        </p>
      </div>
    </div>
  );
}
