"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Escribe tu nombre"),
    email: z.string().trim().email("Email no valido"),
    password: z.string().min(8, "Minimo 8 caracteres"),
    confirmPassword: z.string(),
    accepted: z
      .boolean()
      .refine(Boolean, "Debes aceptar las condiciones para crear la cuenta"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contrasenas no coinciden",
  });

type RegisterForm = z.infer<typeof registerSchema>;

const initialForm: RegisterForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  accepted: false,
};

function isAlreadyRegisteredMessage(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("already registered") || lower.includes("already exists");
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  function update<K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function setExistingEmailError() {
    setFieldErrors((prev) => ({
      ...prev,
      email:
        "Ya existe una cuenta con este correo. Entra o recupera la contrasena.",
    }));
    setError("Ese email ya esta registrado en TenPlanner.");
  }

  async function resendConfirmation() {
    if (!confirmationEmail) return;
    setResending(true);
    setResendSent(false);
    setResendError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: confirmationEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setResendError(
        "No se pudo reenviar el correo. Prueba de nuevo en unos minutos."
      );
    } else {
      setResendSent(true);
    }
    setResending(false);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setConfirmationEmail(null);
    setResendSent(false);
    setResendError(null);

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            String(issue.path[0] ?? "form"),
            issue.message,
          ])
        )
      );
      return;
    }

    const email = parsed.data.email.trim().toLowerCase();
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: parsed.data.name,
            role: "coach",
          },
        },
      });

      if (signUpError) {
        if (isAlreadyRegisteredMessage(signUpError.message)) {
          setExistingEmailError();
        } else {
          setError(signUpError.message);
        }
        return;
      }

      const identities = data.user?.identities;
      if (Array.isArray(identities) && identities.length === 0) {
        setExistingEmailError();
        return;
      }

      if (data.user && data.session?.access_token && data.user.email) {
        await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({
            id: data.user.id,
            name: parsed.data.name,
            email: data.user.email,
            role: "coach",
          }),
        });
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setConfirmationEmail(email);
      setForm((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmationEmail) {
    return (
      <div className="w-full rounded-[32px] border border-[#050505]/10 bg-white p-5 text-center shadow-[0_28px_90px_-50px_rgba(5,5,5,0.65)] dark:border-white/10 dark:bg-[#10100e] sm:p-7">
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-brand text-brand-foreground">
              <CheckCircle2 className="size-8" />
            </div>
            <div>
              <p className="tp-kicker">Cuenta creada</p>
              <h1 className="mt-3 text-3xl font-black leading-tight text-foreground">
                Confirma tu correo
              </h1>
              <p className="mt-3 text-sm leading-6 text-foreground/62">
                Hemos enviado un enlace de verificacion a{" "}
                <span className="break-all font-black text-foreground">
                  {confirmationEmail}
                </span>
                . Cuando lo confirmes podras iniciar sesion.
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-brand/30 bg-brand/10 px-5 py-4 text-left">
            <p className="text-xs font-black uppercase text-foreground">
              Si no aparece
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              <li>Revisa spam o promociones.</li>
              <li>Comprueba que el email esta bien escrito.</li>
              <li>Puedes reenviar el enlace desde aqui.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={resendConfirmation}
              disabled={resending}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-foreground/10 px-4 text-sm font-black text-foreground transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
            >
              {resending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              Reenviar correo
            </button>
            <Link
              href={`/login?message=check_email&email=${encodeURIComponent(
                confirmationEmail
              )}`}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-brand px-4 text-sm font-black text-brand-foreground transition-colors hover:bg-brand/90"
            >
              Ir al login
            </Link>
          </div>

          {resendSent && (
            <p className="text-xs font-bold text-foreground/70">
              Correo reenviado.
            </p>
          )}
          {resendError && (
            <p className="text-xs text-destructive">{resendError}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[32px] border border-[#050505]/10 bg-white p-5 shadow-[0_28px_90px_-50px_rgba(5,5,5,0.65)] dark:border-white/10 dark:bg-[#10100e] sm:p-7">
      <div>
        <p className="tp-kicker">Acceso anticipado</p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-foreground">
          Crear cuenta de entrenador
        </h1>
        <p className="mt-2 text-sm leading-6 text-foreground/62">
          Alta minima para empezar a ordenar sesiones, alumnos y biblioteca.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            autoComplete="name"
            aria-invalid={!!fieldErrors.name}
          />
          {fieldErrors.name && (
            <p className="text-xs text-destructive">{fieldErrors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            autoComplete="email"
            aria-invalid={!!fieldErrors.email}
          />
          {fieldErrors.email && (
            <p className="text-xs text-destructive">{fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contrasena</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              autoComplete="new-password"
              className="pr-10"
              aria-invalid={!!fieldErrors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={showPassword ? "Ocultar contrasena" : "Ver contrasena"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-destructive">{fieldErrors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            autoComplete="new-password"
            aria-invalid={!!fieldErrors.confirmPassword}
          />
          {fieldErrors.confirmPassword && (
            <p className="text-xs text-destructive">
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        <label className="flex items-start gap-3 rounded-[22px] border border-[#050505]/10 bg-[#F4F4F1] p-3 text-sm text-foreground/62 dark:border-white/10 dark:bg-white/[0.04]">
          <input
            type="checkbox"
            checked={form.accepted}
            onChange={(e) => update("accepted", e.target.checked)}
            className="mt-1"
          />
          <span>
            Acepto la{" "}
            <Link href="/privacidad" className="font-semibold text-brand">
              privacidad
            </Link>{" "}
            y los{" "}
            <Link href="/terminos" className="font-semibold text-brand">
              terminos
            </Link>
            .
          </span>
        </label>
        {fieldErrors.accepted && (
          <p className="text-xs text-destructive">{fieldErrors.accepted}</p>
        )}

        {error && (
          <div className="rounded-[22px] border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className="h-11 w-full rounded-full font-black"
        >
          {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          Crear cuenta
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-brand">
          Entrar
        </Link>
      </p>
    </div>
  );
}
