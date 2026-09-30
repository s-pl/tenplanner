export type TrainingPhase = "activation" | "main" | "cooldown";

export interface AvailableExercise {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  durationMinutes: number;
}

export interface StudentOption {
  id: string;
  name: string;
  imageUrl?: string | null;
  playerLevel?: string | null;
}

export interface WizardExercise {
  /**
   * Para ejercicios de la biblioteca, su id. Para textos libres, una clave
   * local que empieza por "text-" (nunca se envía al servidor como id).
   */
  exerciseId: string;
  /** "text" = texto libre escrito por el monitor, sin crear un ejercicio. */
  kind?: "exercise" | "text";
  freeText?: string;
  name: string;
  category: string;
  durationMinutes: number;
  overrideDuration: number | null;
  notes: string;
  phase: TrainingPhase | null;
  intensity: number | null;
}

export interface WizardBlockItem {
  exerciseId?: string | null;
  freeText?: string | null;
  durationMinutes?: number | null;
  notes?: string | null;
}

export interface WizardSessionBlock {
  orderIndex: 1 | 2 | 3;
  title: string;
  notes: string;
  items: WizardBlockItem[];
}

export type WizardRecurrenceFrequency = "weekly";

export interface WizardRecurrence {
  enabled: boolean;
  frequency: WizardRecurrenceFrequency;
  weeks: number; // total weeks including the original
  weekdays: number[]; // 0=Sun..6=Sat (multi-select)
  /** "weeks" = durante N semanas; "until" = hasta una fecha (fin de curso). */
  mode?: "weeks" | "until";
  /** Fecha final (YYYY-MM-DD), incluida. */
  until?: string;
}

export interface WizardState {
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  location: string;
  placeId: string | null;
  objective: string;
  material: string;
  observations: string;
  sourceClassId: string | null;
  intensity: number | null;
  tags: string[];
  studentIds: string[];
  exercises: WizardExercise[];
  blocks: WizardSessionBlock[];
  recurrence: WizardRecurrence;
  /** Nombre del grupo para el código de la sesión (AAMMDD_Grupo). */
  groupName?: string;
  /** Si está activo, cada sesión se llama AAMMDD_Grupo según su fecha. */
  useCodeTitle?: boolean;
}

export interface WizardPlace {
  id: string;
  name: string;
}

export const LOCATION_OPTIONS = [
  "Pista/cancha cubierta",
  "Pista/cancha exterior",
  "Muro o pared",
  "Otro",
] as const;

export const PHASE_LABELS: Record<TrainingPhase, string> = {
  activation: "Bloque inicial",
  main: "Bloque principal",
  cooldown: "Bloque final",
};
