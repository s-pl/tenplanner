"use client";

import { useMemo, useState } from "react";
import type { AiModelOption } from "@/lib/ai/model-options";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, Lock, Save, Unlock } from "lucide-react";
import { toast } from "sonner";
import { adminPanelClass, adminTableShellClass } from "../_components/admin-ui";

interface TopUser {
  userId: string;
  name: string;
  email: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  requests: number;
  isRestricted: boolean;
  customMessage: string | null;
  dailyTokenLimit: number | null;
  monthlyTokenLimit: number | null;
  modelOverride: string | null;
  notes: string | null;
}

interface Props {
  topUsers: TopUser[];
  byModel: Array<{
    provider: string;
    model: string;
    requests: number;
    totalTokens: number;
    estimatedCostUsd: number;
  }>;
  byDay: Array<{ day: string; totalTokens: number; estimatedCostUsd: number }>;
  modelOptions: readonly AiModelOption[];
  monthlyBudgetUsd: number;
  totalCostUsd: number;
}

type Draft = {
  isRestricted: boolean;
  customMessage: string;
  dailyTokenLimit: string;
  monthlyTokenLimit: string;
  modelOverride: string;
  notes: string;
};

function formatTokens(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString("es-ES");
}

function formatCost(value: number) {
  return `$${value.toFixed(value >= 10 ? 2 : 4)}`;
}

function emptyDraft(user: TopUser): Draft {
  return {
    isRestricted: user.isRestricted,
    customMessage: user.customMessage ?? "",
    dailyTokenLimit: user.dailyTokenLimit?.toString() ?? "",
    monthlyTokenLimit: user.monthlyTokenLimit?.toString() ?? "",
    modelOverride: user.modelOverride ?? "__global",
    notes: user.notes ?? "",
  };
}

function parseLimit(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
}

