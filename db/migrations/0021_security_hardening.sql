-- Security hardening for direct Supabase/PostgREST access.
-- The app mostly uses server-side Drizzle, but these policies keep the database
-- safe if the anon/authenticated keys are used directly.

-- Users: authenticated users can manage their own profile, but cannot grant
-- themselves admin privileges via direct table access.
REVOKE INSERT, UPDATE, DELETE ON TABLE users FROM authenticated;
GRANT SELECT ON TABLE users TO authenticated;
GRANT INSERT (
  id,
  name,
  email,
  image,
  city,
  role,
  player_level,
  years_experience,
  surface_preference,
  goals
) ON TABLE users TO authenticated;
GRANT UPDATE (
  name,
  email,
  image,
  city,
  role,
  player_level,
  years_experience,
  surface_preference,
  goals,
  updated_at
) ON TABLE users TO authenticated;

DROP POLICY IF EXISTS "users_self_insert" ON users;
DROP POLICY IF EXISTS "users_self_update" ON users;

CREATE POLICY "users_self_insert" ON users
  FOR INSERT WITH CHECK (id = auth.uid() AND is_admin = false);

CREATE POLICY "users_self_update" ON users
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Exercises: direct clients cannot publish global exercises; only server/admin
-- code should be able to set is_global=true.
DROP POLICY IF EXISTS "exercises_insert_own" ON exercises;
DROP POLICY IF EXISTS "exercises_update_own" ON exercises;

CREATE POLICY "exercises_insert_own" ON exercises
  FOR INSERT WITH CHECK (created_by = auth.uid() AND is_global = false);

CREATE POLICY "exercises_update_own" ON exercises
  FOR UPDATE
  USING (created_by = auth.uid() AND is_global = false)
  WITH CHECK (created_by = auth.uid() AND is_global = false);

-- Tables added after the original RLS migration. Keep creation idempotent so
-- existing databases and fresh local databases converge to the same schema.
CREATE TABLE IF NOT EXISTS "exercise_ratings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "exercise_id" uuid NOT NULL REFERENCES "exercises"("id") ON DELETE CASCADE,
  "rating" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "exercise_ratings_user_exercise_uniq"
  ON "exercise_ratings" ("user_id", "exercise_id");
CREATE INDEX IF NOT EXISTS "exercise_ratings_exercise_id_idx"
  ON "exercise_ratings" ("exercise_id");
CREATE INDEX IF NOT EXISTS "exercise_ratings_user_id_idx"
  ON "exercise_ratings" ("user_id");

CREATE TABLE IF NOT EXISTS "exercise_lists" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "emoji" varchar(10) DEFAULT '📋',
  "is_default" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "exercise_lists_user_id_idx"
  ON "exercise_lists" ("user_id");

CREATE TABLE IF NOT EXISTS "exercise_list_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "list_id" uuid NOT NULL REFERENCES "exercise_lists"("id") ON DELETE CASCADE,
  "exercise_id" uuid NOT NULL REFERENCES "exercises"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "exercise_list_items_list_exercise_uniq"
  ON "exercise_list_items" ("list_id", "exercise_id");
CREATE INDEX IF NOT EXISTS "exercise_list_items_list_id_idx"
  ON "exercise_list_items" ("list_id");
CREATE INDEX IF NOT EXISTS "exercise_list_items_exercise_id_idx"
  ON "exercise_list_items" ("exercise_id");

ALTER TABLE IF EXISTS exercise_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exercise_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exercise_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS landing_content ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE exercise_lists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE exercise_list_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE exercise_ratings TO authenticated;
GRANT SELECT ON TABLE landing_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE landing_content TO authenticated;

