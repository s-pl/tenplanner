"use client";

import type { ElementType } from "react";
import { useMemo, useState } from "react";
import {
  Bot,
  Check,
  Database,
  Loader2,
  Palette,
  Save,
  Settings2,
  Shield,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AI_MODEL_OPTIONS } from "@/lib/ai/model-options";
import type { SettingCategory, SettingType } from "@/lib/app-settings";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface AdminSetting {
  key: string;
  value: unknown;
  defaultValue: unknown;
  type: SettingType;
  label: string;
  description: string;
  category: SettingCategory;
  isPublic: boolean;
}

interface Props {
  settings: AdminSetting[];
}

const categoryIcon: Record<SettingCategory, ElementType> = {
  Funciones: SlidersHorizontal,
  IA: Bot,
  Sistema: Shield,
  Marca: Palette,
};

const settingOptions: Record<
  string,
  Array<{ value: string; label: string }>
> = {
  "ai.chat_provider": [{ value: "anthropic", label: "Anthropic" }],
  "ai.dr_planner_model": AI_MODEL_OPTIONS.map((model) => ({
    value: model.id,
    label: model.label,
  })),
  "ai.reasoning_model": AI_MODEL_OPTIONS.map((model) => ({
    value: model.id,
    label: model.label,
  })),
  "ai.fallback_model": AI_MODEL_OPTIONS.map((model) => ({
    value: model.id,
    label: model.label,
  })),
};

const multilineSettings = new Set([
  "ai.restriction_default_message",
  "system.maintenance_banner",
]);

type PriceField = "input" | "output" | "cacheWrite" | "cacheRead";
type PriceRow = Record<PriceField, string> & {
  model: string;
  label: string;
};

const priceFields: Array<{ key: PriceField; label: string }> = [
  { key: "input", label: "Input" },
  { key: "output", label: "Output" },
  { key: "cacheWrite", label: "Cache write" },
  { key: "cacheRead", label: "Cache read" },
];

function parsePricingRows(value: unknown): PriceRow[] {
  const modelLabels = new Map<string, string>(
    AI_MODEL_OPTIONS.map((model) => [model.id, model.label])
  );
  let parsed: unknown = {};

  try {
    parsed =
      typeof value === "string" && value.trim().length > 0
        ? JSON.parse(value)
        : {};
  } catch {
    parsed = {};
  }

  const pricing =
    parsed && typeof parsed === "object"
      ? (parsed as Record<string, Partial<Record<PriceField, unknown>>>)
      : {};
  const modelIds = Array.from(
    new Set([
      ...AI_MODEL_OPTIONS.map((model) => model.id),
      ...Object.keys(pricing),
    ])
  );

  return modelIds.map((model) => {
    const row = pricing[model] ?? {};
    return {
      model,
      label: modelLabels.get(model) ?? model,
      input: String(typeof row.input === "number" ? row.input : ""),
      output: String(typeof row.output === "number" ? row.output : ""),
      cacheWrite: String(
        typeof row.cacheWrite === "number" ? row.cacheWrite : ""
      ),
      cacheRead: String(typeof row.cacheRead === "number" ? row.cacheRead : ""),
    };
  });
}

function stringifyPricingRows(rows: PriceRow[]) {
  return JSON.stringify(
    Object.fromEntries(
      rows.map((row) => [
        row.model,
        Object.fromEntries(
          priceFields.map((field) => [
            field.key,
            Number.isFinite(Number(row[field.key]))
              ? Number(row[field.key])
              : 0,
          ])
        ),
      ])
    )
  );
}

