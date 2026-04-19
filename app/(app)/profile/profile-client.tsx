"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ACCENT_COLORS, applyAccentColor, applyFontSize } from "@/lib/accent-colors";
import { ThemeToggle } from "@/components/app/theme-toggle";
import {
  User, Mail, Shield, Trash2, CheckCircle2, Palette, Type,
  BarChart3, FileJson, FileText, Loader2, Zap, Star, Trophy,
  Clock, CalendarDays, Dumbbell, Settings, Camera,
} from "lucide-react";

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

const AVATAR_COLORS = [
  { id: "green",  bg: "bg-emerald-500/15",  text: "text-emerald-400",  hex: "#34d399" },
  { id: "blue",   bg: "bg-blue-500/15",     text: "text-blue-400",     hex: "#60a5fa" },
  { id: "violet", bg: "bg-violet-500/15",   text: "text-violet-400",   hex: "#a78bfa" },
  { id: "amber",  bg: "bg-amber-500/15",    text: "text-amber-400",    hex: "#fbbf24" },
  { id: "rose",   bg: "bg-rose-500/15",     text: "text-rose-400",     hex: "#fb7185" },
  { id: "cyan",   bg: "bg-cyan-500/15",     text: "text-cyan-400",     hex: "#22d3ee" },
  { id: "orange", bg: "bg-orange-500/15",   text: "text-orange-400",   hex: "#fb923c" },
  { id: "pink",   bg: "bg-pink-500/15",     text: "text-pink-400",     hex: "#f472b6" },
];

