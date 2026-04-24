"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  Check,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Tipos de perfil ───────────────────────────────────────────────────────

type Role = "player" | "coach" | "both";
type Level =
  | "beginner"
  | "amateur"
  | "intermediate"
  | "advanced"
  | "competitive";
type Surface = "crystal" | "turf" | "cement" | "any";

interface ProfileData {
  city: string;
  role: Role | null;
  playerLevel: Level | null;
  yearsExperience: number | null;
  surfacePreference: Surface | null;
  goals: string;
}

// ─── Schema paso 1 ────────────────────────────────────────────────────────

const accountSchema = z
  .object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Introduce un email válido"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type AccountValues = z.infer<typeof accountSchema>;

// ─── Opciones ─────────────────────────────────────────────────────────────

const ROLES: { id: Role; emoji: string; label: string; desc: string }[] = [
  {
    id: "player",
    emoji: "🎾",
    label: "Jugador",
    desc: "Quiero mejorar mi juego",
  },
  {
    id: "coach",
    emoji: "🏋️",
    label: "Entrenador",
    desc: "Planifico sesiones para otros",
  },
  { id: "both", emoji: "⚡", label: "Ambos", desc: "Juego y entreno a otros" },
];

const LEVELS: { id: Level; label: string; desc: string }[] = [
  { id: "beginner", label: "Iniciación", desc: "Empezando a jugar" },
  { id: "amateur", label: "Amateur", desc: "Categorías 5ª–7ª" },
  { id: "intermediate", label: "Intermedio", desc: "Categorías 3ª–4ª" },
  { id: "advanced", label: "Avanzado", desc: "Categorías 1ª–2ª" },
  { id: "competitive", label: "Competidor", desc: "Torneos nacionales" },
];

const COACH_LEVELS: { id: Level; label: string; desc: string }[] = [
  { id: "beginner", label: "Novato", desc: "Primeros años como entrenador" },
  {
    id: "amateur",
    label: "En formación",
    desc: "Algunas temporadas de experiencia",
  },
  {
    id: "intermediate",
    label: "Consolidado",
    desc: "Entrenador con experiencia sólida",
  },
  { id: "advanced", label: "Avanzado", desc: "Alta competición o clubes" },
  { id: "competitive", label: "Experto", desc: "Entrenador profesional" },
];

const SURFACES: { id: Surface; emoji: string; label: string }[] = [
  { id: "crystal", emoji: "🔷", label: "Cristal" },
  { id: "turf", emoji: "🟩", label: "Hierba artif." },
  { id: "cement", emoji: "⬜", label: "Hormigón" },
  { id: "any", emoji: "🌐", label: "Todas" },
];

const GOAL_OPTIONS = [
  "Mejorar mi técnica de base",
  "Subir de categoría en torneos",
  "Mejorar la condición física",
  "Planificar entrenamientos efectivos",
  "Aprender a entrenar a otros",
  "Divertirme y socializar",
];

const QUICK_CITIES = [
  "Madrid",
  "Barcelona",
  "Valencia",
  "Sevilla",
  "Bilbao",
  "Málaga",
  "Zaragoza",
];

const TOTAL_STEPS = 4;

// ─── Password strength ─────────────────────────────────────────────────────

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function getPasswordStrength(pw: string): StrengthLevel {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return 1;
  if (score === 2) return 2;
  if (score === 3) return 3;
  return 4;
}

const STRENGTH_CONFIG: Record<
  StrengthLevel,
  { label: string; color: string; bars: number }
> = {
  0: { label: "", color: "", bars: 0 },
  1: { label: "Muy débil", color: "bg-red-500", bars: 1 },
  2: { label: "Débil", color: "bg-orange-400", bars: 2 },
  3: { label: "Media", color: "bg-yellow-400", bars: 3 },
  4: { label: "Fuerte", color: "bg-brand", bars: 4 },
};

