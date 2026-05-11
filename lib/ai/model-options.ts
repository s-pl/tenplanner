export type AiProvider = "anthropic";

export interface AiModelOption {
  id: string;
  label: string;
  provider: AiProvider;
  tier: "coste" | "balance" | "premium";
  description: string;
}

export const AI_MODEL_OPTIONS = [
  {
    id: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    provider: "anthropic",
    tier: "coste",
    description: "Respuesta rápida y barata para uso intensivo.",
  },
  {
    id: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    provider: "anthropic",
    tier: "balance",
    description: "Mejor criterio para planificación y análisis.",
  },
  {
    id: "claude-sonnet-4-5",
    label: "Claude Sonnet 4.5",
    provider: "anthropic",
    tier: "balance",
    description: "Alternativa estable de calidad media-alta.",
  },
  {
    id: "claude-opus-4-6",
    label: "Claude Opus 4.6",
    provider: "anthropic",
    tier: "premium",
    description: "Máxima calidad, coste alto.",
  },
  {
    id: "claude-opus-4-5",
    label: "Claude Opus 4.5",
    provider: "anthropic",
    tier: "premium",
    description: "Modelo premium anterior.",
  },
] as const satisfies readonly AiModelOption[];

export const DEFAULT_DR_PLANNER_MODEL = "claude-haiku-4-5";
export const DEFAULT_REASONING_MODEL = "claude-sonnet-4-6";

const modelIds = new Set<string>(AI_MODEL_OPTIONS.map((model) => model.id));

export function isKnownAiModel(
  model: string | null | undefined
): model is string {
  return typeof model === "string" && modelIds.has(model);
}

export function normalizeAiModel(
  model: string | null | undefined,
  fallback: string = DEFAULT_DR_PLANNER_MODEL
) {
  if (isKnownAiModel(model)) return model;
  return fallback;
}

export function getModelLabel(model: string) {
  return AI_MODEL_OPTIONS.find((option) => option.id === model)?.label ?? model;
}
