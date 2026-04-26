"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ACCENT_COLORS,
  applyAccentColor,
  applyFontSize,
} from "@/lib/accent-colors";
import { ThemeToggle } from "@/components/app/theme-toggle";
import {
  Mail,
  Trash2,
  CheckCircle2,
  FileJson,
  FileText,
  Loader2,
  Camera,
  Activity,
  Clock,
  Calendar,
  Dumbbell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { id: "coach", label: "Entrenador" },
  { id: "player", label: "Jugador" },
  { id: "both", label: "Entrenador & Jugador" },
];

const LEVELS = [
  { id: "beginner", label: "Principiante" },
  { id: "intermediate", label: "Intermedio" },
  { id: "advanced", label: "Avanzado" },
  { id: "pro", label: "Profesional" },
];

const FONT_SIZES = [
  { id: "sm", label: "A", size: "text-xs", desc: "Compacto" },
  { id: "md", label: "A", size: "text-sm", desc: "Normal" },
  { id: "lg", label: "A", size: "text-base", desc: "Grande" },
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
  { id: "profile", label: "Perfil", code: "01" },
  { id: "appearance", label: "Apariencia", code: "02" },
  { id: "stats", label: "Estadísticas", code: "03" },
  { id: "data", label: "Datos", code: "04" },
];

