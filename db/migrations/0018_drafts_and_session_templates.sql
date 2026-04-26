-- Exercise drafts (persistent per user, replaces localStorage)
CREATE TABLE "exercise_drafts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "payload" json NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "exercise_drafts_user_updated_at_idx" ON "exercise_drafts" ("user_id", "updated_at" DESC);

ALTER TABLE "exercise_drafts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own exercise drafts"
  ON "exercise_drafts" FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Session drafts (persistent per user, replaces localStorage)
CREATE TABLE "session_drafts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "payload" json NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "session_drafts_user_updated_at_idx" ON "session_drafts" ("user_id", "updated_at" DESC);

ALTER TABLE "session_drafts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own session drafts"
  ON "session_drafts" FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Session templates (marketplace)
CREATE TABLE "session_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "author_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "title" varchar(255) NOT NULL,
  "description" text,
  "objective" text,
  "duration_minutes" integer NOT NULL,
  "intensity" integer,
  "tags" json,
  "location" varchar(50),
  "adoptions_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "session_templates_author_id_idx" ON "session_templates" ("author_id");
CREATE INDEX "session_templates_created_at_idx" ON "session_templates" ("created_at" DESC);
CREATE INDEX "session_templates_adoptions_count_idx" ON "session_templates" ("adoptions_count" DESC);

ALTER TABLE "session_templates" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session templates are publicly readable"
  ON "session_templates" FOR SELECT
  USING (true);

CREATE POLICY "Authors manage own session templates"
  ON "session_templates" FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors update own session templates"
  ON "session_templates" FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors delete own session templates"
  ON "session_templates" FOR DELETE
  USING (auth.uid() = author_id);

-- Session template exercises (exercises included in a template)
CREATE TABLE "session_template_exercises" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "template_id" uuid NOT NULL REFERENCES "session_templates"("id") ON DELETE CASCADE,
  "exercise_id" uuid NOT NULL REFERENCES "exercises"("id") ON DELETE CASCADE,
  "order_index" integer NOT NULL,
  "duration_minutes" integer,
  "notes" text,
  "phase" "training_phase",
  "intensity" integer
);

CREATE UNIQUE INDEX "session_template_exercises_template_order_uniq" ON "session_template_exercises" ("template_id", "order_index");
CREATE INDEX "session_template_exercises_template_id_idx" ON "session_template_exercises" ("template_id");
CREATE INDEX "session_template_exercises_exercise_id_idx" ON "session_template_exercises" ("exercise_id");

ALTER TABLE "session_template_exercises" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session template exercises are publicly readable"
  ON "session_template_exercises" FOR SELECT
  USING (true);

CREATE POLICY "Authors manage own template exercises"
  ON "session_template_exercises" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM session_templates t
      WHERE t.id = template_id AND t.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM session_templates t
      WHERE t.id = template_id AND t.author_id = auth.uid()
    )
  );

-- Session template adoptions (audit: who adopted which template)
CREATE TABLE "session_template_adoptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "template_id" uuid NOT NULL REFERENCES "session_templates"("id") ON DELETE CASCADE,
  "coach_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "session_id" uuid REFERENCES "sessions"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "session_template_adoptions_template_session_uniq" ON "session_template_adoptions" ("template_id", "session_id");
CREATE INDEX "session_template_adoptions_template_id_idx" ON "session_template_adoptions" ("template_id");
CREATE INDEX "session_template_adoptions_coach_id_idx" ON "session_template_adoptions" ("coach_id");

ALTER TABLE "session_template_adoptions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own adoptions"
  ON "session_template_adoptions" FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);
