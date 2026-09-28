import type {
  TrainingPhase,
  WizardExercise,
  WizardSessionBlock,
  WizardState,
} from "./types";

export const TEXT_ITEM_PREFIX = "text-";
export const DEFAULT_TEXT_DURATION = 5;

export const BLOCK_DEFAULTS: Array<{ orderIndex: 1 | 2 | 3; title: string }> = [
  { orderIndex: 1, title: "Bloque inicial" },
  { orderIndex: 2, title: "Bloque principal" },
  { orderIndex: 3, title: "Bloque final" },
];

export function isTextItem(item: WizardExercise) {
  return item.kind === "text";
}

function randomKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createTextItem(
  text = "",
  phase: TrainingPhase | null = null,
  durationMinutes: number | null = null,
  notes = ""
): WizardExercise {
  return {
    exerciseId: `${TEXT_ITEM_PREFIX}${randomKey()}`,
    kind: "text",
    freeText: text,
    name: text,
    category: "text",
    durationMinutes: durationMinutes ?? DEFAULT_TEXT_DURATION,
    overrideDuration: durationMinutes,
    notes,
    phase,
    intensity: null,
  };
}

export function phaseToBlockOrder(phase: TrainingPhase | null): 1 | 2 | 3 {
  if (phase === "activation") return 1;
  if (phase === "cooldown") return 3;
  return 2;
}

export function blockOrderToPhase(order: number): TrainingPhase {
  if (order === 1) return "activation";
  if (order === 3) return "cooldown";
  return "main";
}

export function normalizeBlocks(
  blocks: WizardSessionBlock[] | undefined
): WizardSessionBlock[] {
  const byOrder = new Map(blocks?.map((block) => [block.orderIndex, block]));
  return BLOCK_DEFAULTS.map((fallback) => {
    const block = byOrder.get(fallback.orderIndex);
    return {
      orderIndex: fallback.orderIndex,
      title: block?.title || fallback.title,
      notes: block?.notes ?? "",
      // Los items viven en la línea de tiempo (state.exercises).
      items: [],
    };
  });
}

/**
 * Convierte los textos libres que vengan dentro de bloques (p. ej. de una
 * clase de la biblioteca) en items de la línea de tiempo, para que el monitor
 * los vea y los pueda editar. Los ejercicios de esos bloques ya llegan en
 * `exercises`, así que aquí solo se añaden los textos.
 */
export function textItemsFromBlocks(
  blocks: WizardSessionBlock[] | undefined
): WizardExercise[] {
  if (!blocks) return [];
  return blocks.flatMap((block) =>
    block.items
      .filter((item) => !item.exerciseId && item.freeText?.trim())
      .map((item) =>
        createTextItem(
          item.freeText!.trim(),
          blockOrderToPhase(block.orderIndex),
          item.durationMinutes ?? null,
          item.notes ?? ""
        )
      )
  );
}

export type BlockPayloadItem = {
  exerciseId?: string;
  freeText?: string | null;
  durationMinutes: number | null;
  notes: string | null;
};

export type BlockPayload = {
  orderIndex: 1 | 2 | 3;
  title: string;
  notes: string | null;
  items: BlockPayloadItem[];
};

/** Bloques para el servidor, respetando el orden de la línea de tiempo. */
export function buildBlocksPayload(
  state: Pick<WizardState, "blocks" | "exercises">
): BlockPayload[] {
  const blocks = normalizeBlocks(state.blocks);
  const byOrder = new Map<1 | 2 | 3, BlockPayload>(
    blocks.map((block) => [
      block.orderIndex,
      {
        orderIndex: block.orderIndex,
        title: block.title,
        notes: block.notes.trim() || null,
        items: [],
      },
    ])
  );

  for (const item of state.exercises) {
    const block = byOrder.get(phaseToBlockOrder(item.phase))!;
    if (isTextItem(item)) {
      const text = item.freeText?.trim();
      if (!text) continue;
      block.items.push({
        freeText: text,
        durationMinutes: item.overrideDuration ?? null,
        notes: item.notes.trim() || null,
      });
    } else {
      block.items.push({
        exerciseId: item.exerciseId,
        durationMinutes: item.overrideDuration ?? null,
        notes: item.notes.trim() || null,
      });
    }
  }

  return BLOCK_DEFAULTS.map((block) => byOrder.get(block.orderIndex)!);
}

/** Lista plana de ejercicios de la biblioteca (compatibilidad del servidor). */
export function buildExercisesPayload(state: Pick<WizardState, "exercises">) {
  return state.exercises
    .filter((item) => !isTextItem(item))
    .map((exercise) => ({
      exerciseId: exercise.exerciseId,
      durationMinutes: exercise.overrideDuration ?? null,
      notes: exercise.notes.trim() || null,
      phase: exercise.phase,
      intensity: exercise.intensity,
    }));
}

export function hasPlanContent(state: Pick<WizardState, "exercises">) {
  return state.exercises.some(
    (item) => !isTextItem(item) || !!item.freeText?.trim()
  );
}

type PlanItemLike =
  | {
      kind: "exercise";
      exerciseId: string;
      name: string;
      category: string;
      defaultDurationMinutes: number;
      durationMinutes: number | null;
      notes: string | null;
      phase: TrainingPhase;
    }
  | {
      kind: "text";
      text: string;
      durationMinutes: number | null;
      notes: string | null;
      phase: TrainingPhase;
    };

/** Plan guardado de una sesión → línea de tiempo del creador. */
export function planItemsToWizard(items: PlanItemLike[]): WizardExercise[] {
  return items.map((item) =>
    item.kind === "text"
      ? createTextItem(
          item.text,
          item.phase,
          item.durationMinutes,
          item.notes ?? ""
        )
      : {
          exerciseId: item.exerciseId,
          kind: "exercise",
          name: item.name,
          category: item.category,
          durationMinutes: item.durationMinutes ?? item.defaultDurationMinutes,
          overrideDuration: item.durationMinutes ?? null,
          notes: item.notes ?? "",
          phase: item.phase,
          intensity: null,
        }
  );
}
