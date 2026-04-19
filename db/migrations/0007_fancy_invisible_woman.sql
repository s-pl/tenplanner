CREATE TYPE "public"."training_phase" AS ENUM('activation', 'main', 'cooldown');--> statement-breakpoint
CREATE TABLE "session_students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"student_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"gender" varchar(20),
	"birth_date" date,
	"height_cm" integer,
	"weight_kg" integer,
	"dominant_hand" varchar(10),
	"player_level" varchar(30),
	"years_experience" integer,
	"notes" text,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "phase" "training_phase";--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "intensity" integer;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "is_global" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "session_exercises" ADD COLUMN "phase" "training_phase";--> statement-breakpoint
ALTER TABLE "session_exercises" ADD COLUMN "intensity" integer;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "objective" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "intensity" integer;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "tags" json;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "location" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "session_students" ADD CONSTRAINT "session_students_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_students" ADD CONSTRAINT "session_students_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "session_students_session_student_uniq" ON "session_students" USING btree ("session_id","student_id");--> statement-breakpoint
CREATE INDEX "session_students_session_id_idx" ON "session_students" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "students_coach_id_idx" ON "students" USING btree ("coach_id");--> statement-breakpoint
UPDATE "exercises" SET "is_global" = true WHERE "created_by" IS NULL;