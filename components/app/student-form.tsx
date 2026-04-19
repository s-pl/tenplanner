"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2, User, Ruler, Mail, Hash, ChevronDown, Trophy, FileText, ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Gender = "male" | "female" | "other";
type DominantHand = "left" | "right";
type PlayerLevel = "beginner" | "amateur" | "intermediate" | "advanced" | "competitive";

const formSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(255),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other"]).optional().nullable(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD").optional().or(z.literal("")),
  heightCm: z.union([z.coerce.number().int().min(50).max(250), z.literal("")]).optional().nullable(),
  weightKg: z.union([z.coerce.number().int().min(20).max(250), z.literal("")]).optional().nullable(),
  dominantHand: z.enum(["left", "right"]).optional().nullable(),
  playerLevel: z.enum(["beginner", "amateur", "intermediate", "advanced", "competitive"]).optional().nullable(),
  yearsExperience: z.union([z.coerce.number().int().min(0).max(80), z.literal("")]).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  imageUrl: z.string().trim().max(1000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

const GENDERS: { id: Gender; label: string }[] = [
  { id: "male", label: "Masculino" },
  { id: "female", label: "Femenino" },
  { id: "other", label: "Otro" },
];

const HANDS: { id: DominantHand; label: string }[] = [
  { id: "right", label: "Diestro" },
  { id: "left", label: "Zurdo" },
];

const LEVELS: { id: PlayerLevel; label: string; desc: string }[] = [
  { id: "beginner", label: "Principiante", desc: "Está aprendiendo" },
  { id: "amateur", label: "Amateur", desc: "Juega casualmente" },
  { id: "intermediate", label: "Intermedio", desc: "Tiene base técnica" },
  { id: "advanced", label: "Avanzado", desc: "Juega con regularidad" },
  { id: "competitive", label: "Competitivo", desc: "Compite en torneos" },
];

export interface StudentFormProps {
  mode: "create" | "edit";
  studentId?: string;
  initialData?: {
    name?: string;
    email?: string | null;
    gender?: Gender | null;
    birthDate?: string | null;
    heightCm?: number | null;
    weightKg?: number | null;
    dominantHand?: DominantHand | null;
    playerLevel?: PlayerLevel | null;
    yearsExperience?: number | null;
    notes?: string | null;
    imageUrl?: string | null;
  };
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

export function StudentForm({ mode, studentId, initialData }: StudentFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      email: initialData?.email ?? "",
      gender: initialData?.gender ?? null,
      birthDate: initialData?.birthDate ?? "",
      heightCm: initialData?.heightCm ?? "",
      weightKg: initialData?.weightKg ?? "",
      dominantHand: initialData?.dominantHand ?? null,
      playerLevel: initialData?.playerLevel ?? null,
      yearsExperience: initialData?.yearsExperience ?? "",
      notes: initialData?.notes ?? "",
      imageUrl: initialData?.imageUrl ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const url = mode === "create" ? "/api/students" : `/api/students/${studentId}`;
    const method = mode === "create" ? "POST" : "PUT";

    const payload = {
      name: values.name.trim(),
      email: values.email ? values.email : null,
      gender: values.gender ?? null,
      birthDate: values.birthDate || null,
      heightCm: values.heightCm === "" || values.heightCm == null ? null : Number(values.heightCm),
      weightKg: values.weightKg === "" || values.weightKg == null ? null : Number(values.weightKg),
      dominantHand: values.dominantHand ?? null,
      playerLevel: values.playerLevel ?? null,
      yearsExperience: values.yearsExperience === "" || values.yearsExperience == null ? null : Number(values.yearsExperience),
      notes: values.notes?.trim() || null,
      imageUrl: values.imageUrl?.trim() || null,
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setServerError(data.details?.map((d: { message: string }) => d.message).join(". ") ?? data.error ?? "Ha ocurrido un error.");
      return;
    }

    const data = await res.json();
    if (mode === "create") {
      router.push(`/students/${data.data.id}`);
      router.refresh();
    } else {
      router.push(`/students/${studentId}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">

      <section>
        <SectionHeader icon={User} title="Datos personales" subtitle="Información básica del alumno" />
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-semibold text-foreground">Nombre completo</label>
            <input id="name" type="text" placeholder="Ej: Carmen García"
              autoComplete="off" aria-invalid={!!errors.name}
              {...register("name")}
              className="w-full h-11 px-4 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground font-medium"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-foreground">
                <span className="inline-flex items-center gap-1.5"><Mail className="size-3.5" /> Email</span>
                <span className="font-normal text-muted-foreground ml-1">(opcional)</span>
              </label>
              <input id="email" type="email" placeholder="alumno@email.com"
                {...register("email")}
                className="w-full h-10 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="birthDate" className="block text-sm font-semibold text-foreground">
                Fecha de nacimiento <span className="font-normal text-muted-foreground">(opcional)</span>
              </label>
              <input id="birthDate" type="date"
                {...register("birthDate")}
                className="w-full h-10 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground"
              />
              {errors.birthDate && <p className="text-xs text-destructive">{errors.birthDate.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              Género <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Controller name="gender" control={control} render={({ field }) => (
              <div className="grid grid-cols-3 gap-2">
                {GENDERS.map(({ id, label }) => {
                  const isSelected = field.value === id;
                  return (
                    <button key={id} type="button"
                      onClick={() => field.onChange(isSelected ? null : id)}
                      className={cn(
                        "px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150",
                        isSelected
                          ? "bg-brand/10 border-brand text-brand"
                          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >{label}</button>
                  );
                })}
              </div>
            )} />
          </div>
        </div>
      </section>

      <section>
        <SectionHeader icon={Ruler} title="Datos físicos" subtitle="Altura, peso y mano dominante" />
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="heightCm" className="block text-sm font-semibold text-foreground">
                Altura <span className="font-normal text-muted-foreground">(cm)</span>
              </label>
              <input id="heightCm" type="number" min={50} max={250} placeholder="175"
                {...register("heightCm")}
                className="w-full h-10 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground"
              />
              {errors.heightCm && <p className="text-xs text-destructive">{errors.heightCm.message as string}</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="weightKg" className="block text-sm font-semibold text-foreground">
                Peso <span className="font-normal text-muted-foreground">(kg)</span>
              </label>
              <input id="weightKg" type="number" min={20} max={250} placeholder="70"
                {...register("weightKg")}
                className="w-full h-10 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground"
              />
              {errors.weightKg && <p className="text-xs text-destructive">{errors.weightKg.message as string}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              Mano dominante <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Controller name="dominantHand" control={control} render={({ field }) => (
              <div className="grid grid-cols-2 gap-2">
                {HANDS.map(({ id, label }) => {
                  const isSelected = field.value === id;
                  return (
                    <button key={id} type="button"
                      onClick={() => field.onChange(isSelected ? null : id)}
                      className={cn(
                        "px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150",
                        isSelected
                          ? "bg-brand/10 border-brand text-brand"
                          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >{label}</button>
                  );
                })}
              </div>
            )} />
          </div>
        </div>
      </section>

      <section>
        <SectionHeader icon={Trophy} title="Nivel de juego" subtitle="Experiencia y nivel del jugador" />
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              Nivel <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Controller name="playerLevel" control={control} render={({ field }) => (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                {LEVELS.map(({ id, label, desc }) => {
                  const isSelected = field.value === id;
                  return (
                    <button key={id} type="button"
                      onClick={() => field.onChange(isSelected ? null : id)}
                      className={cn(
                        "flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-150",
                        isSelected
                          ? "bg-brand/10 border-brand"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      <span className={cn("text-sm font-semibold", isSelected ? "text-brand" : "text-foreground")}>{label}</span>
                      <span className="text-[11px] text-muted-foreground">{desc}</span>
                    </button>
                  );
                })}
              </div>
            )} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="yearsExperience" className="block text-sm font-semibold text-foreground">
              Años de experiencia <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <input id="yearsExperience" type="number" min={0} max={80} placeholder="3"
              {...register("yearsExperience")}
              className="w-28 h-10 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground"
            />
            {errors.yearsExperience && <p className="text-xs text-destructive">{errors.yearsExperience.message as string}</p>}
          </div>
        </div>
      </section>

      <section>
        <SectionHeader icon={FileText} title="Notas y foto" subtitle="Información adicional" />
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="imageUrl" className="block text-sm font-semibold text-foreground">
              <span className="inline-flex items-center gap-1.5"><ImageIcon className="size-3.5" /> URL de foto</span>
              <span className="font-normal text-muted-foreground ml-1">(opcional)</span>
            </label>
            <input id="imageUrl" type="url" placeholder="https://..."
              {...register("imageUrl")}
              className="w-full h-10 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="notes" className="block text-sm font-semibold text-foreground">
              Notas <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <textarea id="notes" rows={4} maxLength={2000}
              placeholder="Objetivos, lesiones, disponibilidad, fortalezas, áreas a mejorar…"
              {...register("notes")}
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
          {mode === "create" ? "Crear alumno" : "Guardar cambios"}
        </button>
        <Link href={mode === "create" ? "/students" : `/students/${studentId}`}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
