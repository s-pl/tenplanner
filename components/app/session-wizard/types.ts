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

export interface WizardState {
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  location: string;
  objective: string;
  intensity: number | null;
  tags: string[];
  studentIds: string[];
  exercises: WizardExercise[];
}

export const LOCATION_OPTIONS = [
  "Pista cristal",
  "Pista moqueta",
  "Pista cemento",
  "Otro",
] as const;

export const PHASE_LABELS: Record<TrainingPhase, string> = {
  activation: "Activación",
  main: "Principal",
  cooldown: "Vuelta a la calma",
};
