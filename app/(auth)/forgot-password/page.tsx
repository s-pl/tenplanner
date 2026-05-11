"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("Introduce un email válido"),
});

type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setLoading(true);
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setServerError(error.message);
      setLoading(false);
      return;
    }
    setSentTo(values.email);
    setLoading(false);
  }

  if (sentTo) {
    return (
      <div className="rounded-[32px] border border-[#050505]/10 bg-white p-5 text-center shadow-[0_28px_90px_-50px_rgba(5,5,5,0.65)] dark:border-white/10 dark:bg-[#10100e] sm:p-7">
        <div className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <CheckCircle2 className="size-8" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black leading-tight text-foreground">
              Enlace enviado
            </h1>
            <p className="text-sm text-muted-foreground">
              Si existe una cuenta asociada a
            </p>
            <p className="text-sm font-semibold text-foreground break-all px-2">
              {sentTo}
            </p>
            <p className="text-sm text-muted-foreground">
              recibirás un correo con un enlace para restablecer la contraseña.
            </p>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#050505]/10 bg-[#F4F4F1] px-5 py-4 text-left dark:border-white/10 dark:bg-white/[0.04]">
          <p className="text-xs font-semibold text-foreground mb-1.5">
            ¿No lo encuentras?
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>Revisa la carpeta de spam.</li>
            <li>El enlace caduca en 1 hora.</li>
            <li>Puedes volver a pedir uno nuevo desde aquí.</li>
          </ul>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-black text-foreground transition-colors hover:text-brand"
        >
          <ArrowLeft className="size-4" /> Volver a iniciar sesión
        </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[32px] border border-[#050505]/10 bg-white p-5 shadow-[0_28px_90px_-50px_rgba(5,5,5,0.65)] dark:border-white/10 dark:bg-[#10100e] sm:p-7">
      <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground w-fit transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Volver
        </Link>
        <div>
          <p className="tp-kicker">Recuperación</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-foreground">
            Recuperar contraseña
          </h1>
          <p className="mt-2 text-sm leading-6 text-foreground/62">
            Introduce tu email y te enviaremos un enlace para crear una nueva.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="h-10 pl-9"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {serverError && (
          <div className="rounded-[22px] border border-destructive/20 bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">{serverError}</p>
          </div>
        )}

        <Button
          type="submit"
          className="h-11 w-full rounded-full bg-brand font-black text-brand-foreground hover:bg-brand/90"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Enviando…
            </>
          ) : (
            "Enviar enlace de recuperación"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya la recuerdas?{" "}
        <Link
          href="/login"
          className="text-foreground font-medium hover:text-brand transition-colors"
        >
          Iniciar sesión
        </Link>
      </p>
      </div>
    </div>
  );
}
