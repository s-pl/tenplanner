import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ExerciseForm } from "@/components/app/exercise-form";

export default function NewExercisePage() {
  return (
    <div className="px-6 md:px-8 py-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link
          href="/exercises"
          className="size-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            Nuevo ejercicio
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Añade un ejercicio a la biblioteca
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <ExerciseForm mode="create" />
      </div>
    </div>
  );
}
