DO $$ BEGIN
  CREATE TYPE "public"."dev_task_assignee" AS ENUM('dario', 'david', 'ambos');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."dev_task_status" AS ENUM('pendiente', 'resuelto');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dev_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"assigned_to" "dev_task_assignee" NOT NULL,
	"status" "dev_task_status" DEFAULT 'pendiente' NOT NULL,
	"start_date" date,
	"end_date" date,
	"observaciones" text,
	"created_by" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dev_tasks_status_idx" ON "dev_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dev_tasks_assigned_to_idx" ON "dev_tasks" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dev_tasks_created_at_idx" ON "dev_tasks" USING btree ("created_at");
