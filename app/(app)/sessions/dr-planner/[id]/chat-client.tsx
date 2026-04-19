"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Send, Loader2, Bot, User, Sparkles, RotateCcw,
  Check, CheckCircle2, XCircle, Clock, ChevronRight, Plus, X,
  CalendarCheck, Trash2, UserPlus, MapPin, Tag, Flame,
  Dumbbell, Calendar, GraduationCap, Brain, ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "technique" | "tactics" | "fitness" | "warm-up";
type Difficulty = "beginner" | "intermediate" | "advanced";

interface ExerciseItem {
  id: string; name: string; category: Category; difficulty: Difficulty;
  durationMinutes: number; description?: string; objectives?: string;
  isAiGenerated?: boolean; isPersonal?: boolean;
}
type PreguntaTipo = "texto" | "numero" | "select";
interface Pregunta { id: string; label: string; tipo: PreguntaTipo; opciones?: string[]; placeholder?: string; }

interface StudentItem {
  id: string; name: string;
  playerLevel?: string | null;
  gender?: string | null;
  dominantHand?: string | null;
}

interface SessionMetaInput {
  objective?: string;
  intensity?: number;
  tags?: string[];
  location?: string;
  scheduledAt?: string;
  durationMinutes?: number;
}

type MentionResult =
  | { type: "ejercicio"; id: string; name: string; category: string; durationMinutes: number }
  | { type: "sesion"; id: string; title: string; scheduledAt: string }
  | { type: "alumno"; id: string; name: string; playerLevel: string | null }

interface BuscarContextoResult {
  tipo: "ejercicio" | "sesion" | "alumno";
  resultados: Array<{
    id: string;
    name?: string;
    title?: string;
    category?: string;
    difficulty?: string;
    durationMinutes?: number;
    description?: string | null;
    objectives?: string | null;
    isAiGenerated?: boolean;
    scheduledAt?: string | Date | null;
    objective?: string | null;
    playerLevel?: string | null;
    dominantHand?: string | null;
    gender?: string | null;
  }>;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CAT: Record<Category, { label: string; color: string; bar: string }> = {
  technique: { label: "Técnica",       color: "text-blue-400 bg-blue-400/10 border-blue-400/20",   bar: "bg-blue-400" },
  tactics:   { label: "Táctica",       color: "text-purple-400 bg-purple-400/10 border-purple-400/20", bar: "bg-purple-400" },
  fitness:   { label: "Fitness",       color: "text-amber-400 bg-amber-400/10 border-amber-400/20", bar: "bg-amber-400" },
  "warm-up": { label: "Calentamiento", color: "text-brand bg-brand/10 border-brand/20",            bar: "bg-brand" },
};
const DIFF: Record<Difficulty, { label: string; dot: string }> = {
  beginner:     { label: "Principiante", dot: "bg-green-400" },
  intermediate: { label: "Intermedio",   dot: "bg-amber-400" },
  advanced:     { label: "Avanzado",     dot: "bg-red-400" },
};

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Principiante", amateur: "Amateur", intermediate: "Intermedio",
  advanced: "Avanzado", competitive: "Competición",
};

const LEVEL_COLOR: Record<string, string> = {
  beginner: "text-green-400 bg-green-400/10 border-green-400/20",
  amateur: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  intermediate: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  advanced: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  competitive: "text-red-400 bg-red-400/10 border-red-400/20",
};

// ─── Mention chip (inline in user messages) ──────────────────────────────────

const MENTION_ICONS: Record<string, React.ReactNode> = {
  ejercicio: <Dumbbell className="size-2.5" />,
  sesion:    <Calendar className="size-2.5" />,
  alumno:    <GraduationCap className="size-2.5" />,
};

// Matches both @[nombre] (new) and @[tipo:nombre] (legacy stored messages)
const MENTION_RE = /(@\[(?:(?:ejercicio|sesion|alumno):)?[^\]]+\])/g;

function parseMentionName(part: string): string | null {
  const legacy = part.match(/^@\[(?:ejercicio|sesion|alumno):([^\]]+)\]$/);
  if (legacy) return legacy[1];
  const simple = part.match(/^@\[([^\]]+)\]$/);
  if (simple) return simple[1];
  return null;
}

function MentionBadge({ nombre, dark }: { nombre: string; dark?: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-semibold text-[11px] align-middle",
      dark ? "bg-white/20 text-white border border-white/20" : "bg-brand/15 border border-brand/30 text-brand"
    )}>
      @ {nombre}
    </span>
  );
}