export function AdminAiOperationsClient({
  topUsers,
  byModel,
  byDay,
  modelOptions,
  monthlyBudgetUsd,
  totalCostUsd,
}: Props) {
  const [rows, setRows] = useState(topUsers);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(topUsers.map((user) => [user.userId, emptyDraft(user)]))
  );
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [savedUserId, setSavedUserId] = useState<string | null>(null);

  const maxDayTokens = Math.max(...byDay.map((day) => day.totalTokens), 1);
  const maxModelTokens = Math.max(
    ...byModel.map((model) => model.totalTokens),
    1
  );
  const budgetPct =
    monthlyBudgetUsd > 0
      ? Math.min((totalCostUsd / monthlyBudgetUsd) * 100, 100)
      : 0;

  const restrictedUsers = useMemo(
    () => rows.filter((row) => row.isRestricted).length,
    [rows]
  );

  function updateDraft(userId: string, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [userId]: { ...current[userId], ...patch },
    }));
  }

  async function saveRestriction(user: TopUser, patch?: Partial<Draft>) {
    const draft = { ...drafts[user.userId], ...patch };
    setBusyUserId(user.userId);
    setSavedUserId(null);

    try {
      const res = await fetch(
        `/api/admin/ai/users/${user.userId}/restriction`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isRestricted: draft.isRestricted,
            customMessage: draft.customMessage.trim() || null,
            dailyTokenLimit: parseLimit(draft.dailyTokenLimit),
            monthlyTokenLimit: parseLimit(draft.monthlyTokenLimit),
            modelOverride:
              draft.modelOverride === "__global" ? null : draft.modelOverride,
            notes: draft.notes.trim() || null,
          }),
        }
      );

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "No se pudo guardar la restricción.");
      }

      const payload = (await res.json()) as {
        data: Pick<
          TopUser,
          | "isRestricted"
          | "customMessage"
          | "dailyTokenLimit"
          | "monthlyTokenLimit"
          | "modelOverride"
          | "notes"
        >;
      };

      setRows((current) =>
        current.map((row) =>
          row.userId === user.userId ? { ...row, ...payload.data } : row
        )
      );
      setDrafts((current) => ({
        ...current,
        [user.userId]: emptyDraft({ ...user, ...payload.data }),
      }));
      setSavedUserId(user.userId);
      window.setTimeout(() => setSavedUserId(null), 1200);
      toast.success("Restricción IA actualizada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error guardando");
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <Card className={adminPanelClass}>
          <CardHeader>
            <CardTitle>Consumo diario</CardTitle>
            <CardDescription>
              Tokens y coste estimado durante los últimos 30 días.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {byDay.length === 0 ? (
              <div className="rounded-lg border border-dashed border-foreground/15 px-4 py-10 text-center text-sm text-foreground/45">
                Aún no hay eventos de uso registrados.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {byDay.slice(-18).map((day) => {
                  const width = Math.max(
                    4,
                    (day.totalTokens / maxDayTokens) * 100
                  );
                  return (
                    <div
                      key={day.day}
                      className="grid grid-cols-[4.5rem_1fr_5.5rem] items-center gap-3"
                    >
                      <span className="font-mono text-[10px] text-foreground/40">
                        {new Date(day.day).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                      <div className="h-2 overflow-hidden rounded-full bg-foreground/8">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="text-right font-mono text-[10px] text-foreground/50">
                        {formatTokens(day.totalTokens)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={adminPanelClass}>
          <CardHeader>
            <CardTitle>Modelos y presupuesto</CardTitle>
            <CardDescription>
              Distribución por modelo y presión sobre el presupuesto mensual.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-foreground/50">
                <span>Presupuesto mensual</span>
                <span>
                  {formatCost(totalCostUsd)} / {formatCost(monthlyBudgetUsd)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-foreground/8">
                <div
                  className={cn(
                    "h-full rounded-full",
                    budgetPct >= 85 ? "bg-destructive" : "bg-brand"
                  )}
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {byModel.length === 0 ? (
                <p className="text-sm text-foreground/45">
                  Sin modelos usados todavía.
                </p>
              ) : (
                byModel.map((model) => {
                  const width = Math.max(
                    4,
                    (model.totalTokens / maxModelTokens) * 100
                  );
                  return (
                    <div key={`${model.provider}:${model.model}`}>
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="truncate text-xs font-medium text-foreground">
                          {model.model}
                        </span>
                        <span className="font-mono text-[10px] text-foreground/45">
                          {formatCost(model.estimatedCostUsd)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-foreground/8">
                        <div
                          className="h-full rounded-full bg-foreground/45"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className={adminPanelClass}>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Usuarios con más consumo</CardTitle>
              <CardDescription>
                Top de tokens de los últimos 30 días y controles individuales.
              </CardDescription>
            </div>
            <Badge variant={restrictedUsers > 0 ? "destructive" : "secondary"}>
              {restrictedUsers} restringidos
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className={adminTableShellClass}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Coste</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Límites</TableHead>
                  <TableHead>Restricción</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-foreground/40"
                    >
                      Aún no hay usuarios para auditar.
                    </TableCell>
                  </TableRow>
                )}

                {rows.map((user) => {
                  const draft = drafts[user.userId] ?? emptyDraft(user);
                  const isBusy = busyUserId === user.userId;
                  const isSaved = savedUserId === user.userId;

                  return (
                    <TableRow key={user.userId} className="align-top">
                      <TableCell className="min-w-[220px]">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {user.name || "Sin nombre"}
                            </span>
                            {user.isRestricted ? (
                              <Badge variant="destructive">
                                <Lock data-icon="inline-start" />
                                Bloqueado
                              </Badge>
                            ) : (
                              <Badge variant="outline">Activo</Badge>
                            )}
                          </div>
                          <span className="text-xs text-foreground/45">
                            {user.email}
                          </span>
                          <span className="text-[10px] text-foreground/35">
                            {user.requests} peticiones ·{" "}
                            {formatTokens(user.inputTokens)} in ·{" "}
                            {formatTokens(user.outputTokens)} out
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatTokens(user.totalTokens)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatCost(user.estimatedCostUsd)}
                      </TableCell>
                      <TableCell className="min-w-[190px]">
                        <Select
                          value={draft.modelOverride}
                          onValueChange={(value) =>
                            updateDraft(user.userId, {
                              modelOverride: value ?? "__global",
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Modelo global" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="__global">
                                Modelo global
                              </SelectItem>
                              {modelOptions.map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  {model.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="min-w-[210px]">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            min={0}
                            placeholder="Día"
                            value={draft.dailyTokenLimit}
                            onChange={(event) =>
                              updateDraft(user.userId, {
                                dailyTokenLimit: event.target.value,
                              })
                            }
                          />
                          <Input
                            type="number"
                            min={0}
                            placeholder="Mes"
                            value={draft.monthlyTokenLimit}
                            onChange={(event) =>
                              updateDraft(user.userId, {
                                monthlyTokenLimit: event.target.value,
                              })
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[260px]">
                        <div className="flex flex-col gap-2">
                          <Button
                            type="button"
                            variant={
                              draft.isRestricted ? "destructive" : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              updateDraft(user.userId, {
                                isRestricted: !draft.isRestricted,
                              })
                            }
                          >
                            {draft.isRestricted ? (
                              <Lock data-icon="inline-start" />
                            ) : (
                              <Unlock data-icon="inline-start" />
                            )}
                            {draft.isRestricted
                              ? "Restringido"
                              : "Permitir uso"}
                          </Button>
                          <Textarea
                            rows={2}
                            placeholder="Mensaje personalizado al bloquear"
                            value={draft.customMessage}
                            onChange={(event) =>
                              updateDraft(user.userId, {
                                customMessage: event.target.value,
                              })
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => void saveRestriction(user)}
                        >
                          {isBusy ? (
                            <Loader2
                              data-icon="inline-start"
                              className="animate-spin"
                            />
                          ) : isSaved ? (
                            <Check data-icon="inline-start" />
                          ) : (
                            <Save data-icon="inline-start" />
                          )}
                          Guardar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
