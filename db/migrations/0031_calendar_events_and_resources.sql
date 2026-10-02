CREATE TABLE IF NOT EXISTS "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"title" varchar(255) NOT NULL,
	"description" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"title" varchar(255) NOT NULL,
	"description" text,
	"url" text,
	"document_url" text,
	"document_name" varchar(255),
	"image_url" text,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_events_user_id_idx" ON "calendar_events" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_events_start_at_idx" ON "calendar_events" ("start_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_events_user_start_at_idx" ON "calendar_events" ("user_id","start_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resources_user_id_idx" ON "resources" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resources_user_favorite_idx" ON "resources" ("user_id","is_favorite");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resources_user_created_at_idx" ON "resources" ("user_id","created_at");
