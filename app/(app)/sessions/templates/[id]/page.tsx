import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  exercises,
  sessionTemplateExercises,
  sessionTemplates,
  users,
} from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft, Clock, Zap, MapPin, Download } from "lucide-react";
import { AdoptTemplateButton } from "@/components/app/session-templates/adopt-template-button";
import { PublishTemplateActions } from "@/components/app/session-templates/publish-template-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

const PHASE_LABEL: Record<string, string> = {
  activation: "Activación",
  main: "Principal",
  cooldown: "Vuelta a la calma",
};

const CATEGORY_LABEL: Record<string, string> = {
  technique: "Técnica",
  tactics: "Táctica",
  fitness: "Físico",
  "warm-up": "Calentamiento",
};

export default async function SessionTemplatePage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/login");

  const { id } = await params;

  const [template] = await db
    .select({
      id: sessionTemplates.id,
      authorId: sessionTemplates.authorId,
      authorName: users.name,
      title: sessionTemplates.title,
      description: sessionTemplates.description,
      objective: sessionTemplates.objective,
      durationMinutes: sessionTemplates.durationMinutes,
      intensity: sessionTemplates.intensity,
      tags: sessionTemplates.tags,
      location: sessionTemplates.location,
      adoptionsCount: sessionTemplates.adoptionsCount,
      createdAt: sessionTemplates.createdAt,
    })
    .from(sessionTemplates)
    .leftJoin(users, eq(sessionTemplates.authorId, users.id))
    .where(eq(sessionTemplates.id, id))
    .limit(1);

  if (!template) notFound();

  const templateExercises = await db
    .select({
      id: sessionTemplateExercises.id,
      orderIndex: sessionTemplateExercises.orderIndex,
      durationMinutes: sessionTemplateExercises.durationMinutes,
      notes: sessionTemplateExercises.notes,
      phase: sessionTemplateExercises.phase,
      intensity: sessionTemplateExercises.intensity,
      exercise: {
        id: exercises.id,
        name: exercises.name,
        category: exercises.category,
        difficulty: exercises.difficulty,
        durationMinutes: exercises.durationMinutes,
        imageUrl: exercises.imageUrl,
      },
    })
    .from(sessionTemplateExercises)
    .leftJoin(exercises, eq(sessionTemplateExercises.exerciseId, exercises.id))
    .where(eq(sessionTemplateExercises.templateId, id))
    .orderBy(asc(sessionTemplateExercises.orderIndex));

  const isAuthor = template.authorId === user.id;

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--foreground) 4%, transparent) 1px, transparent 1px)",
          backgroundSize: "calc(100%/12) 100%",
        }}
      />

      <div className="relative px-4 sm:px-6 md:px-10 lg:px-14 py-10 md:py-14 space-y-10">
        {/* Back */}
        <Link
          href="/sessions/templates"
          className="inline-flex items-center gap-1.5 text-[12px] text-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Plantillas
        </Link>

        {/* Masthead */}
        <header className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
              Planificación · Plantilla
            </p>
            {template.adoptionsCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/8 border border-brand/20 px-2.5 py-1 text-[10px] font-sans text-brand">
                <Download className="size-3" />
                {template.adoptionsCount} adopciones
              </span>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-foreground/15">
            <div className="max-w-2xl space-y-3">
              <h1 className="font-heading text-4xl md:text-5xl leading-[1.05] tracking-tight text-foreground">
                {template.title}
              </h1>
              {template.objective && (
                <p className="text-[15px] text-foreground/65 leading-relaxed">
                  {template.objective}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground/55">
                  <Clock className="size-3.5" /> {template.durationMinutes} min
                </span>
                {template.intensity != null && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground/55">
                    <Zap className="size-3.5" /> Intensidad {template.intensity}
                    /5
                  </span>
                )}
                {template.location && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground/55">
                    <MapPin className="size-3.5" /> {template.location}
                  </span>
                )}
                {template.authorName && (
                  <span className="text-[12px] text-foreground/40">
                    por {template.authorName}
                  </span>
                )}
              </div>
              {Array.isArray(template.tags) &&
                (template.tags as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(template.tags as string[]).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-brand/8 border border-brand/20 px-2.5 py-0.5 text-[11px] font-sans text-brand"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto md:shrink-0">
              {isAuthor ? (
                <PublishTemplateActions templateId={template.id} />
              ) : (
                <AdoptTemplateButton templateId={template.id} />
              )}
            </div>
          </div>
        </header>

        {/* Exercise list */}
        <section className="space-y-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/40">
            {templateExercises.length.toString().padStart(2, "0")} ejercicios
          </p>

          {templateExercises.length === 0 ? (
            <p className="text-[14px] text-foreground/45">
              Esta plantilla no tiene ejercicios.
            </p>
          ) : (
            <div className="space-y-2">
              {templateExercises.map((te, i) => (
                <div
                  key={te.id}
                  className="flex items-start gap-4 rounded-xl border border-foreground/10 bg-foreground/[0.02] px-4 py-3"
                >
                  <span className="font-sans text-[10px] tabular-nums text-foreground/30 mt-0.5 shrink-0">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="font-heading text-[15px] text-foreground leading-snug">
                      {te.exercise?.name ?? "Ejercicio eliminado"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {te.exercise?.category && (
                        <span className="text-[11px] text-foreground/45">
                          {CATEGORY_LABEL[te.exercise.category] ??
                            te.exercise.category}
                        </span>
                      )}
                      {te.phase && (
                        <span className="text-[11px] text-foreground/45">
                          · {PHASE_LABEL[te.phase] ?? te.phase}
                        </span>
                      )}
                    </div>
                    {te.notes && (
                      <p className="text-[12px] text-foreground/50 leading-relaxed pt-0.5">
                        {te.notes}
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] text-foreground/40 tabular-nums shrink-0">
                    {te.durationMinutes ?? te.exercise?.durationMinutes ?? "—"}{" "}
                    min
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
