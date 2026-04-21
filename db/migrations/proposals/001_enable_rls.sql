-- Enable RLS on every user-owned table.
-- Prerequisite: db/index.ts must set request.jwt.claims per query, otherwise
-- the `postgres` superuser bypasses all policies and this migration is a no-op.

ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercises   ENABLE ROW LEVEL SECURITY;
ALTER TABLE students            ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_students    ENABLE ROW LEVEL SECURITY;
ALTER TABLE dr_planner_chats    ENABLE ROW LEVEL SECURITY;

-- Helper: current authenticated user id from Supabase JWT
-- (auth.uid() already exists in Supabase projects; redefine locally if needed)

-- users: each user can read/update their own profile
CREATE POLICY "users_self_select" ON users
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_self_update" ON users
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "users_self_insert" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- exercises: read global + own; write only own
CREATE POLICY "exercises_read" ON exercises
  FOR SELECT USING (is_global = true OR created_by = auth.uid());
CREATE POLICY "exercises_insert_own" ON exercises
  FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "exercises_update_own" ON exercises
  FOR UPDATE USING (created_by = auth.uid() AND is_global = false);
CREATE POLICY "exercises_delete_own" ON exercises
  FOR DELETE USING (created_by = auth.uid() AND is_global = false);

-- sessions: owner only
CREATE POLICY "sessions_owner_all" ON sessions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- session_exercises: accessible if parent session belongs to user
CREATE POLICY "session_exercises_via_session" ON session_exercises
  FOR ALL USING (
    EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
  );

-- students: coach only
CREATE POLICY "students_coach_all" ON students
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

-- session_students: accessible if parent session belongs to user
CREATE POLICY "session_students_via_session" ON session_students
  FOR ALL USING (
    EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
  );

-- dr_planner_chats: owner only
CREATE POLICY "dr_planner_chats_owner_all" ON dr_planner_chats
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
