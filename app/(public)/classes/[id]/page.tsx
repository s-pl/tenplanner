import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, or } from "drizzle-orm";
import {
  ArrowLeft,
  Clock,
  Users,
  Target,
  Package,
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
          exerciseDescription: exercises.description,
        })
        .from(classBlockExercises)
        .leftJoin(exercises, eq(exercises.id, classBlockExercises.exerciseId))
        .where(or(...blocks.map((b) => eq(classBlockExercises.blockId, b.id)))!)
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
    <div className="relative min-h-full overflow-hidden bg-[#F4F4F1] px-4 py-6 text-[#050505] dark:bg-[#050505] dark:text-[#F4F4F1] sm:px-6 md:px-10 lg:px-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_78%_18%,rgba(214,255,56,0.22),transparent_34%),linear-gradient(180deg,rgba(5,5,5,0.06),transparent)] dark:bg-[radial-gradient(circle_at_78%_18%,rgba(214,255,56,0.16),transparent_34%)]" />
      <Link
        href="/classes"
        className="relative inline-flex items-center gap-2 rounded-full border border-[#050505]/12 bg-white px-3 py-2 text-sm font-semibold text-muted-foreground shadow-sm transition-colors hover:border-[#D6FF38] hover:text-foreground dark:border-white/10 dark:bg-white/[0.04]"
      >
        <ArrowLeft className="size-4" /> Volver a clases
      </Link>

      <div className="relative mt-6 overflow-hidden rounded-lg bg-[#050505] text-white shadow-[0_24px_80px_rgba(5,5,5,0.18)]">
        <div className="p-5 sm:p-7 lg:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {cls.isLibrary && (
                  <span className="rounded-full bg-[#D6FF38] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#050505]">
                    Biblioteca
                  </span>
                )}
                {cls.nivel && (
                  <span className="rounded-full border border-white/14 bg-white/[0.06] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/62 capitalize">
                    {cls.nivel.replace(/_/g, " ")}
                  </span>
                )}
              </div>
              <h1 className="max-w-4xl font-heading text-4xl font-semibold leading-tight tracking-normal text-white sm:text-5xl">
                {cls.name}
              </h1>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/68">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" /> {cls.duracionMinutes} min
                </span>
                {cls.alumnosTipo && (
                  <span className="inline-flex items-center gap-1.5 capitalize">
                    <Users className="size-3.5" />{" "}
                    {cls.numAlumnos
                      ? `${cls.numAlumnos} alumnos`
                      : cls.alumnosTipo}
                  </span>
                )}
              </div>
            </div>

            {user && (
              <div className="flex items-center gap-2 flex-wrap">
                {isOwner && (
                  <Link
                    href={`/classes/${cls.id}/edit`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/16 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-[#D6FF38] hover:text-[#D6FF38]"
                  >
                    Editar
                  </Link>
                )}
                <ClassActions classId={cls.id} initialFavorite={isFav} />
              </div>
            )}
          </div>
        </div>
        <div className="h-2 bg-[#D6FF38]" />
      </div>

      {/* Objetivos / Material */}
      <div className="grid sm:grid-cols-2 gap-4">
        {cls.objetivos && (
          <div className="rounded-lg border border-[#050505]/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
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
          <div className="rounded-lg border border-[#050505]/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
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
        <div className="rounded-lg border border-[#050505]/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
          <h2 className="font-heading text-xl text-foreground mb-4">
            Índice de actividades
          </h2>
          <ol className="space-y-4">
            {blocks.map((block, idx) => {
              const blockItems = items.filter((i) => i.blockId === block.id);
              return (
                <li
                  key={block.id}
                  className="space-y-2 border-l-2 border-[#D6FF38] pl-4"
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#6D7F00] dark:text-[#D6FF38]">
                    {String(idx + 1).padStart(2, "0")} ·{" "}
                    {block.title ??
                      blockTitles[block.orderIndex - 1] ??
                      "Bloque"}
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
                            {item.exerciseId && item.exerciseName ? (
                              <Link
                                href={`/exercises/${item.exerciseId}?fromClass=${cls.id}`}
                                className="font-medium text-foreground hover:text-brand"
                              >
                                {item.exerciseName}
                              </Link>
                            ) : (
                              (item.freeText ?? "-")
                            )}
                            {item.durationMinutes && (
                              <span className="text-muted-foreground ml-2 text-xs">
                                · {item.durationMinutes} min
                              </span>
                            )}
                            {item.exerciseDescription && (
                              <span className="mt-1 block text-xs leading-5 text-muted-foreground line-clamp-2">
                                {item.exerciseDescription}
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
        <div className="rounded-lg border border-[#050505]/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <h2 className="font-heading text-base text-foreground mb-3">
            Aspectos importantes
          </h2>
          <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
            {cls.aspectosImportantes}
          </p>
        </div>
      )}

      {!user && (
        <div className="rounded-lg border border-dashed border-[#050505]/18 bg-white/60 px-6 py-8 text-center dark:border-white/15 dark:bg-white/[0.04]">
          <GraduationCap
            className="size-8 text-muted-foreground/40 mx-auto mb-3"
            strokeWidth={1.4}
          />
          <p className="text-sm text-foreground/80">
            <Link
              href="/register"
              className="text-brand font-semibold hover:underline"
            >
              Crea una cuenta gratis
            </Link>{" "}
            para añadir esta clase a tus sesiones y a tus favoritos.
          </p>
        </div>
      )}
    </div>
  );
}