function renderUserContent(content: string): React.ReactNode {
  const parts = content.split(MENTION_RE);
  if (parts.length === 1) return content;
  return parts.map((part, i) => {
    const name = parseMentionName(part);
    if (name) return <MentionBadge key={i} nombre={name} dark />;
    return <span key={i}>{part}</span>;
  });
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderMarkdown(raw: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) => esc(s)
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code class="font-mono text-xs bg-muted px-1 py-0.5 rounded">$1</code>');

  const lines = raw.split("\n");
  const out: string[] = [];
  let ulOpen = false, olOpen = false;

  const closeList = () => {
    if (ulOpen) { out.push("</ul>"); ulOpen = false; }
    if (olOpen) { out.push("</ol>"); olOpen = false; }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      closeList();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { code.push(esc(lines[i])); i++; }
      out.push(`<pre class="my-2 rounded-xl bg-muted p-3 overflow-x-auto text-xs font-mono leading-relaxed whitespace-pre"><code>${code.join("\n")}</code></pre>`);
      i++; continue;
    }
    if (/^### /.test(line)) { closeList(); out.push(`<h3 class="font-heading font-semibold text-sm mt-3 mb-0.5 text-foreground">${inline(line.slice(4))}</h3>`); i++; continue; }
    if (/^## /.test(line))  { closeList(); out.push(`<h2 class="font-heading font-semibold text-base mt-4 mb-1 text-foreground">${inline(line.slice(3))}</h2>`); i++; continue; }
    if (/^# /.test(line))   { closeList(); out.push(`<h1 class="font-heading font-bold text-lg mt-4 mb-1 text-foreground">${inline(line.slice(2))}</h1>`); i++; continue; }
    if (line.trim() === "---") { closeList(); out.push('<hr class="border-border my-3">'); i++; continue; }

    const ul = line.match(/^[*-] (.+)/);
    if (ul) {
      if (olOpen) { out.push("</ol>"); olOpen = false; }
      if (!ulOpen) { out.push('<ul class="space-y-0.5 my-1.5">'); ulOpen = true; }
      out.push(`<li class="flex gap-2 text-sm"><span class="text-brand shrink-0 mt-0.5 leading-5">•</span><span class="leading-5">${inline(ul[1])}</span></li>`);
      i++; continue;
    }
    const ol = line.match(/^(\d+)\. (.+)/);
    if (ol) {
      if (ulOpen) { out.push("</ul>"); ulOpen = false; }
      if (!olOpen) { out.push('<ol class="space-y-0.5 my-1.5">'); olOpen = true; }
      out.push(`<li class="flex gap-2 text-sm"><span class="text-muted-foreground shrink-0 tabular-nums w-4">${ol[1]}.</span><span class="leading-5">${inline(ol[2])}</span></li>`);
      i++; continue;
    }
    if (line.trim() === "") { closeList(); out.push('<div class="h-1.5"></div>'); i++; continue; }

    closeList();
    out.push(`<p class="text-sm leading-relaxed">${inline(line)}</p>`);
    i++;
  }
  closeList();
  return out.join("");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseQuestions(content: string): Pregunta[] | null {
  const m = content.match(/<preguntas>([\s\S]*?)<\/preguntas>/);
  if (!m) return null;
  try { const p = JSON.parse(m[1]); return Array.isArray(p) ? p : null; } catch { return null; }
}
function stripQuestions(content: string) {
  return content.replace(/<preguntas>[\s\S]*?<\/preguntas>/g, "").trim();
}
function getToolParts(parts: Array<{ type: string; [k: string]: unknown }>, name: string) {
  return parts.filter(p =>
    p.type === `tool-${name}` ||
    (p.type === "dynamic-tool" && (p as { toolName?: string }).toolName === name)
  ) as Array<{ type: string; state: string; input?: unknown; output?: unknown }>;
}

const TOOL_LABELS: Record<string, string> = {
  mostrar_ejercicios: "Seleccionando ejercicios",
  buscar_ejercicios_avanzado: "Buscando ejercicios",
  buscar_sesiones_similares: "Buscando sesiones similares",
  buscar_contexto: "Buscando referencias",
  analizar_alumno: "Analizando alumno",
  seleccionar_alumnos: "Preparando selector de alumnos",
  crear_alumno: "Creando alumno",
  crear_ejercicio: "Creando ejercicio",
  configurar_sesion_meta: "Preparando formulario",
  crear_sesion: "Creando sesión",
};

type AnyPart = { type: string; state?: string; toolName?: string; text?: string };

function findCurrentActivity(parts: AnyPart[]): string | null {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (p.state === "output-available") continue;
    if (p.type?.startsWith("tool-")) {
      const name = p.type.replace(/^tool-/, "");
      return TOOL_LABELS[name] ?? "Ejecutando herramienta";
    }
    if (p.type === "dynamic-tool" && p.toolName) {
      return TOOL_LABELS[p.toolName] ?? "Ejecutando herramienta";
    }
  }
  return null;
}

// ─── Components ───────────────────────────────────────────────────────────────

function ReasoningBubble({ text, streaming }: { text: string; streaming: boolean }) {
  const [open, setOpen] = useState(streaming);
  useEffect(() => { if (!streaming) setOpen(false); }, [streaming]);
  if (!text.trim()) return null;
  return (
    <div className="flex gap-3 justify-start">
      <div className="size-7 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0 mt-1">
        <Brain className={cn("size-3.5 text-brand", streaming && "animate-pulse")} />
      </div>
      <div className="max-w-[85%] w-full">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <span className="inline-flex items-center gap-1.5">
            {streaming ? (
              <>
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full rounded-full bg-brand/60 opacity-75 animate-ping" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
                </span>
                <span className="text-brand">Pensando…</span>
              </>
            ) : (
              <span>Razonamiento</span>
            )}
          </span>
          <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <div className="mt-1.5 rounded-xl border border-dashed border-brand/25 bg-brand/[0.03] px-3.5 py-2.5 text-[12px] leading-relaxed text-muted-foreground whitespace-pre-wrap italic">
            {text}
            {streaming && <span className="inline-block w-1.5 h-3 ml-0.5 bg-brand/60 animate-pulse align-middle rounded-sm" />}
          </div>
        )}
      </div>
    </div>
  );
}

