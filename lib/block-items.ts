// Shared types for the "block item" building blocks used by both classes
// (class_blocks / class_block_exercises) and sessions
// (session_blocks / session_block_items).
//
// Historically an item was either an "exercise" (exerciseId set) or a
// "text" (freeText set), inferred from which column was populated. We now
// support two more kinds that need an explicit discriminator:
//   - "warmup": only asks for a duration (no exercise/text content).
//   - "stations": 2-10 sub-items ("estaciones"), each itself an exercise or
//     a free text, plus an optional intro/description (stored in the
//     item's own `freeText` column).
//
// `kind` is nullable in the DB for backwards compatibility: rows written
// before this feature have `kind = null` and must keep being inferred the
// old way (exerciseId -> "exercise", else freeText -> "text").

export const BLOCK_ITEM_KINDS = [
  "exercise",
  "text",
  "warmup",
  "stations",
] as const;

export type BlockItemKind = (typeof BLOCK_ITEM_KINDS)[number];

export const STATION_COUNT_MIN = 2;
export const STATION_COUNT_MAX = 10;

// A single "estación" inside a stations item. Stored as jsonb — exerciseName
// is a denormalized snapshot (taken at write time) so rendering a station
// never needs an extra join/query.
export interface StationItemJson {
  kind: "exercise" | "text";
  exerciseId: string | null;
  exerciseName: string | null;
  freeText: string | null;
  durationMinutes: number | null;
}

// Mutable, UI-side shape of a single station while it's being edited (before
// it's serialized into a StationItemJson for the API/DB).
export interface StationDraftItem {
  kind: "exercise" | "text";
  exerciseId: string | null;
  name: string;
  freeText: string;
  durationMinutes: number | null;
}

export function emptyStationDraft(): StationDraftItem {
  return {
    kind: "text",
    exerciseId: null,
    name: "",
    freeText: "",
    durationMinutes: null,
  };
}

export function resolveItemKind(item: {
  kind?: string | null;
  exerciseId?: string | null;
  freeText?: string | null;
}): BlockItemKind {
  if (item.kind === "warmup" || item.kind === "stations") return item.kind;
  if (item.exerciseId) return "exercise";
  return "text";
}