function PricingJsonEditor({
  value,
  isSaving,
  isSaved,
  onSave,
}: {
  value: unknown;
  isSaving: boolean;
  isSaved: boolean;
  onSave: (value: string) => void;
}) {
  const [rows, setRows] = useState(() => parsePricingRows(value));

  function updatePrice(model: string, field: PriceField, nextValue: string) {
    setRows((current) =>
      current.map((row) =>
        row.model === model ? { ...row, [field]: nextValue } : row
      )
    );
  }

  return (
    <div className="w-full min-w-0 sm:min-w-[560px]">
      <div className="overflow-x-auto rounded-lg border border-foreground/12 bg-background">
        <div className="min-w-[34rem]">
          <div className="grid grid-cols-[minmax(9rem,1fr)_repeat(4,minmax(4.5rem,5.5rem))] gap-2 border-b border-foreground/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/40">
            <span>Modelo</span>
            {priceFields.map((field) => (
              <span key={field.key} className="text-right">
                {field.label}
              </span>
            ))}
          </div>
          <div className="flex max-h-[19rem] flex-col overflow-y-auto">
            {rows.map((row) => (
              <div
                key={row.model}
                className="grid grid-cols-[minmax(9rem,1fr)_repeat(4,minmax(4.5rem,5.5rem))] items-center gap-2 border-b border-foreground/8 px-3 py-2 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {row.label}
                  </p>
                  <p className="truncate font-mono text-[10px] text-foreground/35">
                    {row.model}
                  </p>
                </div>
                {priceFields.map((field) => (
                  <Input
                    key={field.key}
                    aria-label={`${field.label} ${row.label}`}
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    type="number"
                    value={row[field.key]}
                    onChange={(event) =>
                      updatePrice(row.model, field.key, event.target.value)
                    }
                    className="h-8 text-right font-mono text-xs"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-foreground/45">USD por millón de tokens.</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isSaving}
          onClick={() => onSave(stringifyPricingRows(rows))}
        >
          {isSaving ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : isSaved ? (
            <Check data-icon="inline-start" />
          ) : (
            <Save data-icon="inline-start" />
          )}
          Guardar precios
        </Button>
      </div>
    </div>
  );
}

function formatValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Activo" : "Bloqueado";
  if (typeof value === "number") return value.toLocaleString("es-ES");
  if (typeof value === "string") return value || "Sin texto";
  return "Sin valor";
}

export function AdminSettingsClient({ settings: initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialSettings
        .filter((setting) => setting.type !== "boolean")
        .map((setting) => [setting.key, String(setting.value ?? "")])
    )
  );

  const grouped = useMemo(() => {
    const map = new Map<SettingCategory, AdminSetting[]>();
    for (const setting of settings) {
      const current = map.get(setting.category) ?? [];
      current.push(setting);
      map.set(setting.category, current);
    }
    return Array.from(map.entries());
  }, [settings]);

  async function saveSetting(setting: AdminSetting, nextValue: unknown) {
    setSavingKey(setting.key);
    setError(null);
    setSavedKey(null);
    const previous = settings;
    setSettings((current) =>
      current.map((item) =>
        item.key === setting.key ? { ...item, value: nextValue } : item
      )
    );

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: setting.key, value: nextValue }),
      });
      if (!res.ok) throw new Error("No se pudo guardar el ajuste.");
      setSavedKey(setting.key);
      window.setTimeout(() => setSavedKey(null), 1200);
    } catch (err) {
      setSettings(previous);
      setError(err instanceof Error ? err.message : "Error guardando ajuste.");
    } finally {
      setSavingKey(null);
    }
  }

  function parseDraft(setting: AdminSetting) {
    const draft = drafts[setting.key] ?? "";
    if (setting.type === "number") {
      const parsed = Number(draft);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return draft.trim();
  }

  const booleanCount = settings.filter(
    (setting) => setting.type === "boolean"
  ).length;
  const enabledCount = settings.filter(
    (setting) => setting.value === true
  ).length;

  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-foreground/12 bg-card p-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-foreground/40">
            Flags activos
          </p>
          <p className="mt-2 font-heading text-3xl text-foreground">
            {enabledCount}/{booleanCount}
          </p>
        </div>
        <div className="rounded-lg border border-foreground/12 bg-card p-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-foreground/40">
            Índice IA
          </p>
          <p className="mt-2 flex items-center gap-2 font-heading text-lg text-foreground">
            <Database className="size-4 text-brand" />
            pgvector preparado
          </p>
        </div>
        <div className="rounded-lg border border-foreground/12 bg-card p-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-foreground/40">
            Dr. Planner
          </p>
          <p className="mt-2 font-heading text-lg text-foreground">
            {formatValue(
              settings.find(
                (setting) => setting.key === "feature.dr_planner_enabled"
              )?.value
            )}
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {grouped.map(([category, items]) => {
        const Icon = categoryIcon[category] ?? Settings2;
        return (
          <section
            key={category}
            className="overflow-hidden rounded-lg border border-foreground/12 bg-card"
          >
            <div className="flex items-center justify-between gap-4 border-b border-foreground/10 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-md border border-brand/20 bg-brand/8 text-brand">
                  <Icon className="size-4" />
                </span>
                <h2 className="font-heading text-base font-semibold text-foreground">
                  {category}
                </h2>
              </div>
              <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-foreground/40">
                {items.length} ajustes
              </span>
            </div>

            <div className="divide-y divide-foreground/10">
              {items.map((setting) => {
                const isSaving = savingKey === setting.key;
                const isSaved = savedKey === setting.key;
                const parsedDraft = parseDraft(setting);
                const options = settingOptions[setting.key];
                const isMultiline = multilineSettings.has(setting.key);
                const canSaveDraft =
                  setting.type !== "boolean" &&
                  parsedDraft !== null &&
                  parsedDraft !== setting.value;

                return (
                  <div
                    key={setting.key}
                    className="grid gap-4 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">
                          {setting.label}
                        </h3>
                        {setting.isPublic ? (
                          <span className="rounded border border-brand/20 bg-brand/8 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                            Público
                          </span>
                        ) : (
                          <span className="rounded border border-foreground/12 px-1.5 py-0.5 text-[10px] font-medium text-foreground/45">
                            Interno
                          </span>
                        )}
                      </div>
                      <p className="mt-1 max-w-2xl text-xs leading-relaxed text-foreground/55">
                        {setting.description}
                      </p>
                      <p className="mt-2 font-mono text-[10px] text-foreground/35">
                        {setting.key}
                      </p>
                    </div>

                    {setting.type === "boolean" ? (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={setting.value === true}
                        disabled={isSaving}
                        onClick={() =>
                          saveSetting(setting, setting.value !== true)
                        }
                        className={cn(
                          "grid min-w-[136px] grid-cols-[auto_1fr] items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors disabled:opacity-60",
                          setting.value === true
                            ? "border-brand/35 bg-brand/10 text-brand"
                            : "border-foreground/15 bg-background text-foreground/55"
                        )}
                      >
                        <span
                          className={cn(
                            "relative h-5 w-9 rounded-full transition-colors",
                            setting.value === true
                              ? "bg-brand"
                              : "bg-foreground/18"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 size-4 rounded-full bg-background transition-transform",
                              setting.value === true
                                ? "translate-x-4"
                                : "translate-x-0.5"
                            )}
                          />
                        </span>
                        <span className="flex items-center justify-between gap-2 text-xs font-semibold">
                          {isSaving ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : isSaved ? (
                            <Check className="size-3" />
                          ) : null}
                          {formatValue(setting.value)}
                        </span>
                      </button>
                    ) : setting.key === "ai.pricing_json" ? (
                      <PricingJsonEditor
                        value={setting.value}
                        isSaving={isSaving}
                        isSaved={isSaved}
                        onSave={(value) => saveSetting(setting, value)}
                      />
                    ) : options ? (
                      <div className="flex min-w-0 items-center gap-2 sm:min-w-[280px]">
                        <Select
                          value={
                            drafts[setting.key] ?? String(setting.value ?? "")
                          }
                          onValueChange={(value) => {
                            setDrafts((current) => ({
                              ...current,
                              [setting.key]: value ?? "",
                            }));
                            void saveSetting(setting, value);
                          }}
                        >
                          <SelectTrigger className="w-full sm:w-[280px]">
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {options.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <span className="flex size-8 shrink-0 items-center justify-center text-brand">
                          {isSaving ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : isSaved ? (
                            <Check className="size-3" />
                          ) : null}
                        </span>
                      </div>
                    ) : isMultiline ? (
                      <div className="flex min-w-0 flex-col gap-2 sm:min-w-[360px]">
                        <Textarea
                          rows={setting.key === "ai.pricing_json" ? 5 : 3}
                          value={drafts[setting.key] ?? ""}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [setting.key]: event.target.value,
                            }))
                          }
                          className="font-mono text-xs"
                        />
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!canSaveDraft || isSaving}
                            onClick={() =>
                              parsedDraft !== null &&
                              saveSetting(setting, parsedDraft)
                            }
                          >
                            {isSaving ? (
                              <Loader2
                                data-icon="inline-start"
                                className="animate-spin"
                              />
                            ) : isSaved ? (
                              <Check data-icon="inline-start" />
                            ) : null}
                            Guardar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-w-0 gap-2 sm:min-w-[280px]">
                        <input
                          type={setting.type === "number" ? "number" : "text"}
                          value={drafts[setting.key] ?? ""}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [setting.key]: event.target.value,
                            }))
                          }
                          className="h-10 min-w-0 flex-1 rounded-lg border border-foreground/15 bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-brand/50"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!canSaveDraft || isSaving}
                          onClick={() =>
                            parsedDraft !== null &&
                            saveSetting(setting, parsedDraft)
                          }
                        >
                          {isSaving ? (
                            <Loader2
                              data-icon="inline-start"
                              className="animate-spin"
                            />
                          ) : isSaved ? (
                            <Check data-icon="inline-start" />
                          ) : null}
                          Guardar
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
