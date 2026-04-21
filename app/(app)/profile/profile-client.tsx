"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ACCENT_COLORS, applyAccentColor, applyFontSize } from "@/lib/accent-colors";
import { ThemeToggle } from "@/components/app/theme-toggle";
import {
  Mail, Trash2, CheckCircle2, FileJson, FileText, Loader2, Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { id: "coach",  label: "Entrenador" },
  { id: "player", label: "Jugador" },
  { id: "both",   label: "Entrenador & Jugador" },
];

const LEVELS = [
  { id: "beginner",     label: "Principiante" },
  { id: "intermediate", label: "Intermedio" },
  { id: "advanced",     label: "Avanzado" },
  { id: "pro",          label: "Profesional" },
];

const FONT_SIZES = [
  { id: "sm", label: "A",  size: "text-xs",   desc: "Compacto" },
  { id: "md", label: "A",  size: "text-sm",   desc: "Normal" },
  { id: "lg", label: "A",  size: "text-base", desc: "Grande" },
];

type Tab = "profile" | "appearance" | "stats" | "data";

interface ProfileClientProps {
  user: {
    id: string;
    email: string | null;
    full_name: string | null;
    role: string | null;
    skill_level: string | null;
    bio: string | null;
    avatar_color: string | null;
    avatar_url: string | null;
    provider: string;
    created_at: string;
  };
  stats: {
    totalSessions: number;
    totalMinutes: number;
    totalExercises: number;
    upcomingSessions: number;
  };
}

const TABS: { id: Tab; label: string; code: string }[] = [
  { id: "profile",    label: "Perfil",       code: "01" },
  { id: "appearance", label: "Apariencia",   code: "02" },
  { id: "stats",      label: "Estadísticas", code: "03" },
  { id: "data",       label: "Datos",        code: "04" },
];