function MarkdownBubble({ role, content }: { role: string; content: string }) {
  const isAssistant = role === "assistant";
  const clean = isAssistant ? stripQuestions(content) : content;
  if (!clean.trim()) return null;
  return (
    <div className={cn("flex gap-3", isAssistant ? "justify-start" : "justify-end")}>
      {isAssistant && (
        <div className="size-7 rounded-full bg-brand/15 border border-brand/20 flex items-center justify-center shrink-0 mt-1">
          <Bot className="size-3.5 text-brand" />
        </div>
      )}
      <div className={cn(
        "max-w-[85%] rounded-2xl px-4 py-3",
        isAssistant
          ? "bg-card border border-border text-foreground rounded-tl-sm"
          : "bg-brand text-brand-foreground rounded-tr-sm text-sm leading-relaxed"
      )}>
        {isAssistant
          ? <div dangerouslySetInnerHTML={{ __html: renderMarkdown(clean) }} />
          : <span>{renderUserContent(clean)}</span>}
      </div>
      {!isAssistant && (
        <div className="size-7 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 mt-1">
          <User className="size-3.5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

function ExerciseCard({ exercise, selected, onToggle, onModify }: {
  exercise: ExerciseItem; selected: boolean;
  onToggle: () => void; onModify: (ex: ExerciseItem) => void;
}) {
  const cat = CAT[exercise.category] ?? CAT.technique;
  const diff = DIFF[exercise.difficulty] ?? DIFF.intermediate;
  return (
    <div onClick={onToggle} className={cn(
      "relative flex flex-col gap-2 rounded-xl p-3.5 border cursor-pointer transition-all group pl-5",
      selected ? "bg-brand/8 border-brand/40 ring-1 ring-brand/20" : "bg-card border-border hover:border-brand/30"
    )}>
      <div className={cn("absolute top-0 left-0 w-1 h-full rounded-l-xl", cat.bar)} />
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", cat.color)}>{cat.label}</span>
          {exercise.isAiGenerated && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-brand bg-brand/10 px-1.5 py-0.5 rounded-full border border-brand/20">
              <Sparkles className="size-2.5" /> IA
            </span>
          )}
        </div>
        <div className={cn("size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
          selected ? "bg-brand border-brand" : "border-muted-foreground/30 group-hover:border-brand/50")}>
          {selected && <Check className="size-3 text-white" />}
        </div>
      </div>
      <h3 className="font-heading font-semibold text-sm text-foreground leading-snug">{exercise.name}</h3>
      {exercise.description && <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{exercise.description}</p>}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="size-3" />{exercise.durationMinutes} min</span>
          <span className="flex items-center gap-1.5"><span className={cn("size-1.5 rounded-full", diff.dot)} />{diff.label}</span>
        </div>
        <button onClick={e => { e.stopPropagation(); onModify(exercise); }}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors">
          Modificar <ChevronRight className="size-3" />
        </button>
      </div>
    </div>
  );
}

function ExerciseGrid({ ejercicios, selectedExercises, onToggle, onModify }: {
  ejercicios: ExerciseItem[]; selectedExercises: Set<string>;
  onToggle: (id: string) => void; onModify: (ex: ExerciseItem) => void;
}) {
  if (!ejercicios.length) return null;
  const sel = ejercicios.filter(e => selectedExercises.has(e.id)).length;
  return (
    <div className="ml-10 mt-2 space-y-2">
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{ejercicios.length}</span> ejercicio{ejercicios.length !== 1 ? "s" : ""}
        {sel > 0 && <span className="text-brand ml-1.5">· {sel} seleccionado{sel !== 1 ? "s" : ""}</span>}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ejercicios.map(ex => (
          <ExerciseCard key={ex.id} exercise={ex} selected={selectedExercises.has(ex.id)}
            onToggle={() => onToggle(ex.id)} onModify={onModify} />
        ))}
      </div>
    </div>
  );
}

function ExerciseToolCard({ part }: { part: { state: string; output?: unknown } }) {
  if (part.state === "input-streaming" || part.state === "input-available")
    return <div className="ml-10 mt-2 flex items-center gap-2 text-xs text-muted-foreground animate-fade-in"><Loader2 className="size-3.5 animate-spin text-brand" />Guardando ejercicio…</div>;
  if (part.state !== "output-available") return null;
  const r = part.output as { ok: boolean; name?: string; error?: string };
  return r.ok
    ? <div className="ml-10 mt-2 flex items-center gap-2.5 bg-brand/10 border border-brand/20 rounded-xl px-4 py-2.5 max-w-sm animate-scale-in">
        <CheckCircle2 className="size-4 text-brand shrink-0" />
        <span className="text-xs font-medium text-foreground">{r.name}</span>
        <span className="text-xs text-muted-foreground">guardado en tu biblioteca</span>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-brand bg-brand/10 px-1.5 py-0.5 rounded-full border border-brand/20 ml-auto shrink-0"><Sparkles className="size-2.5" /> IA</span>
      </div>
    : <div className="ml-10 mt-2 flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5 max-w-sm animate-fade-in">
        <XCircle className="size-4 text-destructive shrink-0" /><span className="text-xs text-destructive">{r.error}</span>
      </div>;
}

function SessionCreatedCard({ part }: { part: { state: string; output?: unknown } }) {
  const router = useRouter();
  if (part.state === "input-streaming" || part.state === "input-available")
    return <div className="ml-10 mt-2 flex items-center gap-2 text-xs text-muted-foreground animate-fade-in"><Loader2 className="size-3.5 animate-spin text-brand" />Creando sesión…</div>;
  if (part.state !== "output-available") return null;
  const r = part.output as { ok: boolean; sessionId?: string; title?: string; totalDuration?: number; error?: string };
  if (!r.ok)
    return <div className="ml-10 mt-2 flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5 max-w-sm animate-fade-in">
      <XCircle className="size-4 text-destructive shrink-0" /><span className="text-xs text-destructive">{r.error}</span>
    </div>;
  return (
    <div className="ml-10 mt-2 flex items-center gap-3 bg-brand/10 border border-brand/25 rounded-xl px-4 py-3 max-w-sm animate-scale-in">
      <div className="size-8 rounded-lg bg-brand/20 flex items-center justify-center shrink-0">
        <CalendarCheck className="size-4 text-brand" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">{r.title}</p>
        {r.totalDuration ? <p className="text-xs text-muted-foreground">{r.totalDuration} min</p> : null}
      </div>
      <button onClick={() => router.push(`/sessions/${r.sessionId}`)}
        className="text-xs font-semibold text-brand border border-brand/30 px-3 py-1.5 rounded-lg hover:bg-brand/10 transition-colors shrink-0">
        Ver sesión
      </button>
    </div>
  );
}

function QuestionForm({ preguntas, onSubmit }: { preguntas: Pregunta[]; onSubmit: (a: Record<string, string>) => void }) {
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(preguntas.map(p => [p.id, ""])));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(values); }}
      className="ml-10 mt-2 bg-muted/40 border border-border rounded-xl p-4 space-y-3 max-w-xs">
      {preguntas.map(p => (
        <div key={p.id} className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{p.label}</label>
          {p.tipo === "select" && p.opciones
            ? <select value={values[p.id]} onChange={e => setValues(v => ({ ...v, [p.id]: e.target.value }))} required
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30">
                <option value="">Selecciona…</option>
                {p.opciones.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            : <input type={p.tipo === "numero" ? "number" : "text"} value={values[p.id]}
                onChange={e => setValues(v => ({ ...v, [p.id]: e.target.value }))}
                placeholder={p.placeholder ?? ""} required min={p.tipo === "numero" ? 1 : undefined}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30" />
          }
        </div>
      ))}
      <button type="submit" className="w-full text-sm font-semibold bg-brand text-brand-foreground rounded-lg py-2 hover:bg-brand/90 transition-colors">Enviar</button>
    </form>
  );
}

