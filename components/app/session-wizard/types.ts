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
  exerciseId: string;
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
