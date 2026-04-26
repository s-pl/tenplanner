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
  materials?: string[] | null;
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

const BRAND = "#2563EB";
const BRAND_LIGHT = "#EFF6FF";
const BRAND_MUTED = "#93C5FD";
const GRAY = "#6B7280";
const LIGHT_GRAY = "#F3F4F6";
const BORDER = "#E5E7EB";

const styles = StyleSheet.create({
  page: {
    padding: 44,
    paddingBottom: 60,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },

  // Header
  header: {
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
  },
  brandLabel: {
    fontSize: 8,
    color: BRAND,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    lineHeight: 1.2,
    marginBottom: 3,
  },
  subtitle: { fontSize: 9.5, color: GRAY, marginTop: 1 },
  coachLine: { fontSize: 9, color: GRAY, marginTop: 4 },

  // Meta grid
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 18,
    gap: 6,
  },
  metaItem: {
    backgroundColor: LIGHT_GRAY,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    minWidth: 70,
  },
  metaLabel: {
    fontSize: 7,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: GRAY,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  metaValue: { fontSize: 10, color: "#111827" },

  // Sections
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 8,
    color: BRAND,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Objective / description text
  bodyText: { fontSize: 10, color: "#374151", lineHeight: 1.5, marginBottom: 10 },

  // Students
  studentsRow: { fontSize: 9.5, color: "#374151", marginBottom: 12 },

  // Materials summary
  materialsContainer: {
    backgroundColor: BRAND_LIGHT,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: BRAND,
    padding: 10,
    marginBottom: 16,
  },
  materialsTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  materialsList: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  materialChip: {
    backgroundColor: "#DBEAFE",
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    fontSize: 8.5,
    color: "#1D4ED8",
  },

  // Phase blocks
  phaseBlock: { marginBottom: 12 },
  phaseTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    backgroundColor: BRAND,
    color: "#fff",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Exercise cards
  exercise: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 5,
    padding: 9,
    marginBottom: 5,
    backgroundColor: "#FAFAFA",
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  exerciseNumber: {
    fontSize: 10,
    color: BRAND_MUTED,
    fontFamily: "Helvetica-Bold",
    marginRight: 5,
    lineHeight: 1.4,
  },
  exerciseName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    flex: 1,
    lineHeight: 1.3,
  },
  exerciseDuration: {
    fontSize: 9,
    color: GRAY,
    fontFamily: "Helvetica-Bold",
    marginLeft: 8,
    flexShrink: 0,
  },
  exerciseMeta: { fontSize: 8.5, color: GRAY, marginBottom: 2 },
  exerciseNotes: {
    fontSize: 9,
    color: "#374151",
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    lineHeight: 1.4,
  },
  exerciseMaterials: { flexDirection: "row", flexWrap: "wrap", gap: 3, marginTop: 5 },
  exerciseMaterialChip: {
    fontSize: 8,
    color: "#4B5563",
    backgroundColor: LIGHT_GRAY,
    borderRadius: 3,
    paddingVertical: 1,
    paddingHorizontal: 5,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    fontSize: 8,
    color: "#9CA3AF",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 6,
  },
});

const PHASE_LABEL: Record<NonNullable<PdfExercise["phase"]> | "none", string> = {
  activation: "Activación",
  main: "Principal",
  cooldown: "Vuelta a la calma",
  none: "Sin fase asignada",
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

const INTENSITY_LABEL = ["", "Muy suave", "Suave", "Moderada", "Alta", "Máxima"];

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

  const allMaterials = Array.from(
    new Set(
      session.exercises.flatMap((e) =>
        Array.isArray(e.materials) ? e.materials : []
      )
    )
  );

  return (
    <Document
      title={session.title}
      author={session.coachName}
      creator="TenPlanner"
      producer="TenPlanner"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandLabel}>TenPlanner · Sesión de entrenamiento</Text>
          <Text style={styles.title}>{session.title}</Text>
          <Text style={styles.subtitle}>{formatDate(session.scheduledAt)}</Text>
          <Text style={styles.coachLine}>Entrenador: {session.coachName}</Text>
        </View>

        {/* Meta chips */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Duración</Text>
            <Text style={styles.metaValue}>{totalMinutes} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Ejercicios</Text>
            <Text style={styles.metaValue}>{session.exercises.length}</Text>
          </View>
          {session.intensity != null && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Intensidad</Text>
              <Text style={styles.metaValue}>
                {session.intensity}/5 — {INTENSITY_LABEL[session.intensity]}
              </Text>
            </View>
          )}
          {session.location && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Ubicación</Text>
              <Text style={styles.metaValue}>{session.location}</Text>
            </View>
          )}
          {session.tags && session.tags.length > 0 && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Etiquetas</Text>
              <Text style={styles.metaValue}>{session.tags.join(", ")}</Text>
            </View>
          )}
        </View>

        {/* Objective */}
        {session.objective && (
          <>
            <Text style={styles.sectionTitle}>Objetivo</Text>
            <Text style={styles.bodyText}>{session.objective}</Text>
          </>
        )}

        {/* Description */}
        {session.description && (
          <>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.bodyText}>{session.description}</Text>
          </>
        )}

        {/* Students */}
        {session.students.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Alumnos ({session.students.length})
            </Text>
            <Text style={styles.studentsRow}>
              {session.students
                .map((s) =>
                  s.playerLevel ? `${s.name} (${s.playerLevel})` : s.name
                )
                .join("  ·  ")}
            </Text>
          </>
        )}

        {/* Materials summary */}
        {allMaterials.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Material necesario</Text>
            <View style={styles.materialsContainer}>
              <Text style={styles.materialsTitle}>
                Prepara antes de comenzar — {allMaterials.length} elemento{allMaterials.length !== 1 ? "s" : ""}
              </Text>
              <View style={styles.materialsList}>
                {allMaterials.map((m) => (
                  <View key={m} style={styles.materialChip}>
                    <Text>{m}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Exercises */}
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
                  <View style={{ flexDirection: "row", flex: 1, alignItems: "flex-start" }}>
                    <Text style={styles.exerciseNumber}>{ex.orderIndex + 1}.</Text>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                  </View>
                  {ex.durationMinutes ? (
                    <Text style={styles.exerciseDuration}>
                      {ex.durationMinutes} min
                    </Text>
                  ) : null}
                </View>

                <Text style={styles.exerciseMeta}>
                  {CATEGORY_LABEL[ex.category]} · {DIFFICULTY_LABEL[ex.difficulty]}
                  {ex.intensity != null
                    ? ` · Intensidad ${ex.intensity}/5 (${INTENSITY_LABEL[ex.intensity]})`
                    : ""}
                </Text>

                {ex.notes && (
                  <Text style={styles.exerciseNotes}>📝 {ex.notes}</Text>
                )}

                {ex.materials && ex.materials.length > 0 && (
                  <View style={styles.exerciseMaterials}>
                    {ex.materials.map((m) => (
                      <View key={m} style={styles.exerciseMaterialChip}>
                        <Text>{m}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Generado con TenPlanner · {formatDate(new Date())} · Entrenador: {session.coachName}
        </Text>
      </Page>
    </Document>
  );
}
