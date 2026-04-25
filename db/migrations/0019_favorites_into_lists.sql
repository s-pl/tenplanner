-- Migration: merge exercise_favorites into exercise_lists
-- Strategy: add is_default flag to lists, backfill favorites into a default list, drop the old table

-- 1. Add is_default column to exercise_lists
ALTER TABLE exercise_lists
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

-- 2. Backfill: for each user who has favorites but no default list yet,
--    create a "Favoritos" list and insert all their favorites as items.
DO $$
DECLARE
  rec RECORD;
  list_id uuid;
BEGIN
  FOR rec IN
    SELECT DISTINCT user_id
    FROM exercise_favorites
  LOOP
    -- Find existing default list for this user
    SELECT id INTO list_id
    FROM exercise_lists
    WHERE user_id = rec.user_id AND is_default = true
    LIMIT 1;

    -- Create default list if none exists
    IF list_id IS NULL THEN
      INSERT INTO exercise_lists (id, user_id, name, emoji, is_default, created_at)
      VALUES (gen_random_uuid(), rec.user_id, 'Favoritos', '❤️', true, now())
      RETURNING id INTO list_id;
    END IF;

    -- Migrate all favorites as list items (skip conflicts)
    INSERT INTO exercise_list_items (id, list_id, exercise_id, created_at)
    SELECT gen_random_uuid(), list_id, exercise_id, created_at
    FROM exercise_favorites
    WHERE user_id = rec.user_id
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 3. Drop the now-redundant exercise_favorites table
DROP TABLE IF EXISTS exercise_favorites;
