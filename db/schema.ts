import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
  json,
  boolean,
  date,
  index,
  numeric,
  vector,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const exerciseCategoryEnum = pgEnum("exercise_category", [
  "technique",
  "tactics",
  "fitness",
  "warm-up",
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "scheduled",
  "completed",
  "cancelled",
]);

export const difficultyEnum = pgEnum("difficulty", [
  "beginner",
  "intermediate",
  "advanced",
]);

export const trainingPhaseEnum = pgEnum("training_phase", [
  "activation",
  "main",
  "cooldown",
]);

export const ejercicioFormatoEnum = pgEnum("ejercicio_formato", [
  "individual",
  "parejas",
  "grupal",
  "multigrupo",
]);

export const tipoActividadEnum = pgEnum("tipo_actividad", [
  "tecnico_tactico",
  "fisico",
  "cognitivo",
  "competitivo",
  "ludico",
]);

export const tipoPelotaEnum = pgEnum("tipo_pelota", [
  "normal",
  "lenta",
  "rapida",
  "sin_pelota",
]);

export const aiEmbeddingSourceEnum = pgEnum("ai_embedding_source", [
  "exercise",
  "session",
]);

// Users — id references auth.users(id) managed by Supabase Auth
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  image: text("image"),
  city: varchar("city", { length: 255 }),
  role: varchar("role", { length: 20 }), // "player" | "coach" | "both"
  playerLevel: varchar("player_level", { length: 30 }), // "beginner" | "amateur" | "intermediate" | "advanced" | "competitive"
  yearsExperience: integer("years_experience"),
  surfacePreference: varchar("surface_preference", { length: 30 }), // "crystal" | "turf" | "cement" | "any"
  goals: text("goals"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// Exercises
export const exercises = pgTable(
  "exercises",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: exerciseCategoryEnum("category").notNull(),
    difficulty: difficultyEnum("difficulty").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    objectives: text("objectives"),
    steps: json("steps").$type<Array<{ title: string; description: string }>>(),
    materials: json("materials").$type<string[]>(),
    imageUrl: text("image_url"),
    location: varchar("location", { length: 50 }),
    videoUrl: text("video_url"),
    tips: text("tips"),
    phase: trainingPhaseEnum("phase"),
    intensity: integer("intensity"), // 1-5, app-validated
    formato: ejercicioFormatoEnum("formato"),
    numJugadores: integer("num_jugadores"),
    tipoPelota: tipoPelotaEnum("tipo_pelota"),
    tipoActividad: tipoActividadEnum("tipo_actividad"),
    golpes: json("golpes").$type<string[]>(),
    efecto: json("efecto").$type<string[]>(),
    variantes: text("variantes"),
    imageUrls: json("image_urls").$type<string[]>(),
    // New taxonomy (PMV 260506) — additive, replaces difficulty/intensity in UI
    nivel: varchar("nivel", { length: 32 }), // descubrimiento|desarrollo|consolidacion|especializacion|precompeticion|competicion|adultos_iniciacion|adultos_medio_alto
    aspectoJuego: varchar("aspecto_juego", { length: 16 }), // tecnica|tactica|mental|fisico
    parametro: varchar("parametro", { length: 16 }), // altura|profundidad|velocidad|direccion
    tipologia: varchar("tipologia", { length: 16 }), // juego|reto|otros_deportes
    duracionRango: varchar("duracion_rango", { length: 16 }), // 1-5|5-10|10-15|15-20|+20
    isAiGenerated: boolean("is_ai_generated").default(false).notNull(),
    isGlobal: boolean("is_global").default(false).notNull(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("exercises_created_by_idx").on(t.createdBy),
    index("exercises_created_by_name_idx").on(t.createdBy, t.name),
    index("exercises_is_global_idx").on(t.isGlobal),
    index("exercises_category_created_at_idx").on(t.category, t.createdAt),
    index("exercises_name_idx").on(t.name),
  ]
);

// Places (coach-managed locations: Pista 1, Pista 2, Gimnasio…)
export const places = pgTable(
  "places",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    coachId: uuid("coach_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("places_coach_id_idx").on(t.coachId),
    uniqueIndex("places_coach_name_uniq").on(t.coachId, t.name),
  ]
);

// Sessions
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    objective: text("objective"),
    material: text("material"),
    observations: text("observations"),
    sourceClassId: uuid("source_class_id").references(() => classes.id, {
      onDelete: "set null",
    }),
    intensity: integer("intensity"), // 1-5, app-validated
    tags: json("tags").$type<string[]>(),
    location: varchar("location", { length: 50 }),
    placeId: uuid("place_id").references(() => places.id, {
      onDelete: "set null",
    }),
    status: sessionStatusEnum("status").notNull().default("scheduled"),
    statusNote: text("status_note"), // notas de completada / motivo de cancelada
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("sessions_user_id_idx").on(t.userId),
    index("sessions_scheduled_at_idx").on(t.scheduledAt),
    index("sessions_user_scheduled_at_idx").on(t.userId, t.scheduledAt),
    index("sessions_place_id_idx").on(t.placeId),
  ]
);