const FONT_SIZES = [
  { id: "sm", label: "A",  size: "text-xs", desc: "Compacto" },
  { id: "md", label: "A",  size: "text-sm", desc: "Normal" },
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

export function ProfileClient({ user, stats }: ProfileClientProps) {
  const [tab, setTab] = useState<Tab>("profile");
  const [prevTab, setPrevTab] = useState<Tab>("profile");
  const [animKey, setAnimKey] = useState(0);

  // Profile state
  const [name, setName]             = useState(user.full_name ?? "");
  const [role, setRole]             = useState(user.role ?? "coach");
  const [level, setLevel]           = useState(user.skill_level ?? "intermediate");
  const [bio, setBio]               = useState(user.bio ?? "");
  const [avatarColor, setAvatarColor] = useState(user.avatar_color ?? "green");
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(user.avatar_url ?? null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef              = useRef<HTMLInputElement>(null);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

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

  function changeTab(t: Tab) {
    setPrevTab(tab);
    setTab(t);
    setAnimKey((k) => k + 1);
  }

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
        data: { full_name: name, role, skill_level: level, bio, avatar_color: avatarColor },
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
  const avatarMeta = AVATAR_COLORS.find((c) => c.id === avatarColor) ?? AVATAR_COLORS[0];
  const currentAccentMeta = ACCENT_COLORS.find((c) => c.id === accent);

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "profile",    label: "Perfil",           icon: User },
    { id: "appearance", label: "Apariencia",       icon: Palette },
    { id: "stats",      label: "Estadísticas",     icon: BarChart3 },
    { id: "data",       label: "Datos y Privacidad", icon: Shield },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">

      {/* ── Left sidebar ── */}
      <div className="w-full lg:w-72 shrink-0 space-y-4 animate-fade-up">

        {/* Avatar card */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center gap-3">
          <div className="relative group">
            <div className={`size-20 rounded-2xl relative ${!avatarUrl ? avatarMeta.bg : ""} flex items-center justify-center transition-all duration-300 hover:scale-105 overflow-hidden`}>
              {avatarUrl ? (
                <Image src={avatarUrl} alt={name} fill className="object-cover" />
              ) : (
                <span className={`text-2xl font-bold ${avatarMeta.text}`}>{initials}</span>
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              title="Cambiar foto"
              className="absolute -bottom-1.5 -right-1.5 size-7 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
            >
              {avatarUploading ? <Loader2 className="size-3.5 animate-spin text-muted-foreground" /> : <Camera className="size-3.5 text-muted-foreground" />}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }} />
          </div>
          {avatarError && <p className="text-xs text-destructive">{avatarError}</p>}
          <div>
            <p className="font-heading font-semibold text-lg text-foreground leading-tight">
              {name || "Tu nombre"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">{user.email}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand/10 text-brand text-xs font-semibold">
              <Zap className="size-3" />
              {ROLES.find((r) => r.id === role)?.label ?? "Entrenador"}
            </span>
            <span className="text-xs text-muted-foreground">
              {LEVELS.find((l) => l.id === level)?.label ?? "Intermedio"}
            </span>
          </div>
          {bio && (
            <p className="text-xs text-muted-foreground italic leading-relaxed border-t border-border pt-3 w-full">
              &ldquo;{bio}&rdquo;
            </p>
          )}
        </div>

        {/* Mini stats */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-fade-up stagger-1">
          {[
            { icon: CalendarDays, label: "Sesiones",  value: stats.totalSessions, color: "text-brand" },
            { icon: Clock,        label: "Horas",      value: totalHours,          color: "text-amber-400" },
            { icon: Dumbbell,     label: "Ejercicios", value: stats.totalExercises, color: "text-blue-400" },
            { icon: Star,         label: "Próximas",   value: stats.upcomingSessions, color: "text-purple-400" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className={`size-3.5 ${color}`} />
                <span className="text-xs">{label}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </div>

        {/* Tab nav (desktop only) */}
        <nav className="hidden lg:block bg-card border border-border rounded-2xl p-2 space-y-0.5 animate-fade-up stagger-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => changeTab(id)}
              className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === id
                  ? "bg-brand/10 text-brand"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {label}
              {tab === id && (
                <span className="ml-auto size-1.5 rounded-full bg-brand animate-scale-in" />
              )}
            </button>
          ))}
        </nav>

        {/* Accent colour preview */}
        <div className="hidden lg:flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-xl animate-fade-up stagger-3">
          <div
            className="size-4 rounded-full shrink-0 transition-all duration-300"
            style={{ backgroundColor: currentAccentMeta?.preview ?? "#4ade80" }}
          />
          <span className="text-xs text-muted-foreground">
            Tema {currentAccentMeta?.label ?? "Verde Pádel"}
          </span>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Mobile tab bar */}
        <div className="lg:hidden flex gap-1 bg-muted/50 rounded-xl p-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => changeTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-1 justify-center ${
                tab === id
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab content — animated on change */}
        <div key={animKey} className="animate-fade-up">

          {/* ── PROFILE TAB ── */}
          {tab === "profile" && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-6">

              {/* Avatar colour */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Color del avatar
                </label>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_COLORS.map((c, i) => (
                    <button
                      key={c.id}
                      onClick={() => setAvatarColor(c.id)}
                      title={c.id}
                      className={`size-8 rounded-full border-2 transition-all duration-200 ${
                        avatarColor === c.id
                          ? "border-foreground scale-110 shadow-lg"
                          : "border-transparent hover:scale-110 hover:border-foreground/30"
                      }`}
                      style={{
                        backgroundColor: c.hex,
                        animationDelay: `${i * 0.03}s`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label htmlFor="name" className="block text-sm font-semibold text-foreground">
                    Nombre para mostrar
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full h-10 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Mail className="size-3.5" /> Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={user.email ?? ""}
                    disabled
                    className="w-full h-10 px-3 text-sm bg-muted/40 border border-border rounded-lg text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Rol</label>
                <div className="flex gap-2 flex-wrap">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                        role === r.id
                          ? "bg-brand text-brand-foreground border-brand shadow-sm shadow-brand/20"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skill level */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Nivel</label>
                <div className="flex gap-2 flex-wrap">
                  {LEVELS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLevel(l.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 flex items-center gap-1.5 ${
                        level === l.id
                          ? "bg-brand text-brand-foreground border-brand shadow-sm shadow-brand/20"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {l.id === "pro" && <Trophy className="size-3.5" />}
                      {l.id === "advanced" && <Star className="size-3.5" />}
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label htmlFor="bio" className="block text-sm font-semibold text-foreground">
                  Bio
                  <span className="font-normal text-muted-foreground ml-2">(opcional)</span>
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Filosofía de entrenamiento, objetivos, ejercicios favoritos…"
                  rows={3}
                  maxLength={300}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-colors text-foreground placeholder:text-muted-foreground resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
              </div>

              {profileError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 animate-scale-in">
                  <p className="text-sm text-destructive">{profileError}</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-brand text-brand-foreground text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand/90 active:scale-95 transition-all duration-150 disabled:opacity-60 shadow-sm shadow-brand/20"
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : saved ? (
                    <CheckCircle2 className="size-4 animate-scale-in" />
                  ) : null}
                  {saving ? "Guardando…" : saved ? "¡Guardado!" : "Guardar cambios"}
                </button>
                {saved && (
                  <p className="text-sm text-brand animate-fade-in">Cambios guardados correctamente.</p>
                )}
              </div>
            </div>
          )}

          {/* ── APPEARANCE TAB ── */}
          {tab === "appearance" && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-8">

              {/* Accent color */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-0.5">Color de acento</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Cambia botones, estados activos y destacados en toda la app.
                </p>
                <div className="flex flex-wrap gap-3">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleAccentChange(c.id)}
                      className={`group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all duration-200 ${
                        accent === c.id
                          ? "border-foreground/30 bg-muted scale-105"
                          : "border-border hover:bg-muted hover:scale-102"
                      }`}
                    >
                      <span
                        className="size-4 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-110"
                        style={{ backgroundColor: c.preview }}
                      />
                      <span className="text-sm font-medium text-foreground">{c.label}</span>
                      {accent === c.id && (
                        <CheckCircle2 className="size-3.5 text-foreground/60 ml-1 animate-scale-in" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font size */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-0.5">Tamaño del texto</h3>
                <p className="text-xs text-muted-foreground mb-4">Ajusta el tamaño del texto en todas las páginas.</p>
                <div className="flex gap-3">
                  {FONT_SIZES.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleFontSizeChange(f.id)}
                      className={`flex flex-col items-center px-6 py-3 rounded-xl border transition-all duration-200 min-w-[80px] ${
                        fontSize === f.id
                          ? "border-brand bg-brand/10 text-brand scale-105 shadow-sm shadow-brand/10"
                          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span className={`font-bold ${f.size}`}>{f.label}</span>
                      <span className="text-xs mt-0.5 opacity-70">{f.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-0.5">Tema</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  El modo oscuro está diseñado para sesiones de entrenamiento nocturnas.
                </p>
                <div className="w-fit">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          )}

          {/* ── STATS TAB ── */}
          {tab === "stats" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  { icon: CalendarDays, label: "Sesiones totales",      value: stats.totalSessions,   color: "text-brand",     bg: "bg-brand/10" },
                  { icon: Clock,        label: "Horas entrenadas",       value: totalHours,            color: "text-amber-400", bg: "bg-amber-400/10" },
                  { icon: Dumbbell,     label: "Biblioteca de ejercicios", value: stats.totalExercises,  color: "text-blue-400",  bg: "bg-blue-400/10" },
                  { icon: Star,         label: "Sesiones próximas",     value: stats.upcomingSessions, color: "text-purple-400", bg: "bg-purple-400/10" },
                ].map(({ icon: Icon, label, value, color, bg }, i) => (
                  <div
                    key={label}
                    className={`bg-card border border-border rounded-2xl p-5 animate-fade-up`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className={`size-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                      <Icon className={`size-4 ${color}`} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Detalles de la cuenta</h3>
                <div className="divide-y divide-border">
                  {[
                    { icon: Mail,   label: "Correo electrónico", value: user.email ?? "—" },
                    { icon: Shield, label: "Inicio de sesión",  value: user.provider === "google" ? "Google OAuth" : "Correo y Contraseña" },
                    { icon: Zap,    label: "Miembro desde",     value: user.created_at ? new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date(user.created_at)) : "—" },
                    { icon: Settings, label: "Estado",          value: "Activo" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 py-3">
                      <Icon className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground flex-1">{label}</span>
                      <span className="text-sm font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── DATA TAB ── */}
          {tab === "data" && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Exportar datos</h3>
                  <p className="text-sm text-muted-foreground">
                    Descarga una copia completa de todos tus datos de entrenamiento.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleExportJson}
                    disabled={exportingJson}
                    className="inline-flex items-center gap-2 border border-border bg-background text-sm font-medium text-foreground px-4 py-2.5 rounded-xl hover:bg-muted active:scale-95 transition-all duration-150 disabled:opacity-60"
                  >
                    {exportingJson ? <Loader2 className="size-4 animate-spin" /> : <FileJson className="size-4 text-brand" />}
                    Descargar como JSON
                  </button>
                  <button
                    onClick={handleExportCsv}
                    disabled={exportingCsv}
                    className="inline-flex items-center gap-2 border border-border bg-background text-sm font-medium text-foreground px-4 py-2.5 rounded-xl hover:bg-muted active:scale-95 transition-all duration-150 disabled:opacity-60"
                  >
                    {exportingCsv ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4 text-amber-400" />}
                    Sesiones como CSV
                  </button>
                </div>

                <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-2">
                  <p className="text-xs font-semibold text-foreground">Incluido en la exportación:</p>
                  {[
                    "Todas las sesiones con fechas y duraciones",
                    "Biblioteca completa de ejercicios",
                    "Relaciones sesión-ejercicio",
                    "Metadatos de la cuenta",
                  ].map((item) => (
                    <p key={item} className="text-xs text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="size-3.5 text-brand shrink-0 mt-0.5" />
                      {item}
                    </p>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-destructive/20 rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Zona de peligro</h3>
                  <p className="text-sm text-muted-foreground">Acciones irreversibles — procede con precaución.</p>
                </div>
                <div className="flex items-start justify-between gap-4 border border-destructive/20 rounded-xl p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Eliminar cuenta</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Elimina permanentemente tu cuenta y todos los datos de entrenamiento.
                    </p>
                  </div>
                  <button className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-destructive border border-destructive/30 px-3 py-2 rounded-lg hover:bg-destructive/10 active:scale-95 transition-all duration-150">
                    <Trash2 className="size-3.5" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
