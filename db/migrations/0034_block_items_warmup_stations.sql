ALTER TABLE "class_block_exercises" ADD COLUMN "kind" varchar(16);--> statement-breakpoint
ALTER TABLE "class_block_exercises" ADD COLUMN "stations" jsonb;--> statement-breakpoint
ALTER TABLE "session_block_items" ADD COLUMN "kind" varchar(16);--> statement-breakpoint
ALTER TABLE "session_block_items" ADD COLUMN "stations" jsonb;