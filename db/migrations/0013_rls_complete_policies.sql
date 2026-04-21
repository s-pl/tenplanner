-- Full RLS setup: enable RLS + idempotent policies + GRANTs for all user-owned tables.
-- Covers dr_planner_messages which was missing from 001_enable_rls.sql proposal.
-- Safe to re-run: DROP POLICY IF EXISTS before every CREATE POLICY.

-- ─── Enable RLS ───────────────────────────────────────────────────────────────
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercises   ENABLE ROW LEVEL SECURITY;
ALTER TABLE students            ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_students    ENABLE ROW LEVEL SECURITY;
ALTER TABLE dr_planner_chats    ENABLE ROW LEVEL SECURITY;
ALTER TABLE dr_planner_messages ENABLE ROW LEVEL SECURITY;

-- ─── GRANTs for authenticated role ───────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON users               TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON exercises           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sessions            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON session_exercises   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON students            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON session_students    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON dr_planner_chats    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON dr_planner_messages TO authenticated;

-- ─── users ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_self_select" ON users;
DROP POLICY IF EXISTS "users_self_update" ON users;
DROP POLICY IF EXISTS "users_self_insert" ON users;

CREATE POLICY "users_self_select" ON users
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_self_update" ON users
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "users_self_insert" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- ─── exercises ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "exercises_read"        ON exercises;
DROP POLICY IF EXISTS "exercises_insert_own"  ON exercises;
DROP POLICY IF EXISTS "exercises_update_own"  ON exercises;
DROP POLICY IF EXISTS "exercises_delete_own"  ON exercises;

CREATE POLICY "exercises_read" ON exercises
  FOR SELECT USING (is_global = true OR created_by = auth.uid());
CREATE POLICY "exercises_insert_own" ON exercises
  FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "exercises_update_own" ON exercises
  FOR UPDATE USING (created_by = auth.uid() AND is_global = false);
CREATE POLICY "exercises_delete_own" ON exercises
  FOR DELETE USING (created_by = auth.uid() AND is_global = false);

-- ─── sessions ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "sessions_owner_all" ON sessions;

CREATE POLICY "sessions_owner_all" ON sessions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── session_exercises ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "session_exercises_via_session" ON session_exercises;

CREATE POLICY "session_exercises_via_session" ON session_exercises
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
  );

-- ─── students ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "students_coach_all" ON students;

CREATE POLICY "students_coach_all" ON students
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

-- ─── session_students ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "session_students_via_session" ON session_students;

CREATE POLICY "session_students_via_session" ON session_students
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
  );

-- ─── dr_planner_chats ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "dr_planner_chats_owner_all" ON dr_planner_chats;

CREATE POLICY "dr_planner_chats_owner_all" ON dr_planner_chats
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── dr_planner_messages ─────────────────────────────────────────────────────
-- Access granted if the parent chat belongs to the authenticated user.
DROP POLICY IF EXISTS "dr_planner_messages_via_chat" ON dr_planner_messages;

CREATE POLICY "dr_planner_messages_via_chat" ON dr_planner_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM dr_planner_chats c
      WHERE c.id = chat_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dr_planner_chats c
      WHERE c.id = chat_id AND c.user_id = auth.uid()
    )
  );
