CREATE TABLE IF NOT EXISTS "session_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"name" varchar(100) NOT NULL,
	"emoji" varchar(10) DEFAULT '⭐',
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session_list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL REFERENCES "session_lists"("id") ON DELETE cascade,
	"session_id" uuid NOT NULL REFERENCES "sessions"("id") ON DELETE cascade,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_lists_user_id_idx" ON "session_lists" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "session_list_items_list_session_uniq" ON "session_list_items" ("list_id","session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_list_items_list_id_idx" ON "session_list_items" ("list_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_list_items_session_id_idx" ON "session_list_items" ("session_id");
