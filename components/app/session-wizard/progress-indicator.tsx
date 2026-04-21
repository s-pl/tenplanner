"use client";

import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  step: number;
  total: number;
  labels: string[];
}

export function ProgressIndicator({ step, total, labels }: ProgressIndicatorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Paso {step} de {total}
        </p>
        <p className="text-sm font-semibold text-foreground">{labels[step - 1]}</p>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < step ? "bg-brand" : "bg-border"
            )}
          />
        ))}
      </div>
    </div>
  );
}
