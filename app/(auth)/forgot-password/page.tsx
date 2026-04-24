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
      <div className="space-y-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-16 rounded-2xl bg-brand/15 flex items-center justify-center">
            <CheckCircle2 className="size-8 text-brand" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
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

        <div className="rounded-xl border border-border bg-muted/40 px-5 py-4 text-left">
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
          className="inline-flex items-center gap-1.5 text-sm text-foreground font-medium hover:text-brand transition-colors"
        >
          <ArrowLeft className="size-4" /> Volver a iniciar sesión
        </Link>
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
          <ArrowLeft className="size-3.5" /> Volver
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Recuperar contraseña
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
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
  );
}
