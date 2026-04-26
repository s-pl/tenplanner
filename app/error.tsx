"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TriangleAlertIcon } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/8">
        <TriangleAlertIcon className="size-6 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold">Algo ha fallado</h1>
        <p className="text-muted-foreground text-sm max-w-sm">
          Ha ocurrido un error inesperado. Puedes intentar de nuevo o volver al inicio.
        </p>
        {error.digest && (
          <p className="text-muted-foreground/50 text-xs font-mono">
            Referencia: {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Ir al inicio
        </Button>
        <Button onClick={reset}>Intentar de nuevo</Button>
      </div>
    </div>
  );
}
