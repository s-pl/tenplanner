import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { aiUsageEvents, aiUserRestrictions } from "@/db/schema";
import { getAppSettings, type SettingKey } from "@/lib/app-settings";
import {
  DEFAULT_DR_PLANNER_MODEL,
  DEFAULT_REASONING_MODEL,
  normalizeAiModel,
} from "./model-options";

const AI_CONTROL_KEYS = [
  "ai.dr_planner_model",
  "ai.reasoning_model",
  "ai.fallback_model",
  "ai.max_output_tokens",
  "ai.default_temperature",
  "ai.default_daily_token_limit",
  "ai.default_monthly_token_limit",
  "ai.restriction_default_message",
  "ai.pricing_json",
] as const satisfies readonly SettingKey[];

export const DEFAULT_AI_PRICING_JSON =
  '{"claude-haiku-4-5":{"input":1,"output":5,"cacheWrite":1.25,"cacheRead":0.1},"claude-sonnet-4-6":{"input":3,"output":15,"cacheWrite":3.75,"cacheRead":0.3},"claude-sonnet-4-5":{"input":3,"output":15,"cacheWrite":3.75,"cacheRead":0.3},"claude-opus-4-6":{"input":5,"output":25,"cacheWrite":6.25,"cacheRead":0.5},"claude-opus-4-5":{"input":5,"output":25,"cacheWrite":6.25,"cacheRead":0.5}}';

type AiUsageLike = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cachedInputTokens?: number;
  inputTokenDetails?: {
    noCacheTokens?: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
  };
};

type PriceEntry = {
  input: number;
  output: number;
  cacheWrite?: number;
  cacheRead?: number;
};

type AiPricing = Record<string, PriceEntry>;

interface UsageTotals {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  billableInputTokens: number;
}

interface AiRestrictionRow {
  userId: string;
  isRestricted: boolean;
  customMessage: string | null;
  dailyTokenLimit: number | null;
  monthlyTokenLimit: number | null;
  modelOverride: string | null;
  notes: string | null;
}

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

function parseNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parseString(value: unknown, fallback: string) {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parsePricing(json: string): AiPricing {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== "object")
      throw new Error("Invalid pricing");
    return parsed as AiPricing;
  } catch {
    return JSON.parse(DEFAULT_AI_PRICING_JSON) as AiPricing;
  }
}

function normalizeUsage(usage: AiUsageLike): UsageTotals {
  const inputTokens = usage.inputTokens ?? 0;
  const outputTokens = usage.outputTokens ?? 0;
  const cacheReadTokens =
    usage.inputTokenDetails?.cacheReadTokens ?? usage.cachedInputTokens ?? 0;
  const cacheWriteTokens = usage.inputTokenDetails?.cacheWriteTokens ?? 0;
  const billableInputTokens =
    usage.inputTokenDetails?.noCacheTokens ??
    Math.max(inputTokens - cacheReadTokens - cacheWriteTokens, 0);

  return {
    inputTokens,
    outputTokens,
    totalTokens: usage.totalTokens ?? inputTokens + outputTokens,
    cacheReadTokens,
    cacheWriteTokens,
    billableInputTokens,
  };
}

export function estimateAiCostUsd({
  model,
  pricingJson,
  usage,
}: {
  model: string;
  pricingJson: string;
  usage: AiUsageLike;
}) {
  const pricing = parsePricing(pricingJson);
  const price = pricing[model];
  if (!price) return 0;

  const totals = normalizeUsage(usage);
  return (
    (totals.billableInputTokens / 1_000_000) * price.input +
    (totals.outputTokens / 1_000_000) * price.output +
    (totals.cacheWriteTokens / 1_000_000) *
      (price.cacheWrite ?? price.input * 1.25) +
    (totals.cacheReadTokens / 1_000_000) *
      (price.cacheRead ?? price.input * 0.1)
  );
}

async function getAiRestriction(
  userId: string
): Promise<AiRestrictionRow | null> {
  try {
    const [row] = await db
      .select()
      .from(aiUserRestrictions)
      .where(eq(aiUserRestrictions.userId, userId))
      .limit(1);
    return row ?? null;
  } catch (error) {
    if (isMissingAiTablesError(error)) return null;
    throw error;
  }
}

async function getUsageSince(userId: string, since: Date) {
  try {
    const [row] = await db
      .select({
        totalTokens: sql<number>`coalesce(sum(${aiUsageEvents.totalTokens} - ${aiUsageEvents.cacheReadTokens}), 0)::int`,
      })
      .from(aiUsageEvents)
      .where(
        and(
          eq(aiUsageEvents.userId, userId),
          gte(aiUsageEvents.createdAt, since)
        )
      );
    return Number(row?.totalTokens ?? 0);
  } catch (error) {
    if (isMissingAiTablesError(error)) return 0;
    throw error;
  }
}

