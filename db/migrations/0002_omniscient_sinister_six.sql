ALTER TABLE "exercises" ADD COLUMN "objectives" text;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "steps" json;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "materials" json;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "location" varchar(50);--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "video_url" text;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "tips" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "player_level" varchar(30);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "years_experience" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "surface_preference" varchar(30);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "goals" text;