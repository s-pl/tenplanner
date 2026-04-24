-- Add session_status enum
CREATE TYPE "public"."session_status" AS ENUM ('scheduled', 'completed', 'cancelled');

-- Add status column to sessions (default scheduled for existing rows)
ALTER TABLE "sessions" ADD COLUMN "status" "session_status" NOT NULL DEFAULT 'scheduled';

-- Mark past sessions without explicit status as completed
UPDATE "sessions" SET "status" = 'completed' WHERE "scheduled_at" < now();

-- Add coach_rating to session_exercises
ALTER TABLE "session_exercises" ADD COLUMN "coach_rating" integer;

-- Exercise favorites table
CREATE TABLE "exercise_favorites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "exercise_id" uuid NOT NULL REFERENCES "exercises"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "exercise_favorites_user_exercise_uniq" ON "exercise_favorites" ("user_id", "exercise_id");
CREATE INDEX "exercise_favorites_user_id_idx" ON "exercise_favorites" ("user_id");

-- RLS for exercise_favorites
ALTER TABLE "exercise_favorites" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own favorites"
  ON "exercise_favorites"
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Groups
CREATE TABLE "groups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "coach_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "groups_coach_id_idx" ON "groups" ("coach_id");

CREATE TABLE "group_students" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "group_id" uuid NOT NULL REFERENCES "groups"("id") ON DELETE CASCADE,
  "student_id" uuid NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "group_students_group_student_uniq" ON "group_students" ("group_id", "student_id");
CREATE INDEX "group_students_group_id_idx" ON "group_students" ("group_id");
CREATE INDEX "group_students_student_id_idx" ON "group_students" ("student_id");

ALTER TABLE "groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "group_students" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own groups"
  ON "groups" FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches manage group students"
  ON "group_students" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM groups g WHERE g.id = group_id AND g.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups g WHERE g.id = group_id AND g.coach_id = auth.uid()
    )
  );
