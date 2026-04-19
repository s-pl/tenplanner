ALTER TABLE "session_students" ADD COLUMN "attended" boolean;--> statement-breakpoint
ALTER TABLE "session_students" ADD COLUMN "rating" integer;--> statement-breakpoint
ALTER TABLE "session_students" ADD COLUMN "feedback" text;--> statement-breakpoint
ALTER TABLE "session_students" ADD COLUMN "feedback_at" timestamp with time zone;