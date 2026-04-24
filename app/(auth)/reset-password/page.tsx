"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });

type Values = z.infer<typeof schema>;

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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState<"checking" | "ok" | "missing">(
    "checking"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const passwordValue = watch("password", "");
  const strength = getPasswordStrength(passwordValue);
  const strengthCfg = STRENGTH_CONFIG[strength];

  useEffect(() => {
    // Supabase recovery flow sets a temporary session when the user clicks the
    // email link. Confirm we have one before showing the form.
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setSessionReady(data.session ? "ok" : "missing");
    });
  }, []);

  async function onSubmit(values: Values) {
    setLoading(true);
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });
    if (error) {
      setServerError(error.message);
      setLoading(false);
      return;
    }
    setDone(true);
    setLoading(false);
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  if (sessionReady === "checking") {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sessionReady === "missing") {
    return (
      <div className="space-y-5 text-center">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Enlace no válido
        </h1>
        <p className="text-sm text-muted-foreground">
          Este enlace de recuperación ha caducado o ya se ha utilizado. Solicita
          uno nuevo y vuelve a intentarlo.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center h-10 px-5 rounded-md bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90 transition-colors"
        >
          Pedir enlace nuevo
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-16 rounded-2xl bg-brand/15 flex items-center justify-center">
            <CheckCircle2 className="size-8 text-brand" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Contraseña actualizada
          </h1>
          <p className="text-sm text-muted-foreground">
            Redirigiendo a tu dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground w-fit transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Cancelar
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Nueva contraseña
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Elige una nueva contraseña para tu cuenta.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">Nueva contraseña</Label>
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

          {passwordValue.length > 0 && (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all duration-300",
                      bar <= strengthCfg.bars ? strengthCfg.color : "bg-muted"
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
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirmar contraseña</Label>
          <div className="relative">
            <Input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              className="h-10 pr-10"
              aria-invalid={!!errors.confirm}
              {...register("confirm")}
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
          {errors.confirm && (
            <p className="text-xs text-destructive">{errors.confirm.message}</p>
          )}
        </div>

        {serverError && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
            <p className="text-sm text-destructive">{serverError}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-10 bg-brand hover:bg-brand/90 text-brand-foreground font-semibold"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Actualizando…
            </>
          ) : (
            "Cambiar contraseña"
          )}
        </Button>
      </form>
    </div>
  );
}
