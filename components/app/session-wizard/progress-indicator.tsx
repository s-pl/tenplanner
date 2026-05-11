"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  step: number;
  total: number;
  labels: string[];
}

export function ProgressIndicator({
  step,
  total,
  labels,
}: ProgressIndicatorProps) {
  return (
    <div className="flex items-start rounded-full border border-foreground/10 bg-[#F4F4F1] p-2 dark:bg-[#050505]/70">
      {Array.from({ length: total }).map((_, i) => {
        const idx = i + 1;
        const isDone = idx < step;
        const isCurrent = idx === step;

        return (
          <div key={i} className="flex items-start">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border text-sm font-bold transition-colors",
                  isDone
                    ? "border-[#D6FF38] bg-[#D6FF38] text-[#050505]"
                    : isCurrent
                      ? "border-[#D6FF38]/70 bg-[#D6FF38]/15 text-foreground"
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
                  "mx-2 mt-4 h-px w-12 shrink-0 self-start transition-colors",
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