// Session Exercises (M:N pivot table)
export const sessionExercises = pgTable(
  "session_exercises",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .references(() => sessions.id, { onDelete: "cascade" })
      .notNull(),
    exerciseId: uuid("exercise_id")
      .references(() => exercises.id, { onDelete: "cascade" })
      .notNull(),
    orderIndex: integer("order_index").notNull(),
    durationMinutes: integer("duration_minutes"),
    notes: text("notes"),
    phase: trainingPhaseEnum("phase"),
    intensity: integer("intensity"),
    coachRating: integer("coach_rating"), // 1-5 rating by coach after session
    actualDurationSeconds: integer("actual_duration_seconds"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    executionNotes: text("execution_notes"),
    wasSkipped: boolean("was_skipped").default(false).notNull(),
  },
  (t) => [
    index("session_exercises_session_id_idx").on(t.sessionId),
    index("session_exercises_session_order_idx").on(t.sessionId, t.orderIndex),
    index("session_exercises_exercise_id_idx").on(t.exerciseId),
  ]
);

// Session blocks are the stable PMV snapshot used when a class is scheduled.
export const sessionBlocks = pgTable(
  "session_blocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .references(() => sessions.id, { onDelete: "cascade" })
      .notNull(),
    orderIndex: integer("order_index").notNull(),
    title: varchar("title", { length: 120 }),
    notes: text("notes"),
  },
  (t) => [
    uniqueIndex("session_blocks_session_order_uniq").on(
      t.sessionId,
      t.orderIndex
    ),
    index("session_blocks_session_id_idx").on(t.sessionId),
  ]
);

export const sessionBlockItems = pgTable(
  "session_block_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    blockId: uuid("block_id")
      .references(() => sessionBlocks.id, { onDelete: "cascade" })
      .notNull(),
    exerciseId: uuid("exercise_id").references(() => exercises.id, {
      onDelete: "set null",
    }),
    exerciseName: varchar("exercise_name", { length: 255 }),
    exerciseDescription: text("exercise_description"),
    freeText: text("free_text"),
    orderIndex: integer("order_index").notNull(),
    durationMinutes: integer("duration_minutes"),
    notes: text("notes"),
  },
  (t) => [
    index("session_block_items_block_id_idx").on(t.blockId),
    index("session_block_items_block_order_idx").on(t.blockId, t.orderIndex),
    index("session_block_items_exercise_id_idx").on(t.exerciseId),
  ]
);

