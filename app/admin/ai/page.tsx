import { and, desc, eq, gte, sql } from "drizzle-orm";
import { Bot, CircleDollarSign, Gauge, UsersRound } from "lucide-react";
import { db } from "@/db";
import { aiUsageEvents, aiUserRestrictions, users } from "@/db/schema";
import { getAppSettings } from "@/lib/app-settings";
import { AI_MODEL_OPTIONS } from "@/lib/ai/model-options";
import { AdminMetricCard, AdminPageHeader, adminPageShell } from "../_components/admin-ui";
import { AdminAiOperationsClient } from "./ai-operations-client";

type TopUserRow = {
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
};

function getDbErrorCode(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }
  return null;
}

function isMissingAiTablesError(error: unknown) {
  return ["42P01", "42703"].includes(getDbErrorCode(error) ?? "");
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

async function getAiMetrics() {
  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const values = await getAppSettings(["ai.monthly_budget_usd"]);
  const monthlyBudgetUsd =
    typeof values.get("ai.monthly_budget_usd") === "number"
      ? Number(values.get("ai.monthly_budget_usd"))
      : 50;

  try {
    const [totals30, totalsToday, byModel, byDay, topUsers, restrictedCount] =
      await Promise.all([
        db
          .select({
            requests: sql<number>`count(${aiUsageEvents.id})::int`,
            activeUsers: sql<number>`count(distinct ${aiUsageEvents.userId})::int`,
            // Exclude cache-read tokens: the system prompt is re-sent on every tool-call
            // step and Anthropic counts it in inputTokens even though it costs 0.1× and
            // comes from the prompt cache. Subtracting it gives the "real" token workload.
            totalTokens: sql<number>`coalesce(sum(${aiUsageEvents.totalTokens} - ${aiUsageEvents.cacheReadTokens}), 0)::bigint`,
            inputTokens: sql<number>`coalesce(sum(${aiUsageEvents.inputTokens} - ${aiUsageEvents.cacheReadTokens}), 0)::bigint`,
            outputTokens: sql<number>`coalesce(sum(${aiUsageEvents.outputTokens}), 0)::bigint`,
            cacheReadTokens: sql<number>`coalesce(sum(${aiUsageEvents.cacheReadTokens}), 0)::bigint`,
            estimatedCostUsd: sql<string>`coalesce(sum(${aiUsageEvents.estimatedCostUsd}), 0)::numeric(12, 6)::text`,
          })
          .from(aiUsageEvents)
          .where(gte(aiUsageEvents.createdAt, last30)),
        db
          .select({
            requests: sql<number>`count(${aiUsageEvents.id})::int`,
            totalTokens: sql<number>`coalesce(sum(${aiUsageEvents.totalTokens} - ${aiUsageEvents.cacheReadTokens}), 0)::bigint`,
            estimatedCostUsd: sql<string>`coalesce(sum(${aiUsageEvents.estimatedCostUsd}), 0)::numeric(12, 6)::text`,
          })
          .from(aiUsageEvents)
          .where(gte(aiUsageEvents.createdAt, todayStart)),
        db
          .select({
            provider: aiUsageEvents.provider,
            model: aiUsageEvents.model,
            requests: sql<number>`count(${aiUsageEvents.id})::int`,
            totalTokens: sql<number>`coalesce(sum(${aiUsageEvents.totalTokens} - ${aiUsageEvents.cacheReadTokens}), 0)::bigint`,
            estimatedCostUsd: sql<string>`coalesce(sum(${aiUsageEvents.estimatedCostUsd}), 0)::numeric(12, 6)::text`,
          })
          .from(aiUsageEvents)
          .where(gte(aiUsageEvents.createdAt, last30))
          .groupBy(aiUsageEvents.provider, aiUsageEvents.model)
          .orderBy(
            desc(
              sql`coalesce(sum(${aiUsageEvents.totalTokens} - ${aiUsageEvents.cacheReadTokens}), 0)`
            )
          )
          .limit(12),
        db
          .select({
            day: sql<string>`date_trunc('day', ${aiUsageEvents.createdAt})::date::text`,
            totalTokens: sql<number>`coalesce(sum(${aiUsageEvents.totalTokens} - ${aiUsageEvents.cacheReadTokens}), 0)::bigint`,
            estimatedCostUsd: sql<string>`coalesce(sum(${aiUsageEvents.estimatedCostUsd}), 0)::numeric(12, 6)::text`,
          })
          .from(aiUsageEvents)
          .where(gte(aiUsageEvents.createdAt, last30))
          .groupBy(sql`date_trunc('day', ${aiUsageEvents.createdAt})`)
          .orderBy(sql`date_trunc('day', ${aiUsageEvents.createdAt})`),
        db
          .select({
            userId: users.id,
            name: users.name,
            email: users.email,
            totalTokens: sql<number>`coalesce(sum(${aiUsageEvents.totalTokens} - ${aiUsageEvents.cacheReadTokens}), 0)::bigint`,
            inputTokens: sql<number>`coalesce(sum(${aiUsageEvents.inputTokens} - ${aiUsageEvents.cacheReadTokens}), 0)::bigint`,
            outputTokens: sql<number>`coalesce(sum(${aiUsageEvents.outputTokens}), 0)::bigint`,
            estimatedCostUsd: sql<string>`coalesce(sum(${aiUsageEvents.estimatedCostUsd}), 0)::numeric(12, 6)::text`,
            requests: sql<number>`count(${aiUsageEvents.id})::int`,
            isRestricted: sql<boolean>`coalesce(${aiUserRestrictions.isRestricted}, false)`,
            customMessage: aiUserRestrictions.customMessage,
            dailyTokenLimit: aiUserRestrictions.dailyTokenLimit,
            monthlyTokenLimit: aiUserRestrictions.monthlyTokenLimit,
            modelOverride: aiUserRestrictions.modelOverride,
            notes: aiUserRestrictions.notes,
          })
          .from(users)
          .leftJoin(
            aiUsageEvents,
            and(
              eq(aiUsageEvents.userId, users.id),
              gte(aiUsageEvents.createdAt, last30)
            )
          )
          .leftJoin(aiUserRestrictions, eq(aiUserRestrictions.userId, users.id))
          .groupBy(
            users.id,
            users.name,
            users.email,
            aiUserRestrictions.isRestricted,
            aiUserRestrictions.customMessage,
            aiUserRestrictions.dailyTokenLimit,
            aiUserRestrictions.monthlyTokenLimit,
            aiUserRestrictions.modelOverride,
            aiUserRestrictions.notes
          )
          .orderBy(desc(sql`coalesce(sum(${aiUsageEvents.totalTokens}), 0)`))
          .limit(50),
        db
          .select({
            total: sql<number>`count(${aiUserRestrictions.userId})::int`,
          })
          .from(aiUserRestrictions)
          .where(eq(aiUserRestrictions.isRestricted, true)),
      ]);

    return {
      monthlyBudgetUsd,
      totals30: {
        requests: Number(totals30[0]?.requests ?? 0),
        activeUsers: Number(totals30[0]?.activeUsers ?? 0),
        totalTokens: Number(totals30[0]?.totalTokens ?? 0),
        inputTokens: Number(totals30[0]?.inputTokens ?? 0),
        outputTokens: Number(totals30[0]?.outputTokens ?? 0),
        estimatedCostUsd: toNumber(totals30[0]?.estimatedCostUsd),
      },
      totalsToday: {
        requests: Number(totalsToday[0]?.requests ?? 0),
        totalTokens: Number(totalsToday[0]?.totalTokens ?? 0),
        estimatedCostUsd: toNumber(totalsToday[0]?.estimatedCostUsd),
      },
      byModel: byModel.map((row) => ({
        ...row,
        requests: Number(row.requests ?? 0),
        totalTokens: Number(row.totalTokens ?? 0),
        estimatedCostUsd: toNumber(row.estimatedCostUsd),
      })),
      byDay: byDay.map((row) => ({
        day: row.day,
        totalTokens: Number(row.totalTokens ?? 0),
        estimatedCostUsd: toNumber(row.estimatedCostUsd),
      })),
      topUsers: topUsers.map<TopUserRow>((row) => ({
        ...row,
        totalTokens: Number(row.totalTokens ?? 0),
        inputTokens: Number(row.inputTokens ?? 0),
        outputTokens: Number(row.outputTokens ?? 0),
        estimatedCostUsd: toNumber(row.estimatedCostUsd),
        requests: Number(row.requests ?? 0),
        isRestricted: row.isRestricted === true,
      })),
      restrictedCount: Number(restrictedCount[0]?.total ?? 0),
    };
  } catch (error) {
    if (!isMissingAiTablesError(error)) throw error;
    return {
      monthlyBudgetUsd,
      totals30: {
        requests: 0,
        activeUsers: 0,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
      },
      totalsToday: { requests: 0, totalTokens: 0, estimatedCostUsd: 0 },
      byModel: [],
      byDay: [],
      topUsers: [],
      restrictedCount: 0,
    };
  }
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Bot;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <AdminMetricCard icon={Icon} label={label} value={value} detail={detail} />
  );
}

