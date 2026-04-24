-- pg_trgm-powered search indexes + missing FK index.
-- Supabase ships pg_trgm; this is idempotent.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram GIN indexes for ILIKE '%q%' search
CREATE INDEX IF NOT EXISTS exercises_name_trgm_idx
  ON exercises USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS sessions_title_trgm_idx
  ON sessions USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS students_name_trgm_idx
  ON students USING gin (name gin_trgm_ops);

-- Missing FK index: speeds up cascade deletes on exercises
CREATE INDEX IF NOT EXISTS session_exercises_exercise_id_idx
  ON session_exercises (exercise_id);