function StudentPickerCard({ part, onSend }: {
  part: { state: string; output?: unknown };
  onSend: (text: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = useState(false);

  if (part.state === "input-streaming" || part.state === "input-available")
    return <div className="ml-10 mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin text-brand" />Cargando alumnos…</div>;
  if (part.state !== "output-available") return null;

  const r = part.output as { estudiantes: StudentItem[]; pregunta?: string };
  const estudiantes = r.estudiantes ?? [];

  if (confirmed) {
    return (
      <div className="ml-10 mt-2 flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-xl px-4 py-2.5 max-w-sm">
        <CheckCircle2 className="size-4 text-brand shrink-0" />
        <span className="text-xs text-muted-foreground">Selección confirmada</span>
      </div>
    );
  }

  if (estudiantes.length === 0) {
    return (
      <div className="ml-10 mt-2 bg-muted/40 border border-border rounded-xl p-4 max-w-sm space-y-2">
        <p className="text-xs text-muted-foreground">Aún no tienes alumnos — puedes crear uno.</p>
        <Link href="/students/new"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand border border-brand/30 px-3 py-1.5 rounded-lg hover:bg-brand/10 transition-colors">
          <UserPlus className="size-3.5" /> Crear alumno
        </Link>
      </div>
    );
  }

  function toggle(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function confirm() {
    const names = estudiantes
      .filter(s => selected.has(s.id))
      .map(s => {
        const lvl = s.playerLevel ? ` (${LEVEL_LABEL[s.playerLevel] ?? s.playerLevel})` : "";
        return `${s.name}${lvl}`;
      });
    const text = names.length > 0
      ? `He seleccionado a: ${names.join(", ")}`
      : "Continuar sin seleccionar alumnos específicos";
    setConfirmed(true);
    onSend(text);
  }

  return (
    <div className="ml-10 mt-2 bg-card border border-border rounded-xl p-4 max-w-sm space-y-3">
      <p className="text-xs font-semibold text-foreground">
        {r.pregunta ?? "¿Para quién es esta sesión?"}
      </p>
      <div className="space-y-2">
        {estudiantes.map(s => {
          const isSelected = selected.has(s.id);
          const levelColor = s.playerLevel ? (LEVEL_COLOR[s.playerLevel] ?? "") : "";
          return (
            <div key={s.id} onClick={() => toggle(s.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 border cursor-pointer transition-all",
                isSelected ? "bg-brand/8 border-brand/40" : "bg-muted/30 border-border hover:border-brand/30"
              )}>
              <div className={cn("size-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                isSelected ? "bg-brand border-brand" : "border-muted-foreground/30")}>
                {isSelected && <Check className="size-2.5 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
              </div>
              {s.playerLevel && (
                <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0", levelColor)}>
                  {LEVEL_LABEL[s.playerLevel] ?? s.playerLevel}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={confirm}
        className="w-full text-sm font-semibold bg-brand text-brand-foreground rounded-lg py-2 hover:bg-brand/90 transition-colors">
        Confirmar selección
      </button>
    </div>
  );
}

function CrearAlumnoCard({ part }: { part: { state: string; output?: unknown } }) {
  if (part.state === "input-streaming" || part.state === "input-available")
    return <div className="ml-10 mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin text-brand" />Creando alumno…</div>;
  if (part.state !== "output-available") return null;
  const r = part.output as { ok: boolean; id?: string; name?: string; error?: string };
  if (!r.ok)
    return (
      <div className="ml-10 mt-2 flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5 max-w-sm">
        <XCircle className="size-4 text-destructive shrink-0" /><span className="text-xs text-destructive">{r.error}</span>
      </div>
    );
  return (
    <div className="ml-10 mt-2 flex items-center gap-3 bg-brand/10 border border-brand/25 rounded-xl px-4 py-3 max-w-sm">
      <div className="size-8 rounded-lg bg-brand/20 flex items-center justify-center shrink-0">
        <UserPlus className="size-4 text-brand" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">Alumno creado</p>
        <p className="text-xs text-muted-foreground truncate">{r.name}</p>
      </div>
      <Link href={`/students/${r.id}`}
        className="text-xs font-semibold text-brand border border-brand/30 px-3 py-1.5 rounded-lg hover:bg-brand/10 transition-colors shrink-0">
        Ver perfil
      </Link>
    </div>
  );
}

function ConfigurarSesionMetaCard({ part, onSend }: {
  part: { state: string; output?: unknown };
  onSend: (text: string) => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const output = part.output as SessionMetaInput | undefined;

  const [objective, setObjective] = useState(output?.objective ?? "");
  const [intensity, setIntensity] = useState<number>(output?.intensity ?? 3);
  const [location, setLocation] = useState(output?.location ?? "");
  const [tagsInput, setTagsInput] = useState((output?.tags ?? []).join(", "));
  const [scheduledAt, setScheduledAt] = useState(output?.scheduledAt ?? "");

  if (part.state === "input-streaming" || part.state === "input-available")
    return <div className="ml-10 mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin text-brand" />Preparando configuración…</div>;
  if (part.state !== "output-available") return null;

  if (confirmed) {
    return (
      <div className="ml-10 mt-2 flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-xl px-4 py-2.5 max-w-sm">
        <CheckCircle2 className="size-4 text-brand shrink-0" />
        <span className="text-xs text-muted-foreground">Configuración confirmada</span>
      </div>
    );
  }

  function confirm() {
    const text = [
      "[FORM_META_CONFIRMED]",
      `objetivo=${objective.trim()}`,
      `intensidad=${intensity}`,
      `ubicacion=${location.trim()}`,
      `etiquetas=${tagsInput.trim()}`,
      `fecha=${scheduledAt.trim()}`,
    ].join(" | ");
    setConfirmed(true);
    onSend(text);
  }

  return (
    <div className="ml-10 mt-2 bg-card border border-border rounded-xl p-4 max-w-sm space-y-3">
      <p className="text-xs font-semibold text-foreground">Configurar sesión</p>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          Objetivo
        </label>
        <textarea value={objective} onChange={e => setObjective(e.target.value)} rows={2}
          placeholder="Ej. Mejorar la volea de derecha bajo presión"
          className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none" />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Flame className="size-3" /> Intensidad
        </label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} type="button" onClick={() => setIntensity(n)}
              className={cn(
                "flex-1 text-xs font-semibold py-1.5 rounded-lg border transition-all",
                intensity === n
                  ? "bg-brand text-brand-foreground border-brand"
                  : "bg-background border-border text-muted-foreground hover:border-brand/30"
              )}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <MapPin className="size-3" /> Ubicación
        </label>
        <input type="text" value={location} onChange={e => setLocation(e.target.value)}
          placeholder="Ej. Pista 3 - Club Pádel Norte"
          className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30" />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Tag className="size-3" /> Etiquetas <span className="font-normal">(separadas por coma)</span>
        </label>
        <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)}
          placeholder="Ej. técnica, volea, avanzado"
          className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30" />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Fecha y hora</label>
        <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
          className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30" />
      </div>

      <button onClick={confirm}
        className="w-full text-sm font-semibold bg-brand text-brand-foreground rounded-lg py-2 hover:bg-brand/90 transition-colors">
        Confirmar y crear sesión
      </button>
    </div>
  );
}

function BuscarContextoCard({ part }: { part: { state: string; output?: unknown } }) {
  if (part.state === "input-streaming" || part.state === "input-available")
    return <div className="ml-10 mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin text-brand" />Buscando…</div>;
  if (part.state !== "output-available") return null;
  const r = part.output as BuscarContextoResult;
  if (!r?.resultados?.length)
    return <div className="ml-10 mt-2 text-xs text-muted-foreground">Sin resultados.</div>;

  const iconForTipo = (tipo: string) => {
    if (tipo === "ejercicio") return <Dumbbell className="size-3.5 text-blue-400 shrink-0" />;
    if (tipo === "sesion") return <Calendar className="size-3.5 text-purple-400 shrink-0" />;
    return <GraduationCap className="size-3.5 text-brand shrink-0" />;
  };

  const labelForTipo: Record<string, string> = { ejercicio: "Ejercicios", sesion: "Sesiones", alumno: "Alumnos" };

  return (
    <div className="ml-10 mt-2 bg-card border border-border rounded-xl p-3 max-w-sm space-y-2">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{labelForTipo[r.tipo] ?? r.tipo}</p>
      <div className="space-y-1">
        {r.resultados.map((item) => {
          const name = item.name ?? item.title ?? "";
          const subtitle = item.category ?? (item.scheduledAt ? new Date(item.scheduledAt).toLocaleDateString("es-ES") : null) ?? item.playerLevel ?? null;
          return (
            <div key={item.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/40">
              {iconForTipo(r.tipo)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{name}</p>
                {subtitle && <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnalizarAlumnoCard({ part }: { part: { state: string; output?: unknown } }) {
  if (part.state === "input-streaming" || part.state === "input-available")
    return <div className="ml-10 mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin text-brand" />Analizando alumno…</div>;
  if (part.state !== "output-available") return null;

  type AlumnoData = {
    ok: boolean;
    student?: { id: string; name: string; playerLevel: string | null; dominantHand: string | null; notes: string | null; yearsExperience: number | null };
    totalSessions?: number;
    recentSessions?: Array<{ id: string; title: string; scheduledAt: string | Date; durationMinutes: number; objective: string | null; intensity: number | null }>;
    error?: string;
  };
  const r = part.output as AlumnoData;

  if (!r.ok)
    return <div className="ml-10 mt-2 flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5 max-w-sm">
      <XCircle className="size-4 text-destructive shrink-0" /><span className="text-xs text-destructive">{r.error}</span>
    </div>;

  const { student, totalSessions = 0, recentSessions = [] } = r;
  if (!student) return null;
  const levelColor = student.playerLevel ? (LEVEL_COLOR[student.playerLevel] ?? "") : "";

  return (
    <div className="ml-10 mt-2 bg-card border border-border rounded-xl p-4 max-w-sm space-y-3">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
          <GraduationCap className="size-5 text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{student.name}</p>
            {student.playerLevel && (
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0", levelColor)}>
                {LEVEL_LABEL[student.playerLevel] ?? student.playerLevel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
            {student.dominantHand && <span>{student.dominantHand === "right" ? "Diestra" : "Zurda"}</span>}
            {student.yearsExperience != null && <span>{student.yearsExperience} años exp.</span>}
          </div>
        </div>
      </div>

      {student.notes && (
        <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 italic">{student.notes}</p>
      )}

      <div className="bg-muted/40 rounded-lg px-3 py-2 text-center">
        <p className="text-xl font-bold text-foreground">{totalSessions}</p>
        <p className="text-[10px] text-muted-foreground">sesiones registradas</p>
      </div>

      {recentSessions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Últimas sesiones</p>
          {recentSessions.slice(0, 4).map(s => (
            <div key={s.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-muted/30">
              <Calendar className="size-3 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{s.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(s.scheduledAt).toLocaleDateString("es-ES")} · {s.durationMinutes} min
                </p>
              </div>
              {s.intensity != null && (
                <div className="flex gap-0.5 shrink-0">
                  {[1, 2, 3, 4, 5].map(n => (
                    <span key={n} className={cn("size-1.5 rounded-full", n <= s.intensity! ? "bg-brand" : "bg-muted-foreground/20")} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Link href={`/students/${student.id}`}
        className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-brand border border-brand/30 px-3 py-1.5 rounded-lg hover:bg-brand/10 transition-colors">
        Ver perfil completo <ChevronRight className="size-3" />
      </Link>
    </div>
  );
}

function SesionesSimilaresCard({ part }: { part: { state: string; output?: unknown } }) {
  if (part.state === "input-streaming" || part.state === "input-available")
    return <div className="ml-10 mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin text-brand" />Buscando sesiones…</div>;
  if (part.state !== "output-available") return null;

  type SesionItem = { id: string; title: string; scheduledAt: string | Date; durationMinutes: number; objective: string | null; intensity: number | null; tags: string[] | null };
  const r = part.output as { sesiones: SesionItem[] };

  if (!r.sesiones?.length)
    return <div className="ml-10 mt-2 text-xs text-muted-foreground">No se encontraron sesiones.</div>;

  return (
    <div className="ml-10 mt-2 space-y-2">
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{r.sesiones.length}</span> sesión{r.sesiones.length !== 1 ? "es" : ""} encontrada{r.sesiones.length !== 1 ? "s" : ""}
      </p>
      <div className="space-y-2">
        {r.sesiones.map(s => (
          <Link key={s.id} href={`/sessions/${s.id}`}
            className="flex items-center gap-3 bg-card border border-border hover:border-brand/30 rounded-xl px-3.5 py-3 transition-all group block">
            <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Calendar className="size-4 text-muted-foreground group-hover:text-brand transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                <span>{new Date(s.scheduledAt).toLocaleDateString("es-ES")}</span>
                <span>·</span>
                <span>{s.durationMinutes} min</span>
                {s.intensity != null && <><span>·</span><span>Intensidad {s.intensity}/5</span></>}
              </div>
              {s.objective && <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">{s.objective}</p>}
              {s.tags && s.tags.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {s.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <ChevronRight className="size-4 text-muted-foreground group-hover:text-brand transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function MentionPopover({ query, results, loading, onSelect }: {
  query: string;
  results: MentionResult[];
  loading: boolean;
  onSelect: (r: MentionResult) => void;
}) {
  const grouped = {
    ejercicio: results.filter(r => r.type === "ejercicio") as Extract<MentionResult, { type: "ejercicio" }>[],
    sesion: results.filter(r => r.type === "sesion") as Extract<MentionResult, { type: "sesion" }>[],
    alumno: results.filter(r => r.type === "alumno") as Extract<MentionResult, { type: "alumno" }>[],
  };
  const hasResults = results.length > 0;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-popover border border-border rounded-xl shadow-xl overflow-hidden max-h-[250px] overflow-y-auto">
      {loading && (
        <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin text-brand" /> Buscando…
        </div>
      )}
      {!loading && !hasResults && (
        <div className="px-3 py-2.5 text-xs text-muted-foreground">Sin resultados para &apos;@{query}&apos;</div>
      )}
      {!loading && hasResults && (
        <div className="py-1">
          {grouped.ejercicio.length > 0 && (
            <>
              <p className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Ejercicios</p>
              {grouped.ejercicio.map(r => (
                <button key={r.id} onClick={() => onSelect(r)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted transition-colors text-left">
                  <Dumbbell className="size-3.5 text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{r.category} · {r.durationMinutes} min</p>
                  </div>
                </button>
              ))}
            </>
          )}
          {grouped.sesion.length > 0 && (
            <>
              <p className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Sesiones</p>
              {grouped.sesion.map(r => (
                <button key={r.id} onClick={() => onSelect(r)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted transition-colors text-left">
                  <Calendar className="size-3.5 text-purple-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{r.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{new Date(r.scheduledAt).toLocaleDateString("es-ES")}</p>
                  </div>
                </button>
              ))}
            </>
          )}
          {grouped.alumno.length > 0 && (
            <>
              <p className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Alumnos</p>
              {grouped.alumno.map(r => (
                <button key={r.id} onClick={() => onSelect(r)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted transition-colors text-left">
                  <GraduationCap className="size-3.5 text-brand shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{r.name}</p>
                    {r.playerLevel && <p className="text-[10px] text-muted-foreground truncate">{LEVEL_LABEL[r.playerLevel] ?? r.playerLevel}</p>}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main chat component ───────────────────────────────────────────────────────

export function DrPlannerChat({ chatId, initialTitle, initialMessages }: {
  chatId: string;
  initialTitle: string;
  initialMessages: Record<string, unknown>[];
}) {
  const router = useRouter();
  const { messages, sendMessage, status, setMessages, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/dr-planner" }),
    messages: initialMessages as unknown as UIMessage[],
  });

  const [input, setInput] = useState("");
  const [title, setTitle] = useState(initialTitle);
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevStatus = useRef(status);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);

  // @mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<MentionResult[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const mentionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLoading = status === "streaming" || status === "submitted";
  const lastMsgId = messages[messages.length - 1]?.id;

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keep ref in sync so unmount/interval closures always see latest messages
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Save when stream completes normally
  useEffect(() => {
    if (prevStatus.current !== "ready" && status === "ready" && messages.length > 0) {
      fetch(`/api/dr-planner/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      }).then(async (res) => {
        const data = await res.json();
        if (data.data?.title && data.data.title !== title) setTitle(data.data.title);
      }).catch(() => {});
    }
    prevStatus.current = status;
  }, [status]);

  // Auto-save every 10s while streaming so work isn't lost mid-generation
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      if (messagesRef.current.length === 0) return;
      fetch(`/api/dr-planner/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesRef.current }),
      }).catch(() => {});
    }, 10_000);
    return () => clearInterval(interval);
  }, [isLoading, chatId]);

  // Save on unmount (page navigation) using keepalive so the request survives
  useEffect(() => {
    return () => {
      if (messagesRef.current.length === 0) return;
      fetch(`/api/dr-planner/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesRef.current }),
        keepalive: true,
      }).catch(() => {});
    };
  }, [chatId]);

  // Fetch mention results when mentionQuery changes
  useEffect(() => {
    if (mentionQuery === null) { setMentionResults([]); return; }
    if (mentionDebounceRef.current) clearTimeout(mentionDebounceRef.current);
    mentionDebounceRef.current = setTimeout(async () => {
      setMentionLoading(true);
      const q = encodeURIComponent(mentionQuery);
      const [exRes, sesRes, stuRes] = await Promise.allSettled([
        fetch(`/api/exercises?search=${q}&limit=4`).then(r => r.ok ? r.json() : null),
        fetch(`/api/sessions?limit=4`).then(r => r.ok ? r.json() : null),
        fetch(`/api/students`).then(r => r.ok ? r.json() : null),
      ]);
      const combined: MentionResult[] = [];
      if (exRes.status === "fulfilled" && exRes.value?.data) {
        const items = (exRes.value.data as Array<{ id: string; name: string; category: string; durationMinutes: number }>)
          .filter(e => !mentionQuery || e.name.toLowerCase().includes(mentionQuery.toLowerCase()))
          .slice(0, 4);
        combined.push(...items.map(e => ({ type: "ejercicio" as const, id: e.id, name: e.name, category: e.category, durationMinutes: e.durationMinutes })));
      }
      if (sesRes.status === "fulfilled" && sesRes.value?.data) {
        const items = (sesRes.value.data as Array<{ id: string; title: string; scheduledAt: string }>)
          .filter(s => !mentionQuery || s.title.toLowerCase().includes(mentionQuery.toLowerCase()))
          .slice(0, 4);
        combined.push(...items.map(s => ({ type: "sesion" as const, id: s.id, title: s.title, scheduledAt: s.scheduledAt })));
      }
      if (stuRes.status === "fulfilled" && stuRes.value?.data) {
        const items = (stuRes.value.data as Array<{ id: string; name: string; playerLevel: string | null }>)
          .filter(s => !mentionQuery || s.name.toLowerCase().includes(mentionQuery.toLowerCase()))
          .slice(0, 4);
        combined.push(...items.map(s => ({ type: "alumno" as const, id: s.id, name: s.name, playerLevel: s.playerLevel ?? null })));
      }
      setMentionResults(combined);
      setMentionLoading(false);
    }, 200);
  }, [mentionQuery]);

  // Close mention popover on click outside
  useEffect(() => {
    if (mentionQuery === null) return;
    function onClickOutside(e: MouseEvent) {
      if (inputWrapperRef.current && !inputWrapperRef.current.contains(e.target as Node)) {
        setMentionQuery(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [mentionQuery]);

  const toggleExercise = useCallback((id: string) => {
    setSelectedExercises(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const handleModify = useCallback((ex: ExerciseItem) => {
    setInput(`Quiero modificar el ejercicio "${ex.name}": `);
    textareaRef.current?.focus();
  }, []);

  const handleSend = useCallback((text: string) => {
    if (!text || isLoading) return;
    sendMessage({ text });
  }, [isLoading, sendMessage]);

  function submit() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    setMentionQuery(null);
    sendMessage({ text });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") { setMentionQuery(null); return; }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setInput(val);
    // Detect @mention: find last @ before cursor
    const cursor = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const atIdx = textBeforeCursor.lastIndexOf("@");
    if (atIdx !== -1) {
      const afterAt = textBeforeCursor.slice(atIdx + 1);
      // Only open if no space in the query (space closes it)
      if (!afterAt.includes(" ")) {
        setMentionQuery(afterAt);
        return;
      }
    }
    setMentionQuery(null);
  }

  function handleMentionSelect(r: MentionResult) {
    const label = r.type === "sesion" ? r.title : r.name;
    const replacement = `@[${label}]`;
    // Find and replace the @query in the input
    const cursor = textareaRef.current?.selectionStart ?? input.length;
    const textBeforeCursor = input.slice(0, cursor);
    const atIdx = textBeforeCursor.lastIndexOf("@");
    if (atIdx !== -1) {
      const newVal = input.slice(0, atIdx) + replacement + input.slice(cursor);
      setInput(newVal);
      // Move cursor after the replacement
      setTimeout(() => {
        const newCursor = atIdx + replacement.length;
        textareaRef.current?.setSelectionRange(newCursor, newCursor);
        textareaRef.current?.focus();
      }, 0);
    }
    setMentionQuery(null);
  }

  function getMessageText(m: (typeof messages)[number]) {
    return m.parts.map(p => p.type === "text" ? p.text : "").filter(Boolean).join("\n");
  }

  async function handleDelete() {
    await fetch(`/api/dr-planner/chats/${chatId}`, { method: "DELETE" });
    router.push("/sessions/dr-planner");
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] md:h-dvh">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-3.5 border-b border-border bg-card/50 backdrop-blur shrink-0">
        <Link href="/sessions/dr-planner"
          className="size-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="size-7 rounded-full bg-brand/15 border border-brand/20 flex items-center justify-center shrink-0">
            <Bot className="size-3.5 text-brand" />
          </div>
          <p className="text-sm font-medium text-foreground truncate">{title}</p>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              title="Limpiar conversación"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted">
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
          <button onClick={handleDelete}
            className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 max-w-lg mx-auto text-center pb-4">
            <div className="size-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
              <Bot className="size-7 text-brand" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground mb-1.5">Dr. Planner</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Describe el nivel del grupo, la duración disponible y los objetivos. Diseñaré el plan usando tu biblioteca de ejercicios.
              </p>
            </div>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
              {["Sesión de 60 min para nivel intermedio", "Técnica de volea para principiantes", "Entrenamiento físico para competición", "Táctica de juego de red para parejas"]
                .map(s => (
                  <button key={s} onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                    className="text-left text-xs text-muted-foreground bg-muted/50 hover:bg-muted border border-border hover:border-brand/30 rounded-xl px-3.5 py-3 transition-all">
                    {s}
                  </button>
                ))}
            </div>
          </div>
        ) : (
          <div className="py-5 space-y-4 max-w-5xl mx-auto">
            {messages.map(m => {
              const text = getMessageText(m);
              const parts = m.parts as Array<{ type: string; [k: string]: unknown }>;
              const showParts = getToolParts(parts, "mostrar_ejercicios");
              const ejerciciosAvanzadoParts = getToolParts(parts, "buscar_ejercicios_avanzado");
              const createParts = getToolParts(parts, "crear_ejercicio");
              const sessionParts = getToolParts(parts, "crear_sesion");
              const alumnosParts = getToolParts(parts, "seleccionar_alumnos");
              const crearAlumnoParts = getToolParts(parts, "crear_alumno");
              const sesionMetaParts = getToolParts(parts, "configurar_sesion_meta");
              const buscarContextoParts = getToolParts(parts, "buscar_contexto");
              const analizarAlumnoParts = getToolParts(parts, "analizar_alumno");
              const sesionesSimilaresParts = getToolParts(parts, "buscar_sesiones_similares");
              const questions = m.role === "assistant" && m.id === lastMsgId && !isLoading ? parseQuestions(text) : null;
              const reasoningParts = m.role === "assistant"
                ? (m.parts as Array<{ type: string; text?: string; state?: string }>)
                    .filter(p => p.type === "reasoning" && typeof p.text === "string")
                : [];
              return (
                <div key={m.id} className="space-y-2 animate-fade-up">
                  {reasoningParts.map((p, i) => (
                    <ReasoningBubble
                      key={`r-${i}`}
                      text={p.text ?? ""}
                      streaming={p.state === "streaming" || (isLoading && m.id === lastMsgId && i === reasoningParts.length - 1 && p.state !== "done")}
                    />
                  ))}
                  <MarkdownBubble role={m.role} content={text} />
                  {alumnosParts.map((p, i) => (
                    <StudentPickerCard key={i} part={p as { state: string; output?: unknown }} onSend={handleSend} />
                  ))}
                  {crearAlumnoParts.map((p, i) => (
                    <CrearAlumnoCard key={i} part={p as { state: string; output?: unknown }} />
                  ))}
                  {sesionMetaParts.map((p, i) => (
                    <ConfigurarSesionMetaCard key={i} part={p as { state: string; output?: unknown }} onSend={handleSend} />
                  ))}
                  {buscarContextoParts.map((p, i) => (
                    <BuscarContextoCard key={i} part={p as { state: string; output?: unknown }} />
                  ))}
                  {analizarAlumnoParts.map((p, i) => (
                    <AnalizarAlumnoCard key={i} part={p as { state: string; output?: unknown }} />
                  ))}
                  {sesionesSimilaresParts.map((p, i) => (
                    <SesionesSimilaresCard key={i} part={p as { state: string; output?: unknown }} />
                  ))}
                  {[...showParts, ...ejerciciosAvanzadoParts].map((p, i) => {
                    if (p.state !== "output-available") return null;
                    const d = p.output as { ejercicios?: ExerciseItem[] };
                    if (!d?.ejercicios?.length) return null;
                    return <ExerciseGrid key={i} ejercicios={d.ejercicios} selectedExercises={selectedExercises} onToggle={toggleExercise} onModify={handleModify} />;
                  })}
                  {createParts.map((p, i) => <ExerciseToolCard key={i} part={p as { state: string; output?: unknown }} />)}
                  {sessionParts.map((p, i) => <SessionCreatedCard key={i} part={p as { state: string; output?: unknown }} />)}
                  {questions && <QuestionForm preguntas={questions} onSubmit={a => sendMessage({ text: questions.map(p => `${p.label}: ${a[p.id]}`).join(", ") })} />}
                </div>
              );
            })}
            {isLoading && (() => {
              const last = messages[messages.length - 1];
              const lastParts = (last?.parts ?? []) as AnyPart[];
              const lastIsAssistant = last?.role === "assistant";
              const hasVisibleText = lastIsAssistant && getMessageText(last).replace(/<preguntas>[\s\S]*?<\/preguntas>/g, "").trim().length > 0;
              const lastReasoning = lastIsAssistant
                ? [...lastParts].reverse().find(p => p.type === "reasoning" && typeof p.text === "string" && p.text!.trim().length > 0)
                : undefined;
              const isReasoningStreaming = lastReasoning?.state !== "done" && !hasVisibleText;
              if (lastIsAssistant && lastReasoning && isReasoningStreaming) return null;
              const activity = lastIsAssistant ? findCurrentActivity(lastParts) : null;
              const label = status === "submitted"
                ? "Conectando…"
                : activity ?? (hasVisibleText ? "Redactando respuesta…" : "Pensando…");
              return (
                <div className="flex gap-3 justify-start">
                  <div className="size-7 rounded-full bg-brand/15 border border-brand/20 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="size-3.5 text-brand" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-2.5">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full rounded-full bg-brand/60 opacity-75 animate-ping" />
                      <span className="relative inline-flex size-2 rounded-full bg-brand" />
                    </span>
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="flex gap-0.5">
                      <span className="size-1 rounded-full bg-brand/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="size-1 rounded-full bg-brand/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="size-1 rounded-full bg-brand/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                </div>
              );
            })()}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Floating bar — exercises selected */}
      {selectedExercises.size > 0 && (
        <div className="shrink-0 px-4 md:px-6 py-3 border-t border-brand/25 bg-brand/5">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="size-6 rounded-lg bg-brand flex items-center justify-center">
                <span className="text-[11px] font-bold text-white">{selectedExercises.size}</span>
              </div>
              <span className="text-sm font-medium text-foreground">
                ejercicio{selectedExercises.size !== 1 ? "s" : ""} seleccionado{selectedExercises.size !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedExercises(new Set())}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="size-3.5" /> Limpiar
              </button>
              <button onClick={() => router.push(`/sessions/new?exercises=${Array.from(selectedExercises).join(",")}`)}
                className="flex items-center gap-1.5 text-sm font-semibold bg-brand text-brand-foreground px-4 py-2 rounded-xl hover:bg-brand/90 transition-colors">
                <Plus className="size-4" /> Crear sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input — fixed bottom with safe area padding on mobile */}
      <div className="shrink-0 px-4 md:px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border bg-card/50 backdrop-blur">
        <div className="max-w-5xl mx-auto">
          <div ref={inputWrapperRef} className="relative">
            {mentionQuery !== null && (
              <MentionPopover
                query={mentionQuery}
                results={mentionResults}
                loading={mentionLoading}
                onSelect={handleMentionSelect}
              />
            )}
            <div className="flex gap-2 items-end bg-background border border-border rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-brand/30 focus-within:border-brand/50 transition-all">
              <textarea ref={textareaRef} value={input} onChange={handleInputChange}
                onKeyDown={handleKeyDown} placeholder="Describe la sesión que necesitas… (escribe @ para mencionar)" rows={1}
                className="flex-1 text-sm bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground resize-none max-h-32 py-1" />
              {isLoading ? (
                <button type="button" onClick={() => {
                  stop();
                  fetch(`/api/dr-planner/chats/${chatId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ messages }),
                  }).catch(() => {});
                }}
                  className="size-8 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive flex items-center justify-center hover:bg-destructive/25 transition-colors shrink-0"
                  title="Detener generación">
                  <X className="size-3.5" />
                </button>
              ) : (
                <button type="button" onClick={submit} disabled={!input.trim()}
                  className="size-8 rounded-xl bg-brand text-brand-foreground flex items-center justify-center hover:bg-brand/90 transition-colors disabled:opacity-40 shrink-0">
                  <Send className="size-3.5" />
                </button>
              )}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-1.5">
            Intro para enviar · Shift+Intro para nueva línea · @ para mencionar
          </p>
        </div>
      </div>
    </div>
  );
}