DROP POLICY IF EXISTS "exercise_lists_owner_all" ON exercise_lists;
CREATE POLICY "exercise_lists_owner_all" ON exercise_lists
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "exercise_list_items_via_owned_list" ON exercise_list_items;
CREATE POLICY "exercise_list_items_via_owned_list" ON exercise_list_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM exercise_lists l
      WHERE l.id = list_id AND l.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exercise_lists l
      WHERE l.id = list_id AND l.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM exercises e
      WHERE e.id = exercise_id
        AND (e.is_global = true OR e.created_by IS NULL OR e.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "exercise_ratings_self_select" ON exercise_ratings;
DROP POLICY IF EXISTS "exercise_ratings_self_insert" ON exercise_ratings;
DROP POLICY IF EXISTS "exercise_ratings_self_update" ON exercise_ratings;
DROP POLICY IF EXISTS "exercise_ratings_self_delete" ON exercise_ratings;

CREATE POLICY "exercise_ratings_self_select" ON exercise_ratings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "exercise_ratings_self_insert" ON exercise_ratings
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM exercises e
      WHERE e.id = exercise_id
        AND (e.is_global = true OR e.created_by IS NULL OR e.created_by = auth.uid())
    )
  );

CREATE POLICY "exercise_ratings_self_update" ON exercise_ratings
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM exercises e
      WHERE e.id = exercise_id
        AND (e.is_global = true OR e.created_by IS NULL OR e.created_by = auth.uid())
    )
  );

CREATE POLICY "exercise_ratings_self_delete" ON exercise_ratings
  FOR DELETE USING (user_id = auth.uid());

-- Tighten older relationship policies so direct authenticated clients cannot
-- attach private exercises they do not own to sessions or templates.
DROP POLICY IF EXISTS "session_exercises_via_session" ON session_exercises;
CREATE POLICY "session_exercises_via_session" ON session_exercises
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM exercises e
      WHERE e.id = exercise_id
        AND (e.is_global = true OR e.created_by IS NULL OR e.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authors manage own template exercises" ON session_template_exercises;
CREATE POLICY "Authors manage own template exercises" ON session_template_exercises
  FOR ALL
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
    AND EXISTS (
      SELECT 1 FROM exercises e
      WHERE e.id = exercise_id
        AND (e.is_global = true OR e.created_by IS NULL OR e.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "landing_content_public_read" ON landing_content;
DROP POLICY IF EXISTS "landing_content_admin_write" ON landing_content;

CREATE POLICY "landing_content_public_read" ON landing_content
  FOR SELECT USING (true);

CREATE POLICY "landing_content_admin_write" ON landing_content
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );

-- Data integrity checks enforced for future writes without blocking existing
-- legacy rows during deployment.
DO $$
BEGIN
  IF to_regclass('public.exercises') IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exercises_duration_minutes_range')
  THEN
    ALTER TABLE exercises
      ADD CONSTRAINT exercises_duration_minutes_range
      CHECK (duration_minutes BETWEEN 1 AND 300) NOT VALID;
  END IF;

  IF to_regclass('public.sessions') IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_duration_minutes_range')
  THEN
    ALTER TABLE sessions
      ADD CONSTRAINT sessions_duration_minutes_range
      CHECK (duration_minutes BETWEEN 1 AND 600) NOT VALID;
  END IF;

  IF to_regclass('public.exercise_ratings') IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exercise_ratings_rating_range')
  THEN
    ALTER TABLE exercise_ratings
      ADD CONSTRAINT exercise_ratings_rating_range
      CHECK (rating BETWEEN 1 AND 5) NOT VALID;
  END IF;

  IF to_regclass('public.session_exercises') IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_exercises_intensity_range')
  THEN
    ALTER TABLE session_exercises
      ADD CONSTRAINT session_exercises_intensity_range
      CHECK (intensity IS NULL OR intensity BETWEEN 1 AND 5) NOT VALID;
  END IF;

  IF to_regclass('public.sessions') IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_intensity_range')
  THEN
    ALTER TABLE sessions
      ADD CONSTRAINT sessions_intensity_range
      CHECK (intensity IS NULL OR intensity BETWEEN 1 AND 5) NOT VALID;
  END IF;
END $$;
