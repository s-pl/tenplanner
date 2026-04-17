"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2, Target, Brain, Dumbbell, Flame, Plus, X,
  GripVertical, MapPin, Video, Lightbulb, ListOrdered,
  Package, ChevronUp, ChevronDown, ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MediaUploader } from "@/components/app/media-uploader";

type Category = "technique" | "tactics" | "fitness" | "warm-up";
type Difficulty = "beginner" | "intermediate" | "advanced";
type Location = "indoor" | "outdoor" | "any";

interface Step { id: string; title: string; description: string }

const formSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(255),
  description: z.string().max(2000).optional().nullable(),
  objectives: z.string().max(1000).optional().nullable(),
  tips: z.string().max(1000).optional().nullable(),
  category: z.enum(["technique", "tactics", "fitness", "warm-up"] as const, {
    required_error: "Selecciona una categoría",
  }),
  difficulty: z.enum(["beginner", "intermediate", "advanced"] as const, {
    required_error: "Selecciona una dificultad",
  }),
  durationMinutes: z.coerce
    .number({ invalid_type_error: "Introduce un número válido" })
    .int().min(1, "Mínimo 1 minuto").max(300, "Máximo 300 minutos"),
  location: z.enum(["indoor", "outdoor", "any"]).optional().nullable(),
  videoUrl: z.string().max(500).optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

const CATEGORIES: {
  id: Category; label: string; icon: React.ElementType;
  color: string; activeBg: string; activeBorder: string; bg: string; border: string;
}[] = [
  { id: "technique", label: "Técnica", icon: Target, color: "text-blue-400", activeBg: "bg-blue-400/15", activeBorder: "border-blue-400", bg: "bg-blue-400/5", border: "border-blue-400/20" },
  { id: "tactics", label: "Táctica", icon: Brain, color: "text-purple-400", activeBg: "bg-purple-400/15", activeBorder: "border-purple-400", bg: "bg-purple-400/5", border: "border-purple-400/20" },
  { id: "fitness", label: "Fitness", icon: Dumbbell, color: "text-amber-400", activeBg: "bg-amber-400/15", activeBorder: "border-amber-400", bg: "bg-amber-400/5", border: "border-amber-400/20" },
  { id: "warm-up", label: "Calentamiento", icon: Flame, color: "text-brand", activeBg: "bg-brand/15", activeBorder: "border-brand", bg: "bg-brand/5", border: "border-brand/20" },
];

const DIFFICULTIES: { id: Difficulty; label: string; desc: string; activeColor: string; activeBg: string; activeBorder: string }[] = [
  { id: "beginner", label: "Principiante", desc: "Apto para todos", activeColor: "text-brand", activeBg: "bg-brand/10", activeBorder: "border-brand" },
  { id: "intermediate", label: "Intermedio", desc: "Requiere base técnica", activeColor: "text-amber-400", activeBg: "bg-amber-400/10", activeBorder: "border-amber-400" },
  { id: "advanced", label: "Avanzado", desc: "Alta exigencia", activeColor: "text-red-400", activeBg: "bg-red-400/10", activeBorder: "border-red-400" },
];

const LOCATIONS: { id: Location; label: string; icon: string }[] = [
  { id: "indoor", label: "Pista cubierta", icon: "🏟️" },
  { id: "outdoor", label: "Pista exterior", icon: "☀️" },
  { id: "any", label: "Cualquier lugar", icon: "📍" },
];

const PRESET_MATERIALS = [
  "Pelota de pádel", "Raqueta", "Conos", "Escalera de agilidad",
  "Pared de fondo", "Canasta de pelotas", "Elástico", "Disco de equilibrio",
];