// Students (managed by coaches)
export const students = pgTable(
  "students",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    coachId: uuid("coach_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    gender: varchar("gender", { length: 20 }), // "male" | "female" | "other"
    birthDate: date("birth_date"),
    heightCm: integer("height_cm"),
    weightKg: integer("weight_kg"),
    dominantHand: varchar("dominant_hand", { length: 10 }), // "left" | "right"
    playerLevel: varchar("player_level", { length: 30 }), // ahora admite los 8 niveles PMV
    yearsExperience: integer("years_experience"),
    yearStartedTennis: integer("year_started_tennis"),
    yearStartedRacketSports: integer("year_started_racket_sports"),
    phone: varchar("phone", { length: 32 }),
    preferredSchedule: text("preferred_schedule"),
    notes: text("notes"),
    imageUrl: text("image_url"),
    profileToken: varchar("profile_token", { length: 128 }).unique(),
    profileTokenExpiresAt: timestamp("profile_token_expires_at", {
      withTimezone: true,
    }),
    consentGivenAt: timestamp("consent_given_at", { withTimezone: true }),
    consentVersion: varchar("consent_version", { length: 20 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("students_coach_id_idx").on(t.coachId),
    index("students_coach_name_idx").on(t.coachId, t.name),
  ]
);

// Session ↔ Students pivot
export const sessionStudents = pgTable(
  "session_students",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .references(() => sessions.id, { onDelete: "cascade" })
      .notNull(),
    studentId: uuid("student_id")
      .references(() => students.id, { onDelete: "cascade" })
      .notNull(),
    attended: boolean("attended"),
    rating: integer("rating"),
    feedback: text("feedback"),
    feedbackAt: timestamp("feedback_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("session_students_session_student_uniq").on(
      t.sessionId,
      t.studentId
    ),
    index("session_students_session_id_idx").on(t.sessionId),
    index("session_students_student_id_idx").on(t.studentId),
  ]
);

// Groups (coach-defined groups of students)
export const groups = pgTable(
  "groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    coachId: uuid("coach_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("groups_coach_id_idx").on(t.coachId)]
);

export const groupStudents = pgTable(
  "group_students",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    studentId: uuid("student_id")
      .references(() => students.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("group_students_group_student_uniq").on(t.groupId, t.studentId),
    index("group_students_group_id_idx").on(t.groupId),
    index("group_students_student_id_idx").on(t.studentId),
  ]
);

// Exercise ratings (1-5 per user)
export const exerciseRatings = pgTable(
  "exercise_ratings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    exerciseId: uuid("exercise_id")
      .references(() => exercises.id, { onDelete: "cascade" })
      .notNull(),
    rating: integer("rating").notNull(), // 1-5
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("exercise_ratings_user_exercise_uniq").on(
      t.userId,
      t.exerciseId
    ),
    index("exercise_ratings_exercise_id_idx").on(t.exerciseId),
    index("exercise_ratings_user_id_idx").on(t.userId),
  ]
);

// Exercise lists (named collections of exercises)
export const exerciseLists = pgTable(
  "exercise_lists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    emoji: varchar("emoji", { length: 10 }).default("📋"),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("exercise_lists_user_id_idx").on(t.userId)]
);

// Exercise list items (exercises in a list)
export const exerciseListItems = pgTable(
  "exercise_list_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listId: uuid("list_id")
      .references(() => exerciseLists.id, { onDelete: "cascade" })
      .notNull(),
    exerciseId: uuid("exercise_id")
      .references(() => exercises.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("exercise_list_items_list_exercise_uniq").on(
      t.listId,
      t.exerciseId
    ),
    index("exercise_list_items_list_id_idx").on(t.listId),
    index("exercise_list_items_exercise_id_idx").on(t.exerciseId),
  ]
);

// Exercise drafts (persisted per user)
export const exerciseDrafts = pgTable(
  "exercise_drafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    payload: json("payload").$type<Record<string, unknown>>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("exercise_drafts_user_updated_at_idx").on(t.userId, t.updatedAt),
  ]
);

// Session drafts (persisted per user)
export const sessionDrafts = pgTable(
  "session_drafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    payload: json("payload").$type<Record<string, unknown>>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("session_drafts_user_updated_at_idx").on(t.userId, t.updatedAt)]
);

// Session templates (marketplace — no scheduledAt, no students)
export const sessionTemplates = pgTable(
  "session_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    objective: text("objective"),
    durationMinutes: integer("duration_minutes").notNull(),
    intensity: integer("intensity"),
    tags: json("tags").$type<string[]>(),
    location: varchar("location", { length: 50 }),
    adoptionsCount: integer("adoptions_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("session_templates_author_id_idx").on(t.authorId),
    index("session_templates_created_at_idx").on(t.createdAt),
    index("session_templates_adoptions_count_idx").on(t.adoptionsCount),
  ]
);

// Session template exercises
export const sessionTemplateExercises = pgTable(
  "session_template_exercises",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateId: uuid("template_id")
      .references(() => sessionTemplates.id, { onDelete: "cascade" })
      .notNull(),
    exerciseId: uuid("exercise_id")
      .references(() => exercises.id, { onDelete: "cascade" })
      .notNull(),
    orderIndex: integer("order_index").notNull(),
    durationMinutes: integer("duration_minutes"),
    notes: text("notes"),
    phase: trainingPhaseEnum("phase"),
    intensity: integer("intensity"),
  },
  (t) => [
    uniqueIndex("session_template_exercises_template_order_uniq").on(
      t.templateId,
      t.orderIndex
    ),
    index("session_template_exercises_template_id_idx").on(t.templateId),
    index("session_template_exercises_exercise_id_idx").on(t.exerciseId),
  ]
);

// Session template adoptions (audit)
export const sessionTemplateAdoptions = pgTable(
  "session_template_adoptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateId: uuid("template_id")
      .references(() => sessionTemplates.id, { onDelete: "cascade" })
      .notNull(),
    coachId: uuid("coach_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    sessionId: uuid("session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("session_template_adoptions_template_session_uniq").on(
      t.templateId,
      t.sessionId
    ),
    index("session_template_adoptions_template_id_idx").on(t.templateId),
    index("session_template_adoptions_coach_id_idx").on(t.coachId),
  ]
);

// =====================================================================
// CLASSES (PMV 260506) — biblioteca de plantillas reutilizables
// Una "class" es una plantilla con 3 bloques (inicial / principal / final).
// Cuando se "agenda" a un grupo en una fecha/lugar, se convierte en una
// session.
// =====================================================================
export const classes = pgTable(
  "classes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    duracionMinutes: integer("duracion_minutes").notNull(),
    alumnosTipo: varchar("alumnos_tipo", { length: 16 }), // individual|grupal
    objetivos: text("objetivos"),
    material: text("material"),
    videoUrl: text("video_url"),
    aspectosImportantes: text("aspectos_importantes"),
    numAlumnos: integer("num_alumnos"),
    nivel: varchar("nivel", { length: 32 }),
    aspectoJuego: varchar("aspecto_juego", { length: 16 }),
    golpes: json("golpes").$type<string[]>(),
    isLibrary: boolean("is_library").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("classes_created_by_idx").on(t.createdBy),
    index("classes_is_library_idx").on(t.isLibrary),
    index("classes_nivel_idx").on(t.nivel),
    index("classes_name_idx").on(t.name),
  ]
);

export const classBlocks = pgTable(
  "class_blocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classId: uuid("class_id")
      .references(() => classes.id, { onDelete: "cascade" })
      .notNull(),
    orderIndex: integer("order_index").notNull(), // 1=inicial, 2=principal, 3=final
    title: varchar("title", { length: 120 }),
    notes: text("notes"),
  },
  (t) => [
    uniqueIndex("class_blocks_class_order_uniq").on(t.classId, t.orderIndex),
    index("class_blocks_class_id_idx").on(t.classId),
  ]
);

export const classBlockExercises = pgTable(
  "class_block_exercises",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    blockId: uuid("block_id")
      .references(() => classBlocks.id, { onDelete: "cascade" })
      .notNull(),
    exerciseId: uuid("exercise_id").references(() => exercises.id, {
      onDelete: "set null",
    }),
    freeText: text("free_text"), // si exerciseId es null, contenido manual
    orderIndex: integer("order_index").notNull(),
    durationMinutes: integer("duration_minutes"),
  },
  (t) => [
    index("class_block_exercises_block_id_idx").on(t.blockId),
    index("class_block_exercises_block_order_idx").on(t.blockId, t.orderIndex),
    index("class_block_exercises_exercise_id_idx").on(t.exerciseId),
  ]
);

