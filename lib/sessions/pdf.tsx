/* eslint-disable jsx-a11y/alt-text */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

export type PdfExercise = {
  name: string;
  category: "technique" | "tactics" | "fitness" | "warm-up";
  difficulty: "beginner" | "intermediate" | "advanced";
  orderIndex: number;
  durationMinutes: number | null;
  notes: string | null;
  phase: "activation" | "main" | "cooldown" | null;
  intensity: number | null;
};

export type PdfSession = {
  title: string;
  description: string | null;
  scheduledAt: Date;
  durationMinutes: number;
  objective: string | null;
  intensity: number | null;
  tags: string[] | null;
  location: string | null;
  exercises: PdfExercise[];
  students: { name: string; playerLevel: string | null }[];
  coachName: string;
};

const BRAND = "#2ea866";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111" },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
    paddingBottom: 10,
    marginBottom: 18,
  },
  brand: { fontSize: 10, color: BRAND, fontWeight: "bold", letterSpacing: 1 },
  title: { fontSize: 20, fontWeight: "bold", marginTop: 4 },
  subtitle: { fontSize: 10, color: "#555", marginTop: 2 },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    gap: 8,
  },
  metaItem: {
    backgroundColor: "#f4f4f5",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  metaLabel: {
    fontSize: 7,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#666",
  },
  metaValue: { fontSize: 10, marginTop: 1 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 14,
    marginBottom: 8,
    color: BRAND,
  },
  phaseBlock: { marginBottom: 14 },
  phaseTitle: {
    fontSize: 11,
    fontWeight: "bold",
    backgroundColor: BRAND,
    color: "#fff",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginBottom: 6,
  },
  exercise: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseName: { fontSize: 11, fontWeight: "bold" },
  exerciseMeta: { fontSize: 9, color: "#555" },
  exerciseNotes: { fontSize: 9, color: "#333", marginTop: 4 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#999",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 6,
  },
  students: { fontSize: 9, color: "#333", marginBottom: 10 },
  description: { fontSize: 10, color: "#333", marginBottom: 10 },
});

const PHASE_LABEL: Record<
  NonNullable<PdfExercise["phase"]> | "none",
  string
> = {
  activation: "Activación",
  main: "Principal",
  cooldown: "Vuelta a la calma",
  none: "Otros",
};

const CATEGORY_LABEL: Record<PdfExercise["category"], string> = {
  technique: "Técnica",
  tactics: "Táctica",
  fitness: "Físico",
  "warm-up": "Calentamiento",
};

const DIFFICULTY_LABEL: Record<PdfExercise["difficulty"], string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function groupByPhase(exercises: PdfExercise[]) {
  const order: Array<"activation" | "main" | "cooldown" | "none"> = [
    "activation",
    "main",
    "cooldown",
    "none",
  ];
  const groups = new Map<
    "activation" | "main" | "cooldown" | "none",
    PdfExercise[]
  >();
  for (const ex of [...exercises].sort((a, b) => a.orderIndex - b.orderIndex)) {
    const key = (ex.phase ?? "none") as "activation" | "main" | "cooldown" | "none";
    const list = groups.get(key) ?? [];
    list.push(ex);
    groups.set(key, list);
  }
  return order
    .filter((k) => groups.has(k))
    .map((k) => ({ phase: k, items: groups.get(k)! }));
}

export function SessionPdf({ session }: { session: PdfSession }) {
  const phases = groupByPhase(session.exercises);
  const totalMinutes =
    session.exercises.reduce((s, e) => s + (e.durationMinutes ?? 0), 0) ||
    session.durationMinutes;

  return (
    <Document
      title={session.title}
      author={session.coachName}
      creator="TenPlanner"
      producer="TenPlanner"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>TENPLANNER · SESIÓN DE ENTRENAMIENTO</Text>
          <Text style={styles.title}>{session.title}</Text>
          <Text style={styles.subtitle}>
            {formatDate(session.scheduledAt)}
          </Text>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Duración</Text>
            <Text style={styles.metaValue}>{totalMinutes} min</Text>
          </View>
          {session.intensity != null && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Intensidad</Text>
              <Text style={styles.metaValue}>{session.intensity} / 5</Text>
            </View>
          )}
          {session.location && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Ubicación</Text>
              <Text style={styles.metaValue}>{session.location}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Ejercicios</Text>
            <Text style={styles.metaValue}>{session.exercises.length}</Text>
          </View>
          {session.tags && session.tags.length > 0 && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Etiquetas</Text>
              <Text style={styles.metaValue}>{session.tags.join(", ")}</Text>
            </View>
          )}
        </View>

        {session.objective && (
          <>
            <Text style={styles.sectionTitle}>Objetivo</Text>
            <Text style={styles.description}>{session.objective}</Text>
          </>
        )}

        {session.description && (
          <>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>{session.description}</Text>
          </>
        )}

        {session.students.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Alumnos</Text>
            <Text style={styles.students}>
              {session.students
                .map((s) =>
                  s.playerLevel ? `${s.name} (${s.playerLevel})` : s.name
                )
                .join(" · ")}
            </Text>
          </>
        )}

        <Text style={styles.sectionTitle}>Plan de entrenamiento</Text>

        {phases.map(({ phase, items }) => (
          <View key={phase} style={styles.phaseBlock} wrap={false}>
            <Text style={styles.phaseTitle}>{PHASE_LABEL[phase]}</Text>
            {items.map((ex) => (
              <View
                key={`${phase}-${ex.orderIndex}-${ex.name}`}
                style={styles.exercise}
              >
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>
                    {ex.orderIndex + 1}. {ex.name}
                  </Text>
                  <Text style={styles.exerciseMeta}>
                    {ex.durationMinutes ? `${ex.durationMinutes} min` : ""}
                    {ex.intensity != null ? ` · int. ${ex.intensity}/5` : ""}
                  </Text>
                </View>
                <Text style={styles.exerciseMeta}>
                  {CATEGORY_LABEL[ex.category]} ·{" "}
                  {DIFFICULTY_LABEL[ex.difficulty]}
                </Text>
                {ex.notes && (
                  <Text style={styles.exerciseNotes}>Notas: {ex.notes}</Text>
                )}
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.footer} fixed>
          Generado con TenPlanner · Entrenador: {session.coachName}
        </Text>
      </Page>
    </Document>
  );
}
