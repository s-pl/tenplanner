CREATE TYPE "public"."club_invite_status" AS ENUM('pending', 'accepted', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."club_member_role" AS ENUM('owner', 'coach');--> statement-breakpoint
CREATE TYPE "public"."club_member_status" AS ENUM('active', 'removed');--> statement-breakpoint
CREATE TABLE "club_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" varchar(128) NOT NULL,
	"status" "club_invite_status" DEFAULT 'pending' NOT NULL,
	"invited_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	CONSTRAINT "club_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "club_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "club_member_role" NOT NULL,
	"status" "club_member_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner_id" uuid NOT NULL,
	"planned_coach_seats" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "club_invites" ADD CONSTRAINT "club_invites_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_invites" ADD CONSTRAINT "club_invites_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "club_invites_club_id_idx" ON "club_invites" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "club_invites_email_idx" ON "club_invites" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "club_members_club_user_uniq" ON "club_members" USING btree ("club_id","user_id");--> statement-breakpoint
CREATE INDEX "club_members_club_id_idx" ON "club_members" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "club_members_user_id_idx" ON "club_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "clubs_owner_id_idx" ON "clubs" USING btree ("owner_id");--> statement-breakpoint

-- ─── Row level security for clubs/club_members/club_invites ─────────────────
ALTER TABLE clubs        ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE club_invites ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE ON clubs        TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON club_members TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON club_invites TO authenticated;--> statement-breakpoint

-- SECURITY DEFINER so membership checks don't recurse through club_members'
-- own RLS policy (a well-known Postgres RLS self-reference pitfall).
CREATE OR REPLACE FUNCTION is_active_club_owner(target_club uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM club_members
    WHERE club_id = target_club
      AND user_id = auth.uid()
      AND role = 'owner'
      AND status = 'active'
  );
$$;--> statement-breakpoint

REVOKE EXECUTE ON FUNCTION is_active_club_owner(uuid) FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION is_active_club_owner(uuid) TO authenticated;--> statement-breakpoint

-- Every user id the calling user may act as for shared planning data: the
-- caller themself plus, when the caller is an active club owner, every
-- active coach linked to that club. Not yet referenced by any existing
-- table's policy — reserved for the shared-access phase that wires sessions/
-- students/groups/calendar_events into club visibility.
CREATE OR REPLACE FUNCTION accessible_coach_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid()
  UNION
  SELECT cm.user_id
  FROM club_members cm
  WHERE cm.status = 'active'
    AND cm.club_id IN (
      SELECT club_id FROM club_members
      WHERE user_id = auth.uid() AND role = 'owner' AND status = 'active'
    );
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION accessible_coach_ids() FROM public;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION accessible_coach_ids() TO authenticated;--> statement-breakpoint

-- clubs: visible to any active member; only the registering owner manages it
CREATE POLICY "clubs_member_select" ON clubs
  FOR SELECT USING (
    id IN (SELECT club_id FROM club_members WHERE user_id = auth.uid() AND status = 'active')
  );--> statement-breakpoint
CREATE POLICY "clubs_owner_insert" ON clubs
  FOR INSERT WITH CHECK (owner_id = auth.uid());--> statement-breakpoint
CREATE POLICY "clubs_owner_update" ON clubs
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());--> statement-breakpoint
CREATE POLICY "clubs_owner_delete" ON clubs
  FOR DELETE USING (owner_id = auth.uid());--> statement-breakpoint

-- club_members: a coach sees/updates their own row (e.g. to leave); the
-- owner manages every row in their own club
CREATE POLICY "club_members_select" ON club_members
  FOR SELECT USING (user_id = auth.uid() OR is_active_club_owner(club_id));--> statement-breakpoint
CREATE POLICY "club_members_insert" ON club_members
  FOR INSERT WITH CHECK (is_active_club_owner(club_id) OR user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "club_members_update" ON club_members
  FOR UPDATE USING (is_active_club_owner(club_id) OR user_id = auth.uid())
  WITH CHECK (is_active_club_owner(club_id) OR user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "club_members_delete" ON club_members
  FOR DELETE USING (is_active_club_owner(club_id));--> statement-breakpoint

-- club_invites: the owner manages invites for their club; an invited user
-- (matched by their account email) can see and accept their own invite
CREATE POLICY "club_invites_select" ON club_invites
  FOR SELECT USING (
    is_active_club_owner(club_id)
    OR email = (SELECT email FROM users WHERE id = auth.uid())
  );--> statement-breakpoint
CREATE POLICY "club_invites_insert" ON club_invites
  FOR INSERT WITH CHECK (is_active_club_owner(club_id));--> statement-breakpoint
CREATE POLICY "club_invites_update" ON club_invites
  FOR UPDATE USING (
    is_active_club_owner(club_id)
    OR email = (SELECT email FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    is_active_club_owner(club_id)
    OR email = (SELECT email FROM users WHERE id = auth.uid())
  );--> statement-breakpoint
CREATE POLICY "club_invites_delete" ON club_invites
  FOR DELETE USING (is_active_club_owner(club_id));