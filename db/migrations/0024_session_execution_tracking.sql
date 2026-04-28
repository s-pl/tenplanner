-- Persist real session execution data per exercise.

ALTER TABLE session_exercises
  ADD COLUMN IF NOT EXISTS actual_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS execution_notes text,
  ADD COLUMN IF NOT EXISTS was_skipped boolean DEFAULT false NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'session_exercises_actual_duration_seconds_range'
  ) THEN
    ALTER TABLE session_exercises
      ADD CONSTRAINT session_exercises_actual_duration_seconds_range
      CHECK (actual_duration_seconds IS NULL OR actual_duration_seconds BETWEEN 0 AND 86400)
      NOT VALID;
  END IF;
END $$;
