import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, or } from "drizzle-orm";
import {
  ArrowLeft,
  Clock,
  Users,
  Target,
  Package,
  Heart,
  Plus,
  GraduationCap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  classes,
  classBlocks,
  classBlockExercises,
  classFavorites,
  exercises,
} from "@/db/schema";
import { ClassActions } from "./class-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClassDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const [cls] = await db
    .select()
    .from(classes)
    .where(eq(classes.id, id))
    .limit(1);
  if (!cls) notFound();

  const isOwner = !!user && cls.createdBy === user.id;
  if (!cls.isLibrary && !isOwner) notFound();

  const blocks = await db
    .select()
    .from(classBlocks)
    .where(eq(classBlocks.classId, id))
    .orderBy(asc(classBlocks.orderIndex));

  const items = blocks.length
    ? await db
        .select({
          blockId: classBlockExercises.blockId,
          exerciseId: classBlockExercises.exerciseId,
          freeText: classBlockExercises.freeText,
          orderIndex: classBlockExercises.orderIndex,
          durationMinutes: classBlockExercises.durationMinutes,
          exerciseName: exercises.name,
        })
        .from(classBlockExercises)
        .leftJoin(exercises, eq(exercises.id, classBlockExercises.exerciseId))
        .where(
          or(...blocks.map((b) => eq(classBlockExercises.blockId, b.id)))!
        )
        .orderBy(
          asc(classBlockExercises.blockId),
          asc(classBlockExercises.orderIndex)
        )
    : [];

  const isFav = user
    ? !!(
        await db
          .select({ id: classFavorites.id })
          .from(classFavorites)
          .where(
            and(
              eq(classFavorites.userId, user.id),
              eq(classFavorites.classId, id)
            )
          )
          .limit(1)
      )[0]
    : false;

  const blockTitles = ["Bloque inicial", "Bloque principal", "Bloque final"];

  return (
    <div className="space-y-6 px-4 py-8 sm:px-6 md:px-10">
      <Link
        href="/classes"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> Volver a clases
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {cls.isLibrary && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                  Biblioteca
                </span>
              )}
              {cls.nivel && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">
                  {cls.nivel.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl text-foreground leading-tight">
              {cls.name}
            </h1>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" /> {cls.duracionMinutes} min
              </span>
              {cls.alumnosTipo && (
                <span className="inline-flex items-center gap-1.5 capitalize">
                  <Users className="size-3.5" /> {cls.alumnosTipo}
                </span>
              )}
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-2 flex-wrap">
              {isOwner && (
                <Link
                  href={`/classes/${cls.id}/edit`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground border border-border rounded-xl px-3 py-2 hover:bg-muted transition-colors"
                >
                  Editar
                </Link>
              )}
              <ClassActions classId={cls.id} initialFavorite={isFav} />
            </div>
          )}
        </div>
      </div>

      {/* Objetivos / Material */}
      <div className="grid sm:grid-cols-2 gap-4">
        {cls.objetivos && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="size-4 text-brand" />
              <h2 className="font-heading text-base text-foreground">
                Objetivos
              </h2>
            </div>
            <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
              {cls.objetivos}
            </p>
          </div>
        )}
        {cls.material && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Package className="size-4 text-brand" />
              <h2 className="font-heading text-base text-foreground">
                Material
              </h2>
            </div>
            <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
              {cls.material}
            </p>
          </div>
        )}
      </div>

      {/* Resumen de bloques */}
      {blocks.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-xl text-foreground mb-4">
            Índice de actividades
          </h2>
          <ol className="space-y-4">
            {blocks.map((block, idx) => {
              const blockItems = items.filter((i) => i.blockId === block.id);
              return (
                <li
                  key={block.id}
                  className="border-l-2 border-brand/40 pl-4 space-y-2"
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-brand">
                    {String(idx + 1).padStart(2, "0")} ·{" "}
                    {block.title ?? blockTitles[block.orderIndex - 1] ?? "Bloque"}
                  </p>
                  <ul className="space-y-1.5">
                    {blockItems.length === 0 ? (
                      <li className="text-sm text-muted-foreground italic">
                        (sin ejercicios)
                      </li>
                    ) : (
                      blockItems.map((item, i) => (
                        <li
                          key={`${item.blockId}-${i}`}
                          className="text-sm text-foreground/85 flex items-start gap-2"
                        >
                          <span className="text-muted-foreground tabular-nums text-xs pt-0.5">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="flex-1">
                            {item.exerciseName ?? item.freeText ?? "—"}
                            {item.durationMinutes && (
                              <span className="text-muted-foreground ml-2 text-xs">
                                · {item.durationMinutes} min
                              </span>
                            )}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                  {block.notes && (
                    <p className="text-xs text-muted-foreground italic pl-6">
                      {block.notes}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {cls.aspectosImportantes && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-base text-foreground mb-3">
            Aspectos importantes
          </h2>
          <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
            {cls.aspectosImportantes}
          </p>
        </div>
      )}

      {!user && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-8 text-center">
          <GraduationCap
            className="size-8 text-muted-foreground/40 mx-auto mb-3"
            strokeWidth={1.4}
          />
          <p className="text-sm text-foreground/80">
            <Link href="/register" className="text-brand font-semibold hover:underline">
              Crea una cuenta gratis
            </Link>{" "}
            para añadir esta clase a tus sesiones y a tus favoritos.
          </p>
        </div>
      )}
    </div>
  );
}