export function ProfileClient({ user, stats }: ProfileClientProps) {
  const [tab, setTab] = useState<Tab>("profile");

  // Profile state
  const [name, setName] = useState(user.full_name ?? "");
  const [role, setRole] = useState(user.role ?? "coach");
  const [level, setLevel] = useState(user.skill_level ?? "intermediate");
  const [bio, setBio] = useState(user.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user.avatar_url ?? null
  );
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Appearance state
  const [accent, setAccent] = useState("green");
  const [fontSize, setFontSize] = useState("md");

  // Export state
  const [exportingJson, setExportingJson] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Delete account state
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "ELIMINAR") return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "ELIMINAR" }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "No se pudo eliminar la cuenta.");
      }
      await createClient().auth.signOut();
      router.replace("/");
      router.refresh();
    } catch (e: unknown) {
      setDeleteError(
        e instanceof Error ? e.message : "No se pudo eliminar la cuenta."
      );
    } finally {
      setDeleting(false);
    }
  }

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
    if (!file.type.startsWith("image/")) {
      setAvatarError("Solo se admiten imágenes");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Máximo 5 MB");
      return;
    }
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}.${ext}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: publicUrl }),
      });
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
      const headers = [
        "id",
        "title",
        "description",
        "scheduled_at",
        "duration_minutes",
      ];
      const rows = sessions.map((s: Record<string, unknown>) =>
        headers.map((h) => JSON.stringify(s[h] ?? "")).join(",")
      );
      const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
        type: "text/csv",
      });
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
  const initials =
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";
  const currentAccentMeta = ACCENT_COLORS.find((c) => c.id === accent);

  return (
    <div className="space-y-8">
      {/* Identity hero */}
      <section className="relative overflow-hidden rounded-3xl border border-foreground/15 bg-foreground/[0.015]">
        {/* Gradient banner */}
        <div className="relative h-28 sm:h-32 overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-brand/30 via-brand/10 to-transparent"
          />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, currentColor 0 1px, transparent 1px 14px)",
            }}
          />
          <div
            aria-hidden
            className="absolute -top-16 -right-10 size-56 rounded-full bg-brand/25 blur-3xl"
          />
        </div>

        <div className="px-5 sm:px-8 pb-6 -mt-14">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] md:items-end gap-5">
            {/* Avatar */}
            <div className="relative w-fit">
              <div className="size-28 rounded-full border-4 border-background bg-foreground/[0.04] overflow-hidden shadow-xl shadow-brand/10 ring-1 ring-brand/30 flex items-center justify-center">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={name}
                    width={112}
                    height={112}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="font-heading text-3xl text-foreground/75">
                    {initials}
                  </span>
                )}
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                title="Cambiar foto"
                className="absolute bottom-1 right-1 size-8 rounded-full bg-background border border-foreground/20 shadow-sm flex items-center justify-center text-foreground/65 hover:text-brand hover:border-brand transition-colors disabled:opacity-60"
              >
                {avatarUploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Camera className="size-3.5" strokeWidth={1.6} />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatarUpload(f);
                }}
              />
            </div>

            {/* Name + email + pills */}
            <div className="min-w-0 md:pb-1">
              <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-foreground/50 mb-1">
                Identidad · № 06
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl italic text-foreground leading-tight truncate">
                {name || "Tu nombre"}
              </h2>
              <p className="text-[12px] text-foreground/55 truncate mt-1 tabular-nums">
                {user.email}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-brand/10 text-brand border border-brand/25 font-medium">
                  <span className="size-1.5 rounded-full bg-brand" />
                  {ROLES.find((r) => r.id === role)?.label ?? "—"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-foreground/5 text-foreground/75 border border-foreground/15">
                  {LEVELS.find((l) => l.id === level)?.label ?? "—"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-foreground/5 text-foreground/60 border border-foreground/15 capitalize">
                  {user.provider === "google" ? "Google" : "Correo"}
                </span>
              </div>
              {avatarError && (
                <p className="text-[11px] text-destructive mt-2">
                  {avatarError}
                </p>
              )}
            </div>

            {/* Micro stats */}
            <dl className="hidden md:grid grid-cols-3 gap-2 md:pb-1">
              {[
                {
                  icon: Activity,
                  label: "Sesiones",
                  value: stats.totalSessions,
                },
                {
                  icon: Clock,
                  label: "Horas",
                  value: totalHours,
                },
                {
                  icon: Calendar,
                  label: "Próx.",
                  value: stats.upcomingSessions,
                },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="text-right bg-background/60 backdrop-blur border border-foreground/12 rounded-xl px-3 py-2.5 min-w-[76px]"
                >
                  <div className="flex items-center justify-end gap-1 text-foreground/45">
                    <Icon className="size-3" strokeWidth={1.6} />
                    <dt className="font-sans text-[9px] uppercase tracking-[0.22em]">
                      {label}
                    </dt>
                  </div>
                  <dd className="font-heading text-xl tabular-nums text-foreground mt-0.5 leading-none">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
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
              <span
                className={cn(
                  "font-sans text-[10px] tabular-nums tracking-[0.22em]",
                  isActive ? "text-brand" : "text-foreground/40"
                )}
              >
                {code}
              </span>
              <span
                className={cn("text-[14px]", isActive && "font-heading italic")}
              >
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
              <label
                htmlFor="name"
                className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/55 block mb-2"
              >
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
                <Mail
                  className="inline size-3 mr-1 -mt-0.5"
                  strokeWidth={1.6}
                />
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
            <label
              htmlFor="bio"
              className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/55 block mb-2"
            >
              Bio{" "}
              <span className="text-foreground/35 normal-case tracking-normal">
                · opcional
              </span>
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
            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="text-[12px] text-brand font-sans tracking-wide uppercase"
            >
              {saved ? "◆ Cambios guardados" : ""}
            </p>
          </div>
        </div>
      )}

      {/* ── APPEARANCE ── */}
      {tab === "appearance" && (
        <div className="space-y-10">
          <div>
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-3 pb-3 border-b border-foreground/15">
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">
                A
              </p>
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
                  {accent === c.id && (
                    <span className="text-[10px] tracking-[0.22em] text-brand">
                      ◆
                    </span>
                  )}
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
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">
                B
              </p>
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
                  <span className="font-sans text-[9px] uppercase tracking-[0.22em] mt-0.5">
                    {f.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-3 pb-3 border-b border-foreground/15">
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">
                C
              </p>
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                Tema
              </p>
            </div>
            <p className="text-[12px] text-foreground/55 mt-3 mb-4">
              El modo oscuro está pensado para sesiones de entrenamiento
              nocturnas.
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
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Sesiones totales",
                value: stats.totalSessions,
                icon: Activity,
                accent: true,
              },
              {
                label: "Horas entrenadas",
                value: `${totalHours}h`,
                icon: Clock,
              },
              {
                label: "Biblioteca",
                value: stats.totalExercises,
                icon: Dumbbell,
              },
              {
                label: "Próximas",
                value: stats.upcomingSessions,
                icon: Calendar,
              },
            ].map(({ label, value, icon: Icon, accent: isAccent }) => (
              <div
                key={label}
                className={cn(
                  "relative overflow-hidden rounded-2xl border p-5 transition-colors",
                  isAccent
                    ? "border-brand/25 bg-brand/5 hover:bg-brand/[0.07]"
                    : "border-foreground/15 bg-foreground/[0.015] hover:bg-foreground/[0.03]"
                )}
              >
                {isAccent && (
                  <div
                    aria-hidden
                    className="absolute -top-8 -right-8 size-24 rounded-full bg-brand/15 blur-2xl"
                  />
                )}
                <div className="relative flex items-center gap-1.5 text-foreground/55 mb-3">
                  <Icon
                    className={cn(
                      "size-3.5",
                      isAccent ? "text-brand" : "text-foreground/55"
                    )}
                    strokeWidth={1.6}
                  />
                  <p className="font-sans text-[9px] uppercase tracking-[0.22em]">
                    {label}
                  </p>
                </div>
                <p
                  className={cn(
                    "relative font-heading text-4xl tabular-nums leading-none",
                    isAccent ? "text-brand" : "text-foreground"
                  )}
                >
                  {value}
                </p>
              </div>
            ))}
          </section>

          <section>
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-3 pb-3 border-b border-foreground/15">
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">
                ·
              </p>
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                Cuenta · detalles
              </p>
            </div>
            <dl className="divide-y divide-foreground/10">
              {[
                { label: "Correo electrónico", value: user.email ?? "—" },
                {
                  label: "Método de acceso",
                  value:
                    user.provider === "google"
                      ? "Google OAuth"
                      : "Correo y contraseña",
                },
                {
                  label: "Miembro desde",
                  value: user.created_at
                    ? new Intl.DateTimeFormat("es-ES", {
                        month: "long",
                        year: "numeric",
                      }).format(new Date(user.created_at))
                    : "—",
                },
                { label: "Estado", value: "Activo" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="grid grid-cols-[1fr_auto] gap-4 py-3.5 items-baseline"
                >
                  <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                    {label}
                  </dt>
                  <dd className="text-[13px] text-foreground tabular-nums">
                    {value}
                  </dd>
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
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-brand">
                01
              </p>
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
                {exportingJson ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <FileJson className="size-3.5 text-brand" strokeWidth={1.6} />
                )}
                JSON · completo
              </button>
              <button
                onClick={handleExportCsv}
                disabled={exportingCsv}
                className="inline-flex items-center gap-2.5 px-4 py-3 text-[12px] tracking-wide uppercase text-foreground hover:bg-foreground/[0.03] transition-colors border-l border-foreground/15 disabled:opacity-60"
              >
                {exportingCsv ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <FileText
                    className="size-3.5 text-foreground/60"
                    strokeWidth={1.6}
                  />
                )}
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
                <p
                  key={item}
                  className="text-[12px] text-foreground/55 flex items-start gap-2"
                >
                  <span className="text-brand mt-0.5">◆</span>
                  {item}
                </p>
              ))}
            </div>
          </section>

          <section>
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-3 pb-3 border-b border-destructive/30">
              <p className="font-sans text-[10px] tabular-nums tracking-[0.22em] text-destructive">
                △
              </p>
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-destructive">
                Zona de peligro
              </p>
            </div>
            <div className="mt-5 grid grid-cols-[1fr_auto] gap-6 items-start border-l-2 border-destructive/40 pl-4 py-2">
              <div>
                <p className="font-heading italic text-[15px] text-foreground">
                  Eliminar cuenta
                </p>
                <p className="text-[12px] text-foreground/55 mt-1 max-w-md">
                  Elimina permanentemente tu cuenta y todos los datos de
                  entrenamiento. Esta acción no se puede deshacer.
                </p>
              </div>
              <button
                onClick={() => {
                  setDeleteConfirmText("");
                  setDeleteError(null);
                  setDeleteOpen(true);
                }}
                className="shrink-0 inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-destructive border border-destructive/40 px-3 py-2 hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="size-3" strokeWidth={1.6} />
                Eliminar
              </button>
            </div>
          </section>
        </div>
      )}

      {deleteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={(e) => {
            if (!deleting && e.target === e.currentTarget) setDeleteOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-destructive/40 bg-card shadow-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center text-destructive shrink-0">
                <Trash2 className="size-4" strokeWidth={1.6} />
              </div>
              <div className="min-w-0">
                <p
                  id="delete-account-title"
                  className="font-heading italic text-lg text-foreground"
                >
                  Eliminar cuenta
                </p>
                <p className="text-[13px] text-foreground/70 mt-1 leading-relaxed">
                  Esta acción es <strong>irreversible</strong>. Se eliminarán
                  tus sesiones, alumnos, ejercicios propios, conversaciones
                  con Dr. Planner y tu cuenta de autenticación.
                </p>
              </div>
            </div>
            <div>
              <label className="font-sans text-[10px] uppercase tracking-[0.22em] text-foreground/55 block mb-2">
                Escribe <span className="text-destructive">ELIMINAR</span> para
                confirmar
              </label>
              <input
                type="text"
                autoFocus
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                disabled={deleting}
                className="w-full h-10 rounded-md border border-foreground/20 bg-background px-3 text-[14px] text-foreground focus:outline-none focus:border-destructive"
                placeholder="ELIMINAR"
              />
            </div>
            {deleteError && (
              <p className="text-[12px] text-destructive">{deleteError}</p>
            )}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-foreground/10">
              <button
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="text-[12px] tracking-wide uppercase text-foreground/70 hover:text-foreground px-4 py-2 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== "ELIMINAR"}
                className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground text-[12px] font-semibold tracking-wide uppercase px-4 py-2 rounded-md hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" strokeWidth={1.8} />
                )}
                {deleting ? "Eliminando…" : "Eliminar cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