export const classFavorites = pgTable(
  "class_favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    classId: uuid("class_id")
      .references(() => classes.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("class_favorites_user_class_uniq").on(t.userId, t.classId),
    index("class_favorites_user_id_idx").on(t.userId),
  ]
);

export const classLists = pgTable(
  "class_lists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    emoji: varchar("emoji", { length: 10 }).default("CL"),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("class_lists_user_id_idx").on(t.userId)]
);

export const classListItems = pgTable(
  "class_list_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listId: uuid("list_id")
      .references(() => classLists.id, { onDelete: "cascade" })
      .notNull(),
    classId: uuid("class_id")
      .references(() => classes.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("class_list_items_list_class_uniq").on(t.listId, t.classId),
    index("class_list_items_list_id_idx").on(t.listId),
    index("class_list_items_class_id_idx").on(t.classId),
  ]
);

export const classDrafts = pgTable(
  "class_drafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    payload: json("payload").$type<Record<string, unknown>>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("class_drafts_user_updated_at_idx").on(t.userId, t.updatedAt)]
);

// Dr. Planner chat history
export const drPlannerChats = pgTable(
  "dr_planner_chats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 255 })
      .notNull()
      .default("Nueva conversación"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("dr_planner_chats_user_id_idx").on(t.userId),
    index("dr_planner_chats_updated_at_idx").on(t.updatedAt),
    index("dr_planner_chats_user_updated_at_idx").on(t.userId, t.updatedAt),
  ]
);

// Dr. Planner messages (normalized from drPlannerChats.messages json blob)
export const drPlannerMessages = pgTable(
  "dr_planner_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    chatId: uuid("chat_id")
      .references(() => drPlannerChats.id, { onDelete: "cascade" })
      .notNull(),
    role: varchar("role", { length: 20 }).notNull(),
    parts: json("parts").$type<Record<string, unknown>[]>().notNull(),
    orderIndex: integer("order_index").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("dr_planner_messages_chat_order_idx").on(t.chatId, t.orderIndex),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  exercises: many(exercises),
  coachedStudents: many(students),
  groups: many(groups),
  classLists: many(classLists),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [exercises.createdBy],
    references: [users.id],
  }),
  sessionExercises: many(sessionExercises),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  sourceClass: one(classes, {
    fields: [sessions.sourceClassId],
    references: [classes.id],
  }),
  sessionExercises: many(sessionExercises),
  sessionStudents: many(sessionStudents),
  blocks: many(sessionBlocks),
}));

export const sessionExercisesRelations = relations(
  sessionExercises,
  ({ one }) => ({
    session: one(sessions, {
      fields: [sessionExercises.sessionId],
      references: [sessions.id],
    }),
    exercise: one(exercises, {
      fields: [sessionExercises.exerciseId],
      references: [exercises.id],
    }),
  })
);

export const sessionBlocksRelations = relations(
  sessionBlocks,
  ({ one, many }) => ({
    session: one(sessions, {
      fields: [sessionBlocks.sessionId],
      references: [sessions.id],
    }),
    items: many(sessionBlockItems),
  })
);

export const sessionBlockItemsRelations = relations(
  sessionBlockItems,
  ({ one }) => ({
    block: one(sessionBlocks, {
      fields: [sessionBlockItems.blockId],
      references: [sessionBlocks.id],
    }),
    exercise: one(exercises, {
      fields: [sessionBlockItems.exerciseId],
      references: [exercises.id],
    }),
  })
);

export const studentsRelations = relations(students, ({ one, many }) => ({
  coach: one(users, {
    fields: [students.coachId],
    references: [users.id],
  }),
  sessionStudents: many(sessionStudents),
  groupStudents: many(groupStudents),
}));