export async function getAiRuntimeConfig(modelOverride?: string | null) {
  const values = await getAppSettings(AI_CONTROL_KEYS);
  const fallbackModel = normalizeAiModel(
    parseString(values.get("ai.fallback_model"), DEFAULT_DR_PLANNER_MODEL)
  );

  return {
    provider: "anthropic" as const,
    drPlannerModel: normalizeAiModel(
      modelOverride ??
        parseString(
          values.get("ai.dr_planner_model"),
          DEFAULT_DR_PLANNER_MODEL
        ),
      fallbackModel
    ),
    reasoningModel: normalizeAiModel(
      parseString(values.get("ai.reasoning_model"), DEFAULT_REASONING_MODEL),
      fallbackModel
    ),
    fallbackModel,
    maxOutputTokens: clampNumber(
      Math.round(parseNumber(values.get("ai.max_output_tokens"), 2400)),
      512,
      8000
    ),
    temperature: clampNumber(
      parseNumber(values.get("ai.default_temperature"), 0.4),
      0,
      1
    ),
    pricingJson: parseString(
      values.get("ai.pricing_json"),
      DEFAULT_AI_PRICING_JSON
    ),
  };
}

export async function getAiAccessForUser(userId: string) {
  const values = await getAppSettings(AI_CONTROL_KEYS);
  const restriction = await getAiRestriction(userId);
  const defaultMessage = parseString(
    values.get("ai.restriction_default_message"),
    "Dr. Planner está temporalmente limitado para tu cuenta."
  );

  const dailyLimit =
    restriction?.dailyTokenLimit ??
    Math.round(parseNumber(values.get("ai.default_daily_token_limit"), 0));
  const monthlyLimit =
    restriction?.monthlyTokenLimit ??
    Math.round(parseNumber(values.get("ai.default_monthly_token_limit"), 0));

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const [dailyTokens, monthlyTokens] = await Promise.all([
    getUsageSince(userId, dayStart),
    getUsageSince(userId, monthStart),
  ]);

  const message = restriction?.customMessage?.trim() || defaultMessage;

  if (restriction?.isRestricted) {
    return {
      allowed: false,
      reason: "restricted" as const,
      message,
      restriction,
      dailyTokens,
      monthlyTokens,
      dailyLimit,
      monthlyLimit,
    };
  }

  if (dailyLimit > 0 && dailyTokens >= dailyLimit) {
    return {
      allowed: false,
      reason: "daily_limit" as const,
      message,
      restriction,
      dailyTokens,
      monthlyTokens,
      dailyLimit,
      monthlyLimit,
    };
  }

  if (monthlyLimit > 0 && monthlyTokens >= monthlyLimit) {
    return {
      allowed: false,
      reason: "monthly_limit" as const,
      message,
      restriction,
      dailyTokens,
      monthlyTokens,
      dailyLimit,
      monthlyLimit,
    };
  }

  return {
    allowed: true,
    reason: null,
    message: null,
    restriction,
    dailyTokens,
    monthlyTokens,
    dailyLimit,
    monthlyLimit,
  };
}

export async function recordAiUsageEvent({
  userId,
  chatId,
  provider,
  model,
  operation,
  usage,
  pricingJson,
  finishReason,
  requestId,
  metadata,
}: {
  userId: string;
  chatId?: string | null;
  provider: string;
  model: string;
  operation: string;
  usage: AiUsageLike;
  pricingJson: string;
  finishReason?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}) {
  const totals = normalizeUsage(usage);
  const estimatedCostUsd = estimateAiCostUsd({ model, pricingJson, usage });

  try {
    await db.insert(aiUsageEvents).values({
      userId,
      chatId: chatId ?? null,
      provider,
      model,
      operation,
      inputTokens: totals.inputTokens,
      outputTokens: totals.outputTokens,
      totalTokens: totals.totalTokens,
      cacheReadTokens: totals.cacheReadTokens,
      cacheWriteTokens: totals.cacheWriteTokens,
      estimatedCostUsd: estimatedCostUsd.toFixed(6),
      finishReason: finishReason ?? null,
      requestId: requestId ?? null,
      metadata: metadata ?? {},
    });
  } catch (error) {
    if (isMissingAiTablesError(error)) return;
    console.error("[AI usage] No se pudo registrar el uso:", error);
  }
}