// ─── Componente principal ─────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailExistsError, setEmailExistsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    city: "",
    role: null,
    playerLevel: null,
    yearsExperience: null,
    surfacePreference: null,
    goals: "",
  });

  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [emailSent, setEmailSent] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    watch,
  } = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
  });

  const passwordValue = watch("password", "");
  const strength = getPasswordStrength(passwordValue);
  const strengthCfg = STRENGTH_CONFIG[strength];

  function toggleGoal(g: string) {
    setSelectedGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  function canAdvance(): boolean {
    if (step === 2) return profile.city.trim().length > 0;
    if (step === 3) return profile.role !== null && profile.playerLevel !== null;
    return true;
  }

  function next() {
    if (canAdvance()) setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleAccountNext() {
    setEmailExistsError(null);
    const valid = await new Promise<boolean>((resolve) => {
      handleSubmit(
        () => resolve(true),
        () => resolve(false)
      )();
    });
    if (valid) next();
  }

  async function submitAll() {
    if (!privacyAccepted) {
      setServerError(
        "Debes aceptar la política de privacidad para crear una cuenta."
      );
      return;
    }
    setLoading(true);
    setServerError(null);

    const values = getValues();
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      const isEmailTaken =
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already exists") ||
        error.message.toLowerCase().includes("user already");

      if (isEmailTaken) {
        setEmailExistsError(
          `Ya existe una cuenta con ${values.email}. ¿Quieres iniciar sesión?`
        );
        setStep(1);
        setLoading(false);
        return;
      }

      setServerError(error.message);
      setLoading(false);
      return;
    }

    if (data.user && data.session) {
      const goalsText = [
        ...selectedGoals,
        ...(profile.goals.trim() ? [profile.goals.trim()] : []),
      ].join(", ");
      try {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({
            id: data.user.id,
            name: values.name,
            email: values.email,
            city: profile.city || null,
            role: profile.role,
            playerLevel: profile.playerLevel,
            yearsExperience: profile.yearsExperience,
            surfacePreference: profile.surfacePreference,
            goals: goalsText || null,
          }),
        });
        if (!res.ok) {
          setServerError(
            "Cuenta creada, pero no se pudo guardar el perfil. Inténtalo de nuevo."
          );
          setLoading(false);
          return;
        }
      } catch {
        setServerError(
          "Cuenta creada, pero no se pudo guardar el perfil. Inténtalo de nuevo."
        );
        setLoading(false);
        return;
      }
    }

    if (data.session) router.push("/dashboard");
    else setEmailSent(values.email);
  }

  const levelOptions = profile.role === "coach" ? COACH_LEVELS : LEVELS;

  // ─── Pantalla de éxito ────────────────────────────────────────────────────

  if (emailSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-16 rounded-2xl bg-brand/15 flex items-center justify-center">
            <Mail className="size-8 text-brand" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Revisa tu correo
            </h1>
            <p className="text-sm text-muted-foreground">
              Hemos enviado un enlace de verificación a
            </p>
            <p className="text-sm font-semibold text-foreground break-all px-2">
              {emailSent}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 px-5 py-4 text-left space-y-2">
          <p className="text-xs font-semibold text-foreground">
            ¿Qué hacer ahora?
          </p>
          <ol className="space-y-1.5 text-xs text-muted-foreground list-none">
            <li className="flex gap-2">
              <span className="size-4 rounded-full bg-brand/20 text-brand flex items-center justify-center shrink-0 font-semibold text-[10px] mt-px">
                1
              </span>
              Abre el correo de{" "}
              <span className="font-medium text-foreground ml-0.5">
                tenplanner
              </span>
            </li>
            <li className="flex gap-2">
              <span className="size-4 rounded-full bg-brand/20 text-brand flex items-center justify-center shrink-0 font-semibold text-[10px] mt-px">
                2
              </span>
              Haz clic en el enlace de verificación
            </li>
            <li className="flex gap-2">
              <span className="size-4 rounded-full bg-brand/20 text-brand flex items-center justify-center shrink-0 font-semibold text-[10px] mt-px">
                3
              </span>
              Vuelve aquí para iniciar sesión
            </li>
          </ol>
        </div>

        <div className="space-y-2.5">
          <Button
            type="button"
            className="w-full h-10 bg-brand hover:bg-brand/90 text-brand-foreground font-semibold"
            onClick={() =>
              router.push(
                `/login?message=check_email&email=${encodeURIComponent(emailSent)}`
              )
            }
          >
            Ir a iniciar sesión <ArrowRight className="size-4 ml-1" />
          </Button>
          <p className="text-xs text-muted-foreground">
            ¿No lo encuentras? Revisa la carpeta de spam.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              {step === 1 && "Crea tu cuenta"}
              {step === 2 && "¿Dónde juegas?"}
              {step === 3 && "Tu perfil deportivo"}
              {step === 4 && "Tus objetivos"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Paso {step} de {TOTAL_STEPS}
            </p>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i + 1 <= step ? "bg-brand w-6" : "bg-muted w-3"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ─── PASO 1: Cuenta ─── */}
      {step === 1 && (
        <div className="space-y-5">
          <Button
            type="button"
            variant="outline"
            className="w-full h-10"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: `${window.location.origin}/auth/callback`,
                },
              });
            }}
          >
            <svg className="mr-2 size-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar con Google
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">o</span>
            <Separator className="flex-1" />
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                autoComplete="name"
                className="h-10"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="h-10"
                aria-invalid={!!errors.email || !!emailExistsError}
                {...register("email", {
                  onChange: () => setEmailExistsError(null),
                })}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
              {emailExistsError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 flex items-start gap-2">
                  <p className="text-xs text-destructive leading-relaxed flex-1">
                    {emailExistsError}
                  </p>
                  <Link
                    href="/login"
                    className="text-xs font-semibold text-destructive underline underline-offset-2 shrink-0"
                  >
                    Iniciar sesión
                  </Link>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mín. 8 caracteres"
                  autoComplete="new-password"
                  className="h-10 pr-10"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}

              {/* Strength meter */}
              {passwordValue.length > 0 && (
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-all duration-300",
                          bar <= strengthCfg.bars
                            ? strengthCfg.color
                            : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  {strengthCfg.label && (
                    <p
                      className={cn(
                        "text-xs font-medium",
                        strength === 1 && "text-red-500",
                        strength === 2 && "text-orange-400",
                        strength === 3 && "text-yellow-500",
                        strength === 4 && "text-brand"
                      )}
                    >
                      {strengthCfg.label}
                      {strength < 4 && (
                        <span className="text-muted-foreground font-normal">
                          {strength === 1 &&
                            " — añade mayúsculas, números o símbolos"}
                          {strength === 2 &&
                            " — añade más variedad de caracteres"}
                          {strength === 3 &&
                            " — casi perfecta, añade un símbolo"}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-10 pr-10"
                  aria-invalid={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={
                    showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showConfirm ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <Button
            type="button"
            onClick={handleAccountNext}
            className="w-full h-10 bg-brand hover:bg-brand/90 text-brand-foreground font-semibold"
          >
            Continuar <ChevronRight className="size-4 ml-1" />
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="text-foreground font-medium hover:text-brand transition-colors"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      )}

      {/* ─── PASO 2: Ubicación ─── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              ¿En qué ciudad juegas o entrenas?
            </label>
            <Input
              type="text"
              placeholder="Escribe tu ciudad o provincia…"
              value={profile.city}
              onChange={(e) =>
                setProfile((p) => ({ ...p, city: e.target.value }))
              }
              className="h-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_CITIES.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setProfile((p) => ({ ...p, city }))}
                className={cn(
                  "text-sm px-3 py-1.5 rounded-lg border transition-colors",
                  profile.city === city
                    ? "bg-brand/10 border-brand text-brand font-medium"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {city}
              </button>
            ))}
          </div>
          <StepNav onBack={back} onNext={next} canNext={canAdvance()} />
        </div>
      )}

      {/* ─── PASO 3: Rol + Nivel + Experiencia ─── */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Rol */}
          <div className="space-y-2">
            <p className="text-xs font-sans uppercase tracking-[0.22em] text-muted-foreground">
              Rol
            </p>
            <div className="grid gap-2">
              {ROLES.map(({ id, emoji, label, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setProfile((p) => ({
                      ...p,
                      role: id,
                      // reset level if the role switches between coach/non-coach
                      // so the shown scale matches.
                      playerLevel:
                        (p.role === "coach") !== (id === "coach")
                          ? null
                          : p.playerLevel,
                    }))
                  }
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150",
                    profile.role === id
                      ? "bg-brand/10 border-brand ring-1 ring-brand/30"
                      : "border-border hover:bg-muted hover:border-border"
                  )}
                >
                  <span className="text-2xl shrink-0">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-semibold text-sm",
                        profile.role === id ? "text-brand" : "text-foreground"
                      )}
                    >
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {desc}
                    </p>
                  </div>
                  {profile.role === id && (
                    <Check className="size-4 text-brand shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Nivel (condicional) */}
          {profile.role && (
            <div className="space-y-2">
              <p className="text-xs font-sans uppercase tracking-[0.22em] text-muted-foreground">
                {profile.role === "coach" ? "Experiencia" : "Nivel"}
              </p>
              <div className="grid gap-2">
                {levelOptions.map(({ id, label, desc }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      setProfile((p) => ({ ...p, playerLevel: id }))
                    }
                    className={cn(
                      "flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-left transition-all duration-150",
                      profile.playerLevel === id
                        ? "bg-brand/10 border-brand"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <div>
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          profile.playerLevel === id
                            ? "text-brand"
                            : "text-foreground"
                        )}
                      >
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    {profile.playerLevel === id && (
                      <Check className="size-4 text-brand shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Años experiencia (opcional, cuando ya hay nivel) */}
          {profile.playerLevel && (
            <div className="space-y-1.5">
              <p className="text-xs font-sans uppercase tracking-[0.22em] text-muted-foreground">
                Años de experiencia{" "}
                <span className="normal-case tracking-normal text-[11px]">
                  (opcional)
                </span>
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={60}
                  placeholder="0"
                  value={profile.yearsExperience ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      yearsExperience: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    }))
                  }
                  className="w-24 h-10 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground"
                />
                <span className="text-sm text-muted-foreground">años</span>
              </div>
            </div>
          )}

          <StepNav onBack={back} onNext={next} canNext={canAdvance()} />
        </div>
      )}

      {/* ─── PASO 4: Objetivos ─── */}
      {step === 4 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              ¿Qué buscas en tenplanner?
            </label>
            <div className="grid grid-cols-1 gap-2">
              {GOAL_OPTIONS.map((goal) => {
                const selected = selectedGoals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150",
                      selected
                        ? "bg-brand/10 border-brand"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "size-4 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                        selected ? "bg-brand border-brand" : "border-border"
                      )}
                    >
                      {selected && <Check className="size-3 text-white" />}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        selected ? "text-brand" : "text-foreground"
                      )}
                    >
                      {goal}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              Superficie preferida{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SURFACES.map(({ id, emoji, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setProfile((p) => ({
                      ...p,
                      surfacePreference: p.surfacePreference === id ? null : id,
                    }))
                  }
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-150",
                    profile.surfacePreference === id
                      ? "bg-brand/10 border-brand text-brand"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span className="text-lg">{emoji}</span>
                  <span className="text-xs font-medium text-center leading-tight">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-3 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-0.5 size-4 rounded border-border accent-brand"
            />
            <span className="text-muted-foreground leading-snug">
              He leído y acepto la{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noreferrer noopener"
                className="underline text-foreground hover:text-brand"
              >
                política de privacidad
              </a>
              . Entiendo que, si introduzco datos de alumnos, soy responsable
              de informarles y, si son menores de 14 años, de obtener el
              consentimiento parental.
            </span>
          </label>

          {serverError && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={back}
              className="size-10 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
            >
              <ChevronLeft className="size-4" />
            </button>
            <Button
              type="button"
              onClick={submitAll}
              disabled={loading || !privacyAccepted}
              className="flex-1 h-10 bg-brand hover:bg-brand/90 text-brand-foreground font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Creando cuenta…
                </>
              ) : (
                "Crear cuenta y empezar 🎾"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepNav({
  onBack,
  onNext,
  canNext,
}: {
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="size-10 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className="flex-1 h-10 inline-flex items-center justify-center gap-2 bg-brand text-brand-foreground text-sm font-semibold rounded-xl hover:bg-brand/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continuar <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
