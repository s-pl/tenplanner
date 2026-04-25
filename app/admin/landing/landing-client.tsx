"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Field {
  key: string;
  label: string;
  type: "text" | "textarea";
  currentValue: string;
}

export function AdminLandingClient({ fields }: { fields: Field[] }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, f.currentValue]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function save(key: string) {
    setSaving(key);
    try {
      const res = await fetch("/api/admin/landing-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: values[key] }),
      });
      if (!res.ok) throw new Error();
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
      toast.success("Guardado");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      {fields.map((field) => {
        const isDirty = values[field.key] !== field.currentValue;
        const isSaving = saving === field.key;
        const isSaved = saved === field.key;

        return (
          <div
            key={field.key}
            className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <label className="font-sans text-[10px] uppercase tracking-[0.18em] text-foreground/50">
                {field.label}
              </label>
              {isDirty && (
                <button
                  onClick={() => void save(field.key)}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand text-background px-3 py-1.5 text-[12px] font-semibold hover:bg-brand/90 disabled:opacity-60 transition-colors"
                >
                  {isSaving ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : isSaved ? (
                    <Check className="size-3" />
                  ) : null}
                  Guardar
                </button>
              )}
            </div>

            {field.type === "textarea" ? (
              <Textarea
                value={values[field.key]}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                rows={3}
                className="resize-none bg-background border-foreground/15 text-sm text-foreground placeholder:text-foreground/30 focus-visible:ring-brand/30"
              />
            ) : (
              <input
                type="text"
                value={values[field.key]}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                className="w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand/50"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