export interface ExerciseFormProps {
  mode: "create" | "edit";
  exerciseId?: string;
  initialData?: {
    name?: string;
    description?: string | null;
    category?: Category;
    difficulty?: Difficulty;
    durationMinutes?: number;
    objectives?: string | null;
    tips?: string | null;
    location?: Location | null;
    videoUrl?: string | null;
    steps?: Array<{ title: string; description: string }> | null;
    materials?: string[] | null;
    imageUrl?: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 pb-4 border-b border-border/60 mb-5">
      <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export function ExerciseForm({ mode, exerciseId, initialData, onSuccess, onCancel }: ExerciseFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.imageUrl ?? null);
  const [steps, setSteps] = useState<Step[]>(() =>
    (initialData?.steps ?? []).map((s, i) => ({ id: String(i), title: s.title, description: s.description }))
  );
  const [materials, setMaterials] = useState<string[]>(initialData?.materials ?? []);
  const [materialInput, setMaterialInput] = useState("");
  const materialInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      objectives: initialData?.objectives ?? "",
      tips: initialData?.tips ?? "",
      category: initialData?.category,
      difficulty: initialData?.difficulty,
      durationMinutes: initialData?.durationMinutes,
      location: initialData?.location ?? null,
      videoUrl: initialData?.videoUrl ?? "",
    },
  });

  function addStep() {
    setSteps(prev => [...prev, { id: Date.now().toString(), title: "", description: "" }]);
  }

  function removeStep(id: string) {
    setSteps(prev => prev.filter(s => s.id !== id));
  }

  function updateStep(id: string, field: "title" | "description", value: string) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  function moveStep(index: number, dir: -1 | 1) {
    setSteps(prev => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addMaterial(value: string) {
    const trimmed = value.trim();
    if (!trimmed || materials.includes(trimmed)) return;
    setMaterials(prev => [...prev, trimmed]);
    setMaterialInput("");
  }

  function handleMaterialKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addMaterial(materialInput);
    }
    if (e.key === "Backspace" && !materialInput && materials.length > 0) {
      setMaterials(prev => prev.slice(0, -1));
    }
  }

  function removeMaterial(m: string) {
    setMaterials(prev => prev.filter(x => x !== m));
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const url = mode === "create" ? "/api/exercises" : `/api/exercises/${exerciseId}`;
    const method = mode === "create" ? "POST" : "PUT";

    const payload = {
      ...values,
      description: values.description?.trim() || null,
      objectives: values.objectives?.trim() || null,
      tips: values.tips?.trim() || null,
      videoUrl: values.videoUrl?.trim() || null,
      imageUrl: imageUrl || null,
      steps: steps.filter(s => s.title.trim()).map(s => ({ title: s.title.trim(), description: s.description.trim() })),
      materials: materials.filter(Boolean),
    };

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setServerError(data.details?.map((d: { message: string }) => d.message).join(". ") ?? data.error ?? "Ha ocurrido un error.");
      return;
    }

    if (mode === "create") { router.push("/exercises"); router.refresh(); }
    else { onSuccess?.(); }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">

      {/* ─── SECCIÓN 1: Básico ─── */}
      <section>
        <SectionHeader icon={Dumbbell} title="Información básica" subtitle="Nombre, categoría, dificultad y duración" />
        <div className="space-y-6">
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-semibold text-foreground">Nombre del ejercicio</label>
            <input
              id="name" type="text" placeholder="Ej: Bandeja cruzada de revés"
              autoComplete="off" aria-invalid={!!errors.name}
              {...register("name")}
              className="w-full h-11 px-4 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground font-medium"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Categoría</label>
            <Controller name="category" control={control} render={({ field }) => (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map(({ id, label, icon: Icon, color, activeBg, activeBorder, bg, border }) => {
                  const isSelected = field.value === id;
                  return (
                    <button key={id} type="button" onClick={() => field.onChange(id)}
                      className={cn("flex flex-col items-center gap-2 px-3 py-4 rounded-xl border text-sm font-medium transition-all duration-150",
                        isSelected ? `${activeBg} ${activeBorder} ${color}` : `${bg} ${border} text-muted-foreground hover:text-foreground hover:bg-muted`
                      )}>
                      <Icon className="size-5" />{label}
                    </button>
                  );
                })}
              </div>
            )} />
            {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Dificultad</label>
            <Controller name="difficulty" control={control} render={({ field }) => (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DIFFICULTIES.map(({ id, label, desc, activeColor, activeBg, activeBorder }) => {
                  const isSelected = field.value === id;
                  return (
                    <button key={id} type="button" onClick={() => field.onChange(id)}
                      className={cn("flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl border text-left transition-all duration-150",
                        isSelected ? `${activeBg} ${activeBorder}` : "border-border hover:bg-muted"
                      )}>
                      <span className={cn("text-sm font-semibold", isSelected ? activeColor : "text-foreground")}>{label}</span>
                      <span className="text-xs text-muted-foreground">{desc}</span>
                    </button>
                  );
                })}
              </div>
            )} />
            {errors.difficulty && <p className="text-xs text-destructive">{errors.difficulty.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="durationMinutes" className="block text-sm font-semibold text-foreground">
              Duración <span className="font-normal text-muted-foreground">(minutos)</span>
            </label>
            <div className="flex items-center gap-3">
              <input id="durationMinutes" type="number" min={1} max={300} placeholder="15"
                aria-invalid={!!errors.durationMinutes} {...register("durationMinutes")}
                className="w-28 h-10 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground"
              />
              <span className="text-sm text-muted-foreground">minutos por ejercicio</span>
            </div>
            {errors.durationMinutes && <p className="text-xs text-destructive">{errors.durationMinutes.message}</p>}
          </div>
        </div>
      </section>

      {/* ─── SECCIÓN 2: Qué se trabaja ─── */}
      <section>
        <SectionHeader icon={Target} title="¿Qué se trabaja?" subtitle="Objetivos y descripción del ejercicio" />
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="objectives" className="block text-sm font-semibold text-foreground">
              Objetivo <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <input id="objectives" type="text"
              placeholder="Ej: Mejorar la consistencia del globo defensivo"
              {...register("objectives")}
              className="w-full h-10 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-sm font-semibold text-foreground">
              Descripción <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <textarea id="description" placeholder="Contexto del ejercicio, situación táctica, cómo encaja en el entrenamiento…"
              rows={4} maxLength={2000} {...register("description")}
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>
        </div>
      </section>

      {/* ─── SECCIÓN 3: Pasos de ejecución ─── */}
      <section>
        <SectionHeader icon={ListOrdered} title="Pasos de ejecución" subtitle="Guía paso a paso de cómo realizar el ejercicio" />
        <div className="space-y-3">
          {steps.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-6 text-center">
              <ListOrdered className="size-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Sin pasos definidos aún</p>
              <button type="button" onClick={addStep}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand/80 transition-colors">
                <Plus className="size-4" /> Añadir primer paso
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div key={step.id}
                    className="relative bg-muted/30 border border-border rounded-xl p-4 group">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                        <span className="size-6 rounded-md bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <button type="button" onClick={() => moveStep(idx, -1)} disabled={idx === 0}
                            className="size-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                            <ChevronUp className="size-3" />
                          </button>
                          <button type="button" onClick={() => moveStep(idx, 1)} disabled={idx === steps.length - 1}
                            className="size-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                            <ChevronDown className="size-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <input type="text" value={step.title}
                          onChange={e => updateStep(step.id, "title", e.target.value)}
                          placeholder={`Paso ${idx + 1}: Ej: Posición inicial`}
                          className="w-full h-9 px-3 text-sm font-medium bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground"
                        />
                        <textarea value={step.description}
                          onChange={e => updateStep(step.id, "description", e.target.value)}
                          placeholder="Descripción detallada del paso (opcional)…"
                          rows={2}
                          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground resize-none"
                        />
                      </div>
                      <button type="button" onClick={() => removeStep(step.id)}
                        className="size-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 mt-0.5 opacity-0 group-hover:opacity-100">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addStep}
                className="w-full flex items-center justify-center gap-2 h-9 border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors">
                <Plus className="size-4" /> Añadir paso
              </button>
            </>
          )}
        </div>
      </section>

      {/* ─── SECCIÓN 4: Materiales y lugar ─── */}
      <section>
        <SectionHeader icon={Package} title="Materiales y lugar" subtitle="Equipamiento necesario y dónde se practica" />
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              Materiales necesarios <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <div className={cn(
              "min-h-[42px] flex flex-wrap gap-2 items-center px-3 py-2 bg-background border border-border rounded-xl transition-colors focus-within:ring-2 focus-within:ring-brand/40 focus-within:border-brand/50",
              materials.length === 0 && "items-center"
            )}>
              {materials.map(m => (
                <span key={m} className="inline-flex items-center gap-1 bg-muted text-foreground text-xs font-medium px-2.5 py-1 rounded-lg">
                  {m}
                  <button type="button" onClick={() => removeMaterial(m)}
                    className="hover:text-destructive transition-colors ml-0.5">
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <input ref={materialInputRef} type="text" value={materialInput}
                onChange={e => setMaterialInput(e.target.value)}
                onKeyDown={handleMaterialKey}
                onBlur={() => { if (materialInput.trim()) addMaterial(materialInput); }}
                placeholder={materials.length === 0 ? "Escribe y pulsa Enter para añadir…" : ""}
                className="flex-1 min-w-[140px] h-7 text-sm bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_MATERIALS.filter(m => !materials.includes(m)).map(m => (
                <button key={m} type="button" onClick={() => addMaterial(m)}
                  className="text-xs text-muted-foreground border border-border/60 px-2 py-1 rounded-lg hover:bg-muted hover:text-foreground hover:border-border transition-colors">
                  + {m}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Lugar de práctica</label>
            <Controller name="location" control={control} render={({ field }) => (
              <div className="grid grid-cols-3 gap-2">
                {LOCATIONS.map(({ id, label, icon }) => {
                  const isSelected = field.value === id;
                  return (
                    <button key={id} type="button"
                      onClick={() => field.onChange(field.value === id ? null : id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all duration-150",
                        isSelected
                          ? "bg-brand/10 border-brand text-brand"
                          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}>
                      <span className="text-xl">{icon}</span>
                      <span className="text-xs font-medium leading-tight">{label}</span>
                    </button>
                  );
                })}
              </div>
            )} />
          </div>
        </div>
      </section>

      {/* ─── SECCIÓN 5: Imagen ─── */}
      <section>
        <SectionHeader icon={ImageIcon} title="Imagen del ejercicio" subtitle="Sube una foto, busca en banco de imágenes o pega una URL" />
        <MediaUploader
          value={imageUrl}
          onChange={setImageUrl}
          storagePath={`exercises/${exerciseId ?? "new"}/image`}
          bucket="exercise-media"
          label="Imagen"
          searchSuggestion="padel entrenamiento"
        />
      </section>

      {/* ─── SECCIÓN 6: Recursos adicionales ─── */}
      <section>
        <SectionHeader icon={Lightbulb} title="Recursos y consejos" subtitle="Vídeo de referencia y tips para el entrenador" />
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="videoUrl" className="block text-sm font-semibold text-foreground">
              <span className="inline-flex items-center gap-1.5"><Video className="size-3.5" /> Vídeo de referencia</span>
              <span className="font-normal text-muted-foreground ml-1">(opcional)</span>
            </label>
            <input id="videoUrl" type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              {...register("videoUrl")}
              className="w-full h-10 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="tips" className="block text-sm font-semibold text-foreground">
              <span className="inline-flex items-center gap-1.5"><Lightbulb className="size-3.5" /> Tips para el entrenador</span>
              <span className="font-normal text-muted-foreground ml-1">(opcional)</span>
            </label>
            <textarea id="tips"
              placeholder="Puntos clave a observar, errores comunes, correcciones, progresiones…"
              rows={4} maxLength={1000} {...register("tips")}
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>
        </div>
      </section>

      {serverError && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-border/60">
        <button type="submit" disabled={isSubmitting}
          className="inline-flex items-center gap-2 bg-brand text-brand-foreground text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-brand/90 active:scale-95 transition-all duration-150 disabled:opacity-60">
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {mode === "create" ? "Crear ejercicio" : "Guardar cambios"}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5">
            Cancelar
          </button>
        ) : (
          <Link href="/exercises" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5">
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