export const sessionStudentsRelations = relations(
  sessionStudents,
  ({ one }) => ({
    session: one(sessions, {
      fields: [sessionStudents.sessionId],
      references: [sessions.id],
    }),
    student: one(students, {
      fields: [sessionStudents.studentId],
      references: [students.id],
    }),
  })
);

export const groupsRelations = relations(groups, ({ one, many }) => ({
  coach: one(users, { fields: [groups.coachId], references: [users.id] }),
  groupStudents: many(groupStudents),
}));

export const groupStudentsRelations = relations(groupStudents, ({ one }) => ({
  group: one(groups, {
    fields: [groupStudents.groupId],
    references: [groups.id],
  }),
  student: one(students, {
    fields: [groupStudents.studentId],
    references: [students.id],
  }),
}));

export const drPlannerChatsRelations = relations(
  drPlannerChats,
  ({ many }) => ({
    messages: many(drPlannerMessages),
  })
);

export const drPlannerMessagesRelations = relations(
  drPlannerMessages,
  ({ one }) => ({
    chat: one(drPlannerChats, {
      fields: [drPlannerMessages.chatId],
      references: [drPlannerChats.id],
    }),
  })
);

export const sessionTemplatesRelations = relations(
  sessionTemplates,
  ({ one, many }) => ({
    author: one(users, {
      fields: [sessionTemplates.authorId],
      references: [users.id],
    }),
    templateExercises: many(sessionTemplateExercises),
    adoptions: many(sessionTemplateAdoptions),
  })
);

export const sessionTemplateExercisesRelations = relations(
  sessionTemplateExercises,
  ({ one }) => ({
    template: one(sessionTemplates, {
      fields: [sessionTemplateExercises.templateId],
      references: [sessionTemplates.id],
    }),
    exercise: one(exercises, {
      fields: [sessionTemplateExercises.exerciseId],
      references: [exercises.id],
    }),
  })
);

export const sessionTemplateAdoptionsRelations = relations(
  sessionTemplateAdoptions,
  ({ one }) => ({
    template: one(sessionTemplates, {
      fields: [sessionTemplateAdoptions.templateId],
      references: [sessionTemplates.id],
    }),
    coach: one(users, {
      fields: [sessionTemplateAdoptions.coachId],
      references: [users.id],
    }),
    session: one(sessions, {
      fields: [sessionTemplateAdoptions.sessionId],
      references: [sessions.id],
    }),
  })
);

export const exerciseDraftsRelations = relations(exerciseDrafts, ({ one }) => ({
  user: one(users, {
    fields: [exerciseDrafts.userId],
    references: [users.id],
  }),
}));

export const sessionDraftsRelations = relations(sessionDrafts, ({ one }) => ({
  user: one(users, {
    fields: [sessionDrafts.userId],
    references: [users.id],
  }),
}));

export const placesRelations = relations(places, ({ one, many }) => ({
  coach: one(users, { fields: [places.coachId], references: [users.id] }),
  sessions: many(sessions),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [classes.createdBy],
    references: [users.id],
  }),
  blocks: many(classBlocks),
  favorites: many(classFavorites),
}));

export const classBlocksRelations = relations(classBlocks, ({ one, many }) => ({
  class: one(classes, {
    fields: [classBlocks.classId],
    references: [classes.id],
  }),
  blockExercises: many(classBlockExercises),
}));

export const classBlockExercisesRelations = relations(
  classBlockExercises,
  ({ one }) => ({
    block: one(classBlocks, {
      fields: [classBlockExercises.blockId],
      references: [classBlocks.id],
    }),
    exercise: one(exercises, {
      fields: [classBlockExercises.exerciseId],
      references: [exercises.id],
    }),
  })
);

export const classFavoritesRelations = relations(classFavorites, ({ one }) => ({
  user: one(users, {
    fields: [classFavorites.userId],
    references: [users.id],
  }),
  class: one(classes, {
    fields: [classFavorites.classId],
    references: [classes.id],
  }),
}));

