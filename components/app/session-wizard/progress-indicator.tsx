"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  step: number;
  total: number;
  labels: string[];
}

export function ProgressIndicator({ step, total, labels }: ProgressIndicatorProps) {
  return (
    <div className="flex items-start">
      {Array.from({ length: total }).map((_, i) => {
        const idx = i + 1;
        const isDone = idx < step;
        const isCurrent = idx === step;

        return (
          <div key={i} className="flex items-start">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "size-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300",
                  isDone
                    ? "border-brand bg-brand text-brand-foreground shadow-sm"
                    : isCurrent
                    ? "border-brand bg-brand/10 text-brand ring-4 ring-brand/15"
                    : "border-border bg-background text-muted-foreground"
                )}
              >
                {isDone ? <Check className="size-4" strokeWidth={3} /> : idx}
              </div>
              <p
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                  isCurrent
                    ? "text-foreground"
                    : isDone
                    ? "text-brand"
                    : "text-muted-foreground"
                )}
              >
                {labels[i]}
              </p>
            </div>
            {i < total - 1 && (
              <div
                className={cn(
                  "h-0.5 w-12 shrink-0 self-start mt-5 mx-2 rounded-full transition-colors duration-500",
                  isDone ? "bg-brand" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
