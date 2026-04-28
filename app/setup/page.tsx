"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SetupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleBootstrap() {
    setStatus("loading");
    try {
      const res = await fetch("/api/admin/bootstrap", { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok || data.error) {
        setMessage(data.error ?? "Error inesperado.");
        setStatus("error");
      } else {
        setMessage(data.message ?? "Listo.");
        setStatus("done");
        setTimeout(() => router.push("/admin"), 1800);
      }
    } catch {
      setMessage("No se pudo contactar con el servidor.");
      setStatus("error");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-brand/30 bg-brand/10">
          <Shield className="size-7 text-brand" />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Configuración inicial
          </h1>
          <p className="text-sm text-foreground/55">
            Ningún administrador detectado. Haz clic para convertirte en el
            primer administrador de la plataforma.
          </p>
          <p className="text-xs text-foreground/35">
            Este botón se desactiva automáticamente en cuanto existe un admin.
          </p>
        </div>

        {status === "idle" && (
          <Button className="w-full" onClick={handleBootstrap}>
            Hacerme administrador
          </Button>
        )}

        {status === "loading" && (
          <Button className="w-full" disabled>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Configurando…
          </Button>
        )}

        {status === "done" && (
          <div className="rounded-xl border border-brand/25 bg-brand/8 px-4 py-4">
            <div className="flex items-center gap-2 justify-center text-brand">
              <CheckCircle2 className="size-4 shrink-0" />
              <p className="text-sm font-medium">{message}</p>
            </div>
            <p className="mt-1 text-xs text-foreground/50">
              Redirigiendo al panel…
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-4">
            <div className="flex items-center gap-2 justify-center text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <p className="text-sm font-medium">{message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