export default async function AdminAiPage() {
  const metrics = await getAiMetrics();
  const budgetRatio =
    metrics.monthlyBudgetUsd > 0
      ? Math.min(
          metrics.totals30.estimatedCostUsd / metrics.monthlyBudgetUsd,
          1
        )
      : 0;

  return (
    <div className={adminPageShell}>
      <AdminPageHeader
        eyebrow="Admin / IA"
        title="Operaciones IA"
        description="Control de tokens, gasto estimado, modelos y restricciones de uso para Dr. Planner."
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Gauge}
          label="Tokens 30 días"
          value={metrics.totals30.totalTokens.toLocaleString("es-ES")}
          detail={`${metrics.totalsToday.totalTokens.toLocaleString("es-ES")} hoy`}
        />
        <StatCard
          icon={CircleDollarSign}
          label="Gasto estimado"
          value={`$${metrics.totals30.estimatedCostUsd.toFixed(2)}`}
          detail={`${Math.round(budgetRatio * 100)}% de $${metrics.monthlyBudgetUsd.toFixed(0)} mensual`}
        />
        <StatCard
          icon={UsersRound}
          label="Usuarios IA"
          value={metrics.totals30.activeUsers.toLocaleString("es-ES")}
          detail={`${metrics.restrictedCount.toLocaleString("es-ES")} restringidos`}
        />
        <StatCard
          icon={Bot}
          label="Peticiones"
          value={metrics.totals30.requests.toLocaleString("es-ES")}
          detail={`${metrics.totalsToday.requests.toLocaleString("es-ES")} hoy`}
        />
      </section>

      <AdminAiOperationsClient
        byDay={metrics.byDay}
        byModel={metrics.byModel}
        modelOptions={AI_MODEL_OPTIONS}
        monthlyBudgetUsd={metrics.monthlyBudgetUsd}
        topUsers={metrics.topUsers}
        totalCostUsd={metrics.totals30.estimatedCostUsd}
      />
    </div>
  );
}
