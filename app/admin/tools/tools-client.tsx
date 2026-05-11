"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Loader2,
  MessageSquare,
  FileText,
  Trash2,
  Download,
  RefreshCw,
  Bot,
  Users,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminPanelClass } from "../_components/admin-ui";

interface DbStats {
  users: number;
  exercises: number;
  sessions: number;
  exerciseDrafts: number;
  sessionDrafts: number;
  aiEvents: number;
  chats: number;
  messages: number;
  embeddings: number;
}

interface Props {
  stats: DbStats;
}

type ActionStatus = "idle" | "running" | "done" | "error";

interface ActionResult {
  status: ActionStatus;
  message: string;
}

async function runAction(action: string, extra?: Record<string, unknown>) {
  const res = await fetch("/api/admin/tools", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...extra }),
  });
  const data = (await res.json()) as {
    deleted?: number;
    error?: string;
  } & Record<string, number>;
  if (!res.ok) throw new Error(data.error ?? "Error interno");
  return data;
}

function StatRow({
  icon: Icon,
  label,
  value,
  dimmed,
}: {
  icon: typeof Database;
  label: string;
  value: number;
  dimmed?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex items-center gap-2.5">
        <Icon
          className={cn(
            "size-4 shrink-0",
            dimmed ? "text-foreground/30" : "text-brand"
          )}
        />
        <span
          className={cn(
            "text-sm",
            dimmed ? "text-foreground/45" : "text-foreground"
          )}
        >
          {label}
        </span>
      </div>
      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
        {value.toLocaleString("es-ES")}
      </span>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  danger,
  children,
}: {
  icon: typeof Trash2;
  title: string;
  description: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        adminPanelClass,
        danger ? "border-destructive/20" : "border-foreground/12"
      )}
    >
      <div className="flex items-start gap-3 border-b border-foreground/10 px-5 py-4">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md border",
            danger
              ? "border-destructive/20 bg-destructive/8 text-destructive"
              : "border-[#D6FF38]/35 bg-[#D6FF38]/14 text-[#6F8500] dark:text-[#D6FF38]"
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-xs text-foreground/50">{description}</p>
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function ResultBadge({ result }: { result: ActionResult | null }) {
  if (!result || result.status === "idle") return null;
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
        result.status === "running" && "bg-foreground/8 text-foreground/60",
        result.status === "done" && "bg-brand/10 text-brand",
        result.status === "error" && "bg-destructive/10 text-destructive"
      )}
    >
      {result.status === "running" && (
        <Loader2 className="size-3 animate-spin" />
      )}
      {result.status === "done" && <CheckCircle2 className="size-3" />}
      {result.status === "error" && <AlertTriangle className="size-3" />}
      {result.message}
    </div>
  );
}