export function ProfileClient({ user, stats }: ProfileClientProps) {
  const [tab, setTab] = useState<Tab>("profile");

  // Profile state
  const [name, setName]                       = useState(user.full_name ?? "");
  const [role, setRole]                       = useState(user.role ?? "coach");
  const [level, setLevel]                     = useState(user.skill_level ?? "intermediate");
  const [bio, setBio]                         = useState(user.bio ?? "");
  const [avatarUrl, setAvatarUrl]             = useState<string | null>(user.avatar_url ?? null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError]         = useState<string | null>(null);
  const avatarInputRef                        = useRef<HTMLInputElement>(null);
  const [saving, setSaving]                   = useState(false);
  const [saved, setSaved]                     = useState(false);
  const [profileError, setProfileError]       = useState<string | null>(null);

  // Appearance state
  const [accent, setAccent]     = useState("green");
  const [fontSize, setFontSize] = useState("md");

  // Export state
  const [exportingJson, setExportingJson] = useState(false);
  const [exportingCsv, setExportingCsv]   = useState(false);

  useEffect(() => {
    setAccent(localStorage.getItem("accent") ?? "green");
    setFontSize(localStorage.getItem("font-size") ?? "md");
  }, []);

  function handleAccentChange(id: string) {
    setAccent(id);
    localStorage.setItem("accent", id);
    applyAccentColor(id);
  }

  function handleFontSizeChange(id: string) {
    setFontSize(id);
    localStorage.setItem("font-size", id);
    applyFontSize(id);
  }

  async function handleAvatarUpload(file: File) {
    if (!file.type.startsWith("image/")) { setAvatarError("Solo se admiten imágenes"); return; }
    if (file.size > 5 * 1024 * 1024) { setAvatarError("Máximo 5 MB"); return; }
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}.${ext}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: publicUrl }) });
      setAvatarUrl(publicUrl);
    } catch (e: unknown) {
      setAvatarError(e instanceof Error ? e.message : "Error al subir la foto");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setProfileError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name, role, skill_level: level, bio },
      });
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setProfileError(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleExportJson() {
    setExportingJson(true);
    try {
      const res = await fetch("/api/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tenplanner-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingJson(false);
    }
  }

  async function handleExportCsv() {
    setExportingCsv(true);
    try {
      const res = await fetch("/api/export");
      const data = await res.json();
      const sessions = data.sessions ?? [];
      const headers = ["id", "title", "description", "scheduled_at", "duration_minutes"];
      const rows = sessions.map((s: Record<string, unknown>) =>
        headers.map((h) => JSON.stringify(s[h] ?? "")).join(",")
      );
      const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sessions-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingCsv(false);
    }
  }

  const totalHours = Math.round(stats.totalMinutes / 60);
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const currentAccentMeta = ACCENT_COLORS.find((c) => c.id === accent);

  return (
    <div className="space-y-8">
      {/* Identity strip */}
      <section className="grid grid-cols-[auto_1fr_auto] items-center gap-6 border-y border-foreground/15 py-6">
        <div className="relative">
          <div className="size-20 rounded-full border border-foreground/25 bg-foreground/[0.02] overflow-hidden flex items-center justify-center">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={name} width={80} height={80} className="size-full object-cover" />
            ) : (
              <span className="font-heading text-2xl text-foreground/80">{initials}</span>
            )}
          </div>
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            title="Cambiar foto"
            className="absolute -bottom-1 -right-1 size-7 rounded-full bg-background border border-foreground/25 flex items-center justify-center hover:border-brand hover:text-brand transition-colors"
          >
            {avatarUploading ? <Loader2 className="size-3 animate-spin" /> : <Camera className="size-3" strokeWidth={1.6} />}
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }} />
        </div>
        <div className="min-w-0">
          <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-foreground/50 mb-1">
            Identidad
          </p>
          <p className="font-heading italic text-2xl text-foreground truncate">
            {name || "Tu nombre"}
          </p>
          <p className="text-[12px] text-foreground/55 truncate mt-0.5 tabular-nums">
            {user.email}
          </p>
          {avatarError && (
            <p className="text-[11px] text-destructive mt-1">{avatarError}</p>
          )}
        </div>
        <div className="hidden md:flex flex-col items-end">
          <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/45 mb-1">
            Rol · Nivel
          </p>
          <p className="text-[13px] text-foreground">
            {ROLES.find((r) => r.id === role)?.label ?? "—"}
          </p>
          <p className="text-[11px] text-foreground/55 tabular-nums mt-0.5">
            {LEVELS.find((l) => l.id === level)?.label ?? "—"}
          </p>
        </div>
      </section>

      {/* Tab rail */}
      <nav className="flex flex-wrap gap-x-8 gap-y-2 border-b border-foreground/15">
        {TABS.map(({ id, label, code }) => {
          const isActive = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "group -mb-px pb-3 flex items-baseline gap-2 border-b-2 transition-colors",
                isActive
                  ? "border-brand text-foreground"
                  : "border-transparent text-foreground/55 hover:text-foreground"
              )}
            >
              <span className={cn(
                "font-sans text-[10px] tabular-nums tracking-[0.22em]",
                isActive ? "text-brand" : "text-foreground/40"
              )}>
                {code}
              </span>
              <span className={cn("text-[14px]", isActive && "font-heading italic")}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── PROFILE ── */}
      {tab === "profile" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label htmlFor="name" className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/55 block mb-2">
                Nombre para mostrar
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre completo"
                className="w-full h-10 bg-transparent border-0 border-b border-foreground/20 focus:outline-none focus:border-brand text-[15px] text-foreground placeholder:text-foreground/35 transition-colors"
              />
            </div>
            <div>
              <label className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/55 block mb-2">
                <Mail className="inline size-3 mr-1 -mt-0.5" strokeWidth={1.6} />
                Correo electrónico
              </label>
              <input
                type="email"
                value={user.email ?? ""}
                disabled
                className="w-full h-10 bg-transparent border-0 border-b border-foreground/15 text-[15px] text-foreground/50 cursor-not-allowed tabular-nums"
              />
            </div>
          </div>

          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/55 mb-3">
              Rol
            </p>
            <div className="flex gap-0 border border-foreground/15 w-fit">
              {ROLES.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={cn(
                    "px-4 py-2.5 text-[13px] transition-colors",
                    i > 0 && "border-l border-foreground/15",
                    role === r.id
                      ? "bg-brand text-brand-foreground font-semibold"
                      : "text-foreground/65 hover:text-foreground hover:bg-foreground/[0.03]"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/55 mb-3">
              Nivel
            </p>
            <div className="flex gap-0 border border-foreground/15 w-fit flex-wrap">
              {LEVELS.map((l, i) => (
                <button
                  key={l.id}
                  onClick={() => setLevel(l.id)}
                  className={cn(
                    "px-4 py-2.5 text-[13px] transition-colors",
                    i > 0 && "border-l border-foreground/15",
                    level === l.id
                      ? "bg-brand text-brand-foreground font-semibold"
                      : "text-foreground/65 hover:text-foreground hover:bg-foreground/[0.03]"
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/55 block mb-2">
              Bio <span className="text-foreground/35 normal-case tracking-normal">· opcional</span>
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Filosofía de entrenamiento, objetivos, ejercicios favoritos…"
              rows={3}
              maxLength={300}
              className="w-full px-0 py-2 text-[14px] bg-transparent border-0 border-b border-foreground/20 focus:outline-none focus:border-brand text-foreground placeholder:text-foreground/35 resize-none italic font-heading transition-colors"
            />
            <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-foreground/40 text-right">
              {bio.length}/300
            </p>
          </div>

          {profileError && (
            <div className="border-l-2 border-destructive pl-4 py-1">
              <p className="text-[13px] text-destructive">{profileError}</p>
            </div>
          )}

          <div className="flex items-center gap-4 pt-2 border-t border-foreground/10">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 border border-brand bg-brand text-brand-foreground text-[12px] font-semibold tracking-wide px-5 py-2.5 hover:bg-brand/90 transition-colors uppercase disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="size-3.5" />
              ) : null}
              {saving ? "Guardando…" : saved ? "Guardado" : "Guardar cambios"}
            </button>
            {saved && (
              <p className="text-[12px] text-brand font-sans tracking-wide uppercase">
                ◆ Cambios guardados
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── APPEARANCE ── */}
      {tab === "appearance" && (
        <div className="space-y-10">
          <div>
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-3 pb-3 border-b border-foreground/15">
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">A</p>
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                Color de acento
              </p>
            </div>
            <p className="text-[12px] text-foreground/55 mt-3 mb-5">
              Se aplica a botones, estados activos y destacados.
            </p>
            <div className="flex flex-wrap gap-0 border border-foreground/15 w-fit">
              {ACCENT_COLORS.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => handleAccentChange(c.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] transition-colors",
                    i > 0 && "border-l border-foreground/15",
                    accent === c.id
                      ? "bg-foreground/[0.04] text-foreground"
                      : "text-foreground/60 hover:text-foreground hover:bg-foreground/[0.02]"
                  )}
                >
                  <span
                    className="size-3 rounded-full shrink-0 border border-foreground/10"
                    style={{ backgroundColor: c.preview }}
                  />
                  {c.label}
                  {accent === c.id && <span className="text-[10px] tracking-[0.22em] text-brand">◆</span>}
                </button>
              ))}
            </div>
            {currentAccentMeta && (
              <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-foreground/40 mt-3">
                Activo · {currentAccentMeta.label}
              </p>
            )}
          </div>

          <div>
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-3 pb-3 border-b border-foreground/15">
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">B</p>
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                Tamaño del texto
              </p>
            </div>
            <div className="flex gap-0 mt-4 border border-foreground/15 w-fit">
              {FONT_SIZES.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => handleFontSizeChange(f.id)}
                  className={cn(
                    "flex flex-col items-center px-6 py-3 transition-colors min-w-[88px]",
                    i > 0 && "border-l border-foreground/15",
                    fontSize === f.id
                      ? "bg-brand/10 text-brand"
                      : "text-foreground/60 hover:text-foreground hover:bg-foreground/[0.03]"
                  )}
                >
                  <span className={cn("font-bold", f.size)}>{f.label}</span>
                  <span className="font-sans text-[9px] uppercase tracking-[0.22em] mt-0.5">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-3 pb-3 border-b border-foreground/15">
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">C</p>
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                Tema
              </p>
            </div>
            <p className="text-[12px] text-foreground/55 mt-3 mb-4">
              El modo oscuro está pensado para sesiones de entrenamiento nocturnas.
            </p>
            <div className="w-fit">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      {/* ── STATS ── */}
      {tab === "stats" && (
        <div className="space-y-10">
          <section className="grid grid-cols-2 md:grid-cols-4 border-y border-foreground/15">
            {[
              { label: "Sesiones totales",    value: stats.totalSessions, accent: true },
              { label: "Horas entrenadas",     value: `${totalHours}h` },
              { label: "Ejercicios (biblioteca)", value: stats.totalExercises },
              { label: "Próximas sesiones",   value: stats.upcomingSessions },
            ].map(({ label, value, accent: isAccent }, i) => (
              <div
                key={label}
                className={cn("px-4 py-6", i > 0 && "border-l border-foreground/10")}
              >
                <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-foreground/45 mb-1.5">
                  {label}
                </p>
                <p className={cn(
                  "font-heading text-4xl tabular-nums leading-none",
                  isAccent ? "text-brand" : "text-foreground"
                )}>
                  {value}
                </p>
              </div>
            ))}
          </section>

          <section>
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-3 pb-3 border-b border-foreground/15">
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">·</p>
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                Cuenta · detalles
              </p>
            </div>
            <dl className="divide-y divide-foreground/10">
              {[
                { label: "Correo electrónico", value: user.email ?? "—" },
                { label: "Método de acceso",  value: user.provider === "google" ? "Google OAuth" : "Correo y contraseña" },
                { label: "Miembro desde",     value: user.created_at ? new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date(user.created_at)) : "—" },
                { label: "Estado",            value: "Activo" },
              ].map(({ label, value }) => (
                <div key={label} className="grid grid-cols-[1fr_auto] gap-4 py-3.5 items-baseline">
                  <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                    {label}
                  </dt>
                  <dd className="text-[13px] text-foreground tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      )}

      {/* ── DATA ── */}
      {tab === "data" && (
        <div className="space-y-10">
          <section>
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-3 pb-3 border-b border-foreground/15">
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">01</p>
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                Exportar · copia de tus datos
              </p>
            </div>
            <p className="text-[13px] text-foreground/60 mt-4 mb-6 max-w-xl">
              Descarga una copia completa de sesiones, ejercicios y metadatos.
            </p>
            <div className="flex flex-wrap gap-0 border border-foreground/15 w-fit">
              <button
                onClick={handleExportJson}
                disabled={exportingJson}
                className="inline-flex items-center gap-2.5 px-4 py-3 text-[12px] tracking-wide uppercase text-foreground hover:bg-foreground/[0.03] transition-colors disabled:opacity-60"
              >
                {exportingJson ? <Loader2 className="size-3.5 animate-spin" /> : <FileJson className="size-3.5 text-brand" strokeWidth={1.6} />}
                JSON · completo
              </button>
              <button
                onClick={handleExportCsv}
                disabled={exportingCsv}
                className="inline-flex items-center gap-2.5 px-4 py-3 text-[12px] tracking-wide uppercase text-foreground hover:bg-foreground/[0.03] transition-colors border-l border-foreground/15 disabled:opacity-60"
              >
                {exportingCsv ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5 text-foreground/60" strokeWidth={1.6} />}
                CSV · sesiones
              </button>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 max-w-xl">
              {[
                "Todas las sesiones con fechas y duraciones",
                "Biblioteca completa de ejercicios",
                "Relaciones sesión–ejercicio",
                "Metadatos de la cuenta",
              ].map((item) => (
                <p key={item} className="text-[12px] text-foreground/55 flex items-start gap-2">
                  <span className="text-brand mt-0.5">◆</span>
                  {item}
                </p>
              ))}
            </div>
          </section>

          <section>
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-3 pb-3 border-b border-destructive/30">
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-destructive">△</p>
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-destructive">
                Zona de peligro
              </p>
            </div>
            <div className="mt-5 grid grid-cols-[1fr_auto] gap-6 items-start border-l-2 border-destructive/40 pl-4 py-2">
              <div>
                <p className="font-heading italic text-[15px] text-foreground">Eliminar cuenta</p>
                <p className="text-[12px] text-foreground/55 mt-1 max-w-md">
                  Elimina permanentemente tu cuenta y todos los datos de entrenamiento. Esta acción no se puede deshacer.
                </p>
              </div>
              <button className="shrink-0 inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-destructive border border-destructive/40 px-3 py-2 hover:bg-destructive/10 transition-colors">
                <Trash2 className="size-3" strokeWidth={1.6} />
                Eliminar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
