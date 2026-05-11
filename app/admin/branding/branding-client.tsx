"use client";

import { useState } from "react";
import {
  Check,
  Loader2,
  Save,
  Globe,
  Mail,
  Palette,
  Type,
  AlertTriangle,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AccentColor } from "@/lib/accent-colors";
import { adminPanelClass } from "../_components/admin-ui";

interface Props {
  appName: string;
  appTagline: string;
  supportEmail: string;
  defaultAccent: string;
  ogImageUrl: string;
  maintenanceBanner: string;
  accentColors: AccentColor[];
}

type SavedState = Record<string, boolean>;
type SavingState = Record<string, boolean>;

async function saveSetting(key: string, value: unknown) {
  const res = await fetch("/api/admin/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "No se pudo guardar.");
  }
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Type;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-foreground/10 px-5 py-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-[#D6FF38]/35 bg-[#D6FF38]/14 text-[#6F8500] dark:text-[#D6FF38]">
        <Icon className="size-4" />
      </span>
      <div>
        <h2 className="font-heading text-sm font-semibold text-foreground">
          {title}
        </h2>
        <p className="text-xs text-foreground/50">{description}</p>
      </div>
    </div>
  );
}

function SaveButton({
  settingKey,
  saving,
  saved,
  disabled,
  onClick,
}: {
  settingKey: string;
  saving: SavingState;
  saved: SavedState;
  disabled?: boolean;
  onClick: () => void;
}) {
  const isSaving = saving[settingKey];
  const isSaved = saved[settingKey];
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={disabled || isSaving}
      onClick={onClick}
    >
      {isSaving ? (
        <Loader2 data-icon="inline-start" className="animate-spin" />
      ) : isSaved ? (
        <Check data-icon="inline-start" />
      ) : (
        <Save data-icon="inline-start" />
      )}
      Guardar
    </Button>
  );
}