export function AdminToolsClient({ stats: initialStats }: Props) {
  const [stats, setStats] = useState(initialStats);
  const [aiDays, setAiDays] = useState("90");
  const [draftDays, setDraftDays] = useState("30");
  const [results, setResults] = useState<Record<string, ActionResult>>({});
  const [confirm, setConfirm] = useState<string | null>(null);

  function setResult(key: string, result: ActionResult) {
    setResults((prev) => ({ ...prev, [key]: result }));
  }

  async function execute(
    key: string,
    action: string,
    extra?: Record<string, unknown>
  ) {
    setResult(key, { status: "running", message: "Ejecutando…" });
    setConfirm(null);
    try {
      const data = await runAction(action, extra);
      if ("deleted" in data) {
        setResult(key, {
          status: "done",
          message: `${data.deleted} registros eliminados.`,
        });
      } else {
        setResult(key, { status: "done", message: "Completado." });
      }
    } catch (err) {
      setResult(key, {
        status: "error",
        message: err instanceof Error ? err.message : "Error.",
      });
    }
  }

  async function refreshStats() {
    setResult("stats", { status: "running", message: "Actualizando…" });
    try {
      const data = await runAction("db_stats");
      setStats({
        users: data.users ?? stats.users,
        exercises: stats.exercises,
        sessions: stats.sessions,
        exerciseDrafts: data.exerciseDrafts ?? stats.exerciseDrafts,
        sessionDrafts: data.sessionDrafts ?? stats.sessionDrafts,
        aiEvents: data.aiEvents ?? stats.aiEvents,
        chats: data.chats ?? stats.chats,
        messages: data.messages ?? stats.messages,
        embeddings: stats.embeddings,
      });
      setResult("stats", { status: "done", message: "Actualizado." });
    } catch {
      setResult("stats", { status: "error", message: "Error al actualizar." });
    }
  }

  function exportUsersJson() {
    // Navigates to the users export — handled server-side
    window.open("/api/admin/users/export", "_blank");
  }

  return (
    <div className="flex flex-col gap-5">
      {/* DB snapshot */}
      <section className={adminPanelClass}>
        <div className="flex items-center justify-between border-b border-foreground/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md border border-[#D6FF38]/35 bg-[#D6FF38]/14 text-[#6F8500] dark:text-[#D6FF38]">
              <Database className="size-4" />
            </span>
            <div>
              <h2 className="font-heading text-sm font-semibold text-foreground">
                Snapshot de base de datos
              </h2>
              <p className="text-xs text-foreground/50">
                Recuento actual de registros por tabla.
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={refreshStats}
            disabled={results["stats"]?.status === "running"}
          >
            {results["stats"]?.status === "running" ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <RefreshCw data-icon="inline-start" />
            )}
            Refrescar
          </Button>
        </div>
        <div className="divide-y divide-foreground/8 px-5">
          <StatRow icon={Users} label="Usuarios" value={stats.users} />
          <StatRow icon={FileText} label="Ejercicios" value={stats.exercises} />
          <StatRow icon={Layers} label="Sesiones" value={stats.sessions} />
          <StatRow
            icon={MessageSquare}
            label="Chats Dr. Planner"
            value={stats.chats}
          />
          <StatRow
            icon={MessageSquare}
            label="Mensajes Dr. Planner"
            value={stats.messages}
          />
          <StatRow
            icon={Bot}
            label="Eventos IA registrados"
            value={stats.aiEvents}
          />
          <StatRow
            icon={Database}
            label="Embeddings generados"
            value={stats.embeddings}
          />
          <StatRow
            icon={FileText}
            label="Borradores ejercicios"
            value={stats.exerciseDrafts}
            dimmed
          />
          <StatRow
            icon={FileText}
            label="Borradores sesiones"
            value={stats.sessionDrafts}
            dimmed
          />
        </div>
      </section>

      {/* Cleanup tools */}
      <h2 className="font-heading text-base font-semibold text-foreground">
        Limpieza
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        <ActionCard
          icon={Bot}
          title="Purgar eventos IA antiguos"
          description="Elimina registros de uso de IA anteriores a N días. Esto no afecta chats ni mensajes."
          danger
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-foreground/60 shrink-0">
                Más antiguos de
              </label>
              <Input
                type="number"
                min={7}
                max={3650}
                value={aiDays}
                onChange={(e) => setAiDays(e.target.value)}
                className="h-8 w-20 text-center font-mono text-sm"
              />
              <span className="text-xs text-foreground/60 shrink-0">días</span>
            </div>
            {confirm === "ai_events" ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive">¿Confirmar?</span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    execute("ai_events", "purge_old_ai_events", {
                      days: Number(aiDays),
                    })
                  }
                >
                  Eliminar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirm(null)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="self-start border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => setConfirm("ai_events")}
              >
                <Trash2 data-icon="inline-start" />
                Purgar eventos
              </Button>
            )}
            <ResultBadge result={results["ai_events"] ?? null} />
          </div>
        </ActionCard>

        <ActionCard
          icon={FileText}
          title="Purgar borradores inactivos"
          description="Elimina borradores de ejercicios y sesiones no modificados en N días."
          danger
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-foreground/60 shrink-0">
                Sin cambios desde hace
              </label>
              <Input
                type="number"
                min={1}
                max={365}
                value={draftDays}
                onChange={(e) => setDraftDays(e.target.value)}
                className="h-8 w-16 text-center font-mono text-sm"
              />
              <span className="text-xs text-foreground/60 shrink-0">días</span>
            </div>
            {confirm === "drafts" ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive">¿Confirmar?</span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    execute("drafts", "purge_old_drafts", {
                      days: Number(draftDays),
                    })
                  }
                >
                  Eliminar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirm(null)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="self-start border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => setConfirm("drafts")}
              >
                <Trash2 data-icon="inline-start" />
                Purgar borradores
              </Button>
            )}
            <ResultBadge result={results["drafts"] ?? null} />
          </div>
        </ActionCard>

        <ActionCard
          icon={MessageSquare}
          title="Eliminar chats vacíos"
          description="Borra chats de Dr. Planner que se crearon pero no tienen ningún mensaje."
        >
          <div className="flex flex-col gap-3">
            <p className="text-xs text-foreground/50">
              Chats sin mensajes que quedan en la BD tras sesiones abandonadas.
            </p>
            {confirm === "empty_chats" ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive">¿Confirmar?</span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => execute("empty_chats", "purge_empty_chats")}
                >
                  Eliminar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirm(null)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="self-start"
                onClick={() => setConfirm("empty_chats")}
              >
                <Trash2 data-icon="inline-start" />
                Limpiar chats vacíos
              </Button>
            )}
            <ResultBadge result={results["empty_chats"] ?? null} />
          </div>
        </ActionCard>

        <ActionCard
          icon={Download}
          title="Exportar usuarios"
          description="Descarga un CSV con todos los usuarios registrados, fecha de alta y rol."
        >
          <div className="flex flex-col gap-3">
            <p className="text-xs text-foreground/50">
              El archivo incluye: id, nombre, email, admin, fecha de registro.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="self-start"
              onClick={exportUsersJson}
            >
              <Download data-icon="inline-start" />
              Descargar CSV
            </Button>
          </div>
        </ActionCard>
      </div>
    </div>
  );
}
