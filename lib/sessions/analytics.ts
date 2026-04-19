export type TrainingPhase = "activation" | "main" | "cooldown";
export type ExerciseCategory = "technique" | "tactics" | "fitness" | "warm-up";

export interface AnalyticsExerciseInput {
  orderIndex: number;
  durationMinutes: number;
  category: string;
  resolvedPhase: TrainingPhase;
  resolvedIntensity: number | null;
  name: string;
}

export interface PhaseBreakdown {
  phase: TrainingPhase;
  minutes: number;
  percentage: number;
}

export interface CategoryBreakdown {
  category: ExerciseCategory;
  minutes: number;
}

export interface IntensityPoint {
  order: number;
  cumulativeMinutes: number;
  intensity: number | null;
  name: string;
}

export interface SessionAnalytics {
  totalMinutes: number;
  exerciseCount: number;
  averageIntensity: number | null;
  phasesCovered: number;
  studentCount: number;
  tagCount: number;
  phaseBreakdown: PhaseBreakdown[];
  categoryBreakdown: CategoryBreakdown[];
  intensityCurve: IntensityPoint[];
}

const ALL_PHASES: TrainingPhase[] = ["activation", "main", "cooldown"];
const ALL_CATEGORIES: ExerciseCategory[] = [
  "warm-up",
  "technique",
  "tactics",
  "fitness",
];

export function resolvePhase(
  overridePhase: string | null | undefined,
  exercisePhase: string | null | undefined,
): TrainingPhase {
  const value = overridePhase ?? exercisePhase ?? "main";
  if (value === "activation" || value === "main" || value === "cooldown") {
    return value;
  }
  return "main";
}

export function resolveIntensity(
  overrideIntensity: number | null | undefined,
  exerciseIntensity: number | null | undefined,
): number | null {
  return overrideIntensity ?? exerciseIntensity ?? null;
}

export function computeSessionAnalytics(
  exercises: AnalyticsExerciseInput[],
  studentCount: number,
  tagCount: number,
): SessionAnalytics {
  const sorted = [...exercises].sort((a, b) => a.orderIndex - b.orderIndex);
  const totalMinutes = sorted.reduce((s, e) => s + e.durationMinutes, 0);

  const phaseMinutes = new Map<TrainingPhase, number>();
  for (const phase of ALL_PHASES) phaseMinutes.set(phase, 0);
  for (const ex of sorted) {
    phaseMinutes.set(
      ex.resolvedPhase,
      (phaseMinutes.get(ex.resolvedPhase) ?? 0) + ex.durationMinutes,
    );
  }

  const phaseBreakdown: PhaseBreakdown[] = ALL_PHASES.map((phase) => {
    const minutes = phaseMinutes.get(phase) ?? 0;
    return {
      phase,
      minutes,
      percentage: totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0,
    };
  });

  const categoryMinutes = new Map<ExerciseCategory, number>();
  for (const cat of ALL_CATEGORIES) categoryMinutes.set(cat, 0);
  for (const ex of sorted) {
    const cat = ALL_CATEGORIES.includes(ex.category as ExerciseCategory)
      ? (ex.category as ExerciseCategory)
      : null;
    if (cat) {
      categoryMinutes.set(
        cat,
        (categoryMinutes.get(cat) ?? 0) + ex.durationMinutes,
      );
    }
  }
  const categoryBreakdown: CategoryBreakdown[] = ALL_CATEGORIES.map((c) => ({
    category: c,
    minutes: categoryMinutes.get(c) ?? 0,
  }));

  let cumulative = 0;
  const intensityCurve: IntensityPoint[] = sorted.map((ex, idx) => {
    cumulative += ex.durationMinutes;
    return {
      order: idx + 1,
      cumulativeMinutes: cumulative,
      intensity: ex.resolvedIntensity,
      name: ex.name,
    };
  });

  const intensities = sorted
    .map((e) => e.resolvedIntensity)
    .filter((v): v is number => typeof v === "number");
  const averageIntensity =
    intensities.length > 0
      ? intensities.reduce((s, v) => s + v, 0) / intensities.length
      : null;

  const phasesCovered = phaseBreakdown.filter((p) => p.minutes > 0).length;

  return {
    totalMinutes,
    exerciseCount: sorted.length,
    averageIntensity,
    phasesCovered,
    studentCount,
    tagCount,
    phaseBreakdown,
    categoryBreakdown,
    intensityCurve,
  };
}
