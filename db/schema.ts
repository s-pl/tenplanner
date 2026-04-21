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
    intensity: integer("intensity"), // 1-5, app-validated
    tags: json("tags").$type<string[]>(),
    location: varchar("location", { length: 50 }),
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
  },
  (t) => [
    index("session_exercises_session_id_idx").on(t.sessionId),
    index("session_exercises_session_order_idx").on(t.sessionId, t.orderIndex),
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
    playerLevel: varchar("player_level", { length: 30 }),
    yearsExperience: integer("years_experience"),
    notes: text("notes"),
    imageUrl: text("image_url"),
    profileToken: varchar("profile_token", { length: 128 }).unique(),
    profileTokenExpiresAt: timestamp("profile_token_expires_at", {
      withTimezone: true,
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
  sessionExercises: many(sessionExercises),
  sessionStudents: many(sessionStudents),
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

export const studentsRelations = relations(students, ({ one, many }) => ({
  coach: one(users, {
    fields: [students.coachId],
    references: [users.id],
  }),
  sessionStudents: many(sessionStudents),
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

export const drPlannerChatsRelations = relations(drPlannerChats, ({ many }) => ({
  messages: many(drPlannerMessages),
}));

export const drPlannerMessagesRelations = relations(
  drPlannerMessages,
  ({ one }) => ({
    chat: one(drPlannerChats, {
      fields: [drPlannerMessages.chatId],
      references: [drPlannerChats.id],
    }),
  })
);