export const classListsRelations = relations(classLists, ({ one, many }) => ({
  user: one(users, {
    fields: [classLists.userId],
    references: [users.id],
  }),
  items: many(classListItems),
}));

export const classListItemsRelations = relations(
  classListItems,
  ({ one }) => ({
    list: one(classLists, {
      fields: [classListItems.listId],
      references: [classLists.id],
    }),
    class: one(classes, {
      fields: [classListItems.classId],
      references: [classes.id],
    }),
  })
);

export const classDraftsRelations = relations(classDrafts, ({ one }) => ({
  user: one(users, { fields: [classDrafts.userId], references: [users.id] }),
}));

// Landing page editable content (admin-managed copy)
export const landingContent = pgTable("landing_content", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: json("value").$type<unknown>().notNull(),
  type: varchar("type", { length: 20 }).notNull().default("string"),
  label: varchar("label", { length: 200 }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  updatedBy: uuid("updated_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

// Admin-managed platform settings and feature flags.
export const appSettings = pgTable(
  "app_settings",
  {
    key: varchar("key", { length: 120 }).primaryKey(),
    value: json("value").$type<unknown>().notNull(),
    type: varchar("type", { length: 20 }).notNull().default("boolean"),
    label: varchar("label", { length: 200 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 80 }).notNull().default("general"),
    isPublic: boolean("is_public").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    updatedBy: uuid("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    index("app_settings_category_idx").on(t.category),
    index("app_settings_public_idx").on(t.isPublic),
  ]
);

// Semantic search index for AI retrieval over sessions and exercises.
export const aiDocumentEmbeddings = pgTable(
  "ai_document_embeddings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    source: aiEmbeddingSourceEnum("source").notNull(),
    sourceId: uuid("source_id").notNull(),
    content: text("content").notNull(),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    metadata: json("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    embeddedAt: timestamp("embedded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("ai_doc_embeddings_owner_source_idx").on(t.ownerId, t.source),
    index("ai_doc_embeddings_source_id_idx").on(t.source, t.sourceId),
    index("ai_doc_embeddings_hash_idx").on(t.contentHash),
  ]
);

// AI usage ledger for admin cost and token analytics.
export const aiUsageEvents = pgTable(
  "ai_usage_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    chatId: uuid("chat_id").references(() => drPlannerChats.id, {
      onDelete: "set null",
    }),
    provider: varchar("provider", { length: 40 })
      .notNull()
      .default("anthropic"),
    model: varchar("model", { length: 120 }).notNull(),
    operation: varchar("operation", { length: 80 })
      .notNull()
      .default("dr_planner_chat"),
    inputTokens: integer("input_tokens").default(0).notNull(),
    outputTokens: integer("output_tokens").default(0).notNull(),
    totalTokens: integer("total_tokens").default(0).notNull(),
    cacheReadTokens: integer("cache_read_tokens").default(0).notNull(),
    cacheWriteTokens: integer("cache_write_tokens").default(0).notNull(),
    estimatedCostUsd: numeric("estimated_cost_usd", {
      precision: 12,
      scale: 6,
    })
      .default("0")
      .notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    finishReason: varchar("finish_reason", { length: 80 }),
    requestId: varchar("request_id", { length: 160 }),
    metadata: json("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("ai_usage_events_user_created_idx").on(t.userId, t.createdAt),
    index("ai_usage_events_model_created_idx").on(t.model, t.createdAt),
    index("ai_usage_events_created_at_idx").on(t.createdAt),
  ]
);

// Admin controls for limiting individual AI users.
export const aiUserRestrictions = pgTable(
  "ai_user_restrictions",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    isRestricted: boolean("is_restricted").default(false).notNull(),
    customMessage: text("custom_message"),
    dailyTokenLimit: integer("daily_token_limit"),
    monthlyTokenLimit: integer("monthly_token_limit"),
    modelOverride: varchar("model_override", { length: 120 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    updatedBy: uuid("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    index("ai_user_restrictions_restricted_idx").on(t.isRestricted),
    index("ai_user_restrictions_model_idx").on(t.modelOverride),
  ]
);