export function AdminBrandingClient({
  appName: initialAppName,
  appTagline: initialTagline,
  supportEmail: initialEmail,
  defaultAccent: initialAccent,
  ogImageUrl: initialOgUrl,
  maintenanceBanner: initialBanner,
  accentColors,
}: Props) {
  const [appName, setAppName] = useState(initialAppName);
  const [appTagline, setAppTagline] = useState(initialTagline);
  const [supportEmail, setSupportEmail] = useState(initialEmail);
  const [defaultAccent, setDefaultAccent] = useState(initialAccent);
  const [ogImageUrl, setOgImageUrl] = useState(initialOgUrl);
  const [maintenanceBanner, setMaintenanceBanner] = useState(initialBanner);
  const [saving, setSaving] = useState<SavingState>({});
  const [saved, setSaved] = useState<SavedState>({});
  const [error, setError] = useState<string | null>(null);

  async function save(key: string, value: unknown) {
    setSaving((s) => ({ ...s, [key]: true }));
    setError(null);
    try {
      await saveSetting(key, value);
      setSaved((s) => ({ ...s, [key]: true }));
      window.setTimeout(() => setSaved((s) => ({ ...s, [key]: false })), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  }

  async function saveAccent(id: string) {
    setDefaultAccent(id);
    await save("brand.default_accent", id);
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Identity */}
      <section className={adminPanelClass}>
        <SectionHeader
          icon={Type}
          title="Identidad"
          description="Nombre y subtítulo que aparecen en el sidebar y en la cabecera de la app."
        />
        <div className="divide-y divide-foreground/10">
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Nombre de la app
              </p>
              <p className="mt-0.5 text-xs text-foreground/50">
                Aparece en el sidebar, metadata y correos automáticos.
              </p>
            </div>
            <div className="flex items-center gap-2 sm:min-w-[300px]">
              <Input
                value={appName}
                maxLength={40}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="TenPlanner"
                className="flex-1"
              />
              <SaveButton
                settingKey="brand.app_name"
                saving={saving}
                saved={saved}
                disabled={!appName.trim() || appName === initialAppName}
                onClick={() => save("brand.app_name", appName.trim())}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Subtítulo</p>
              <p className="mt-0.5 text-xs text-foreground/50">
                Frase breve bajo el nombre en la navegación lateral.
              </p>
            </div>
            <div className="flex items-center gap-2 sm:min-w-[300px]">
              <Input
                value={appTagline}
                maxLength={60}
                onChange={(e) => setAppTagline(e.target.value)}
                placeholder="Planificador de deportes de raqueta"
                className="flex-1"
              />
              <SaveButton
                settingKey="brand.app_tagline"
                saving={saving}
                saved={saved}
                disabled={appTagline === initialTagline}
                onClick={() => save("brand.app_tagline", appTagline.trim())}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Color */}
      <section className={adminPanelClass}>
        <SectionHeader
          icon={Palette}
          title="Color de marca"
          description="Color accent por defecto para usuarios nuevos o que no hayan elegido uno."
        />
        <div className="px-5 py-5">
          <div className="flex flex-wrap gap-3">
            {accentColors.map((color) => {
              const isSelected = defaultAccent === color.id;
              return (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => saveAccent(color.id)}
                  disabled={saving["brand.default_accent"]}
                  className={cn(
                    "group relative flex flex-col items-center gap-2 rounded-lg border px-4 py-3 transition-all",
                    isSelected
                      ? "border-[#D6FF38] bg-[#D6FF38]/14"
                      : "border-foreground/12 hover:border-foreground/30"
                  )}
                >
                  <span
                    className="size-8 rounded-full shadow-sm ring-2 ring-offset-2"
                    style={{
                      backgroundColor: color.preview,
                    }}
                  />
                  <span className="text-xs font-medium text-foreground/70">
                    {color.label}
                  </span>
                  {isSelected && (
                    <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-[#D6FF38] text-[#050505]">
                      <Check className="size-2.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {saved["brand.default_accent"] && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-brand">
              <Check className="size-3" />
              Color guardado correctamente.
            </p>
          )}
        </div>
      </section>

      {/* Contact */}
      <section className={adminPanelClass}>
        <SectionHeader
          icon={Mail}
          title="Contacto"
          description="Email de soporte mostrado en mensajes de restricción y pantallas de error."
        />
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Email de soporte
            </p>
            <p className="mt-0.5 text-xs text-foreground/50">
              Deja vacío para no mostrar enlace de contacto.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:min-w-[300px]">
            <Input
              type="email"
              value={supportEmail}
              maxLength={100}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="soporte@tudominio.com"
              className="flex-1"
            />
            <SaveButton
              settingKey="brand.support_email"
              saving={saving}
              saved={saved}
              disabled={supportEmail === initialEmail}
              onClick={() => save("brand.support_email", supportEmail.trim())}
            />
          </div>
        </div>
      </section>

      {/* Social / SEO */}
      <section className={adminPanelClass}>
        <SectionHeader
          icon={Globe}
          title="Social y SEO"
          description="Metadatos Open Graph para compartir en redes sociales."
        />
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              OG Image URL
            </p>
            <p className="mt-0.5 text-xs text-foreground/50">
              URL absoluta de imagen 1200×630 px. Vacío usa el favicon.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:min-w-[300px]">
            <Input
              type="url"
              value={ogImageUrl}
              maxLength={300}
              onChange={(e) => setOgImageUrl(e.target.value)}
              placeholder="https://…/og.png"
              className="flex-1"
            />
            <SaveButton
              settingKey="brand.og_image_url"
              saving={saving}
              saved={saved}
              disabled={ogImageUrl === initialOgUrl}
              onClick={() => save("brand.og_image_url", ogImageUrl.trim())}
            />
          </div>
        </div>
        {ogImageUrl.trim() && (
          <div className="border-t border-foreground/10 px-5 py-4">
            <p className="mb-2 text-xs font-medium text-foreground/50">
              Vista previa OG
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ogImageUrl}
              alt="OG preview"
              className="h-24 w-auto rounded-lg border border-foreground/12 object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </section>

      {/* Maintenance */}
      <section className={adminPanelClass}>
        <SectionHeader
          icon={AlertTriangle}
          title="Aviso global"
          description="Banner visible en la app para todos los usuarios. Vacío para ocultarlo."
        />
        <div className="flex flex-col gap-3 px-5 py-5">
          <Textarea
            rows={3}
            value={maintenanceBanner}
            maxLength={280}
            onChange={(e) => setMaintenanceBanner(e.target.value)}
            placeholder="⚠️ Realizando mantenimiento el sábado 3 de mayo de 20:00 a 22:00."
            className="text-sm"
          />
          {maintenanceBanner.trim() && (
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              {maintenanceBanner}
            </div>
          )}
          <div className="flex justify-end">
            <SaveButton
              settingKey="system.maintenance_banner"
              saving={saving}
              saved={saved}
              disabled={maintenanceBanner === initialBanner}
              onClick={() =>
                save("system.maintenance_banner", maintenanceBanner.trim())
              }
            />
          </div>
        </div>
      </section>

      {/* Preview sidebar */}
      <section className={adminPanelClass}>
        <SectionHeader
          icon={Image}
          title="Preview del sidebar"
          description="Así verán los usuarios el nombre en la navegación lateral."
        />
        <div className="px-5 py-5">
          <div className="inline-flex w-48 flex-col rounded-lg border border-foreground/12 bg-background/80 p-3 shadow-sm">
            <div className="mb-3 border-b border-foreground/10 pb-3">
              <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/40">
                {appName || "TenPlanner"}
              </p>
              <p className="mt-0.5 font-heading text-sm font-semibold text-foreground">
                {appTagline || "Planificador de deportes de raqueta"}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              {["Inicio", "Sesiones", "Alumnos"].map((item) => (
                <div
                  key={item}
                  className="flex h-6 items-center rounded-md bg-foreground/5 px-2"
                >
                  <span className="text-[10px] text-foreground/40">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
