CREATE TABLE "dr_planner_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"parts" json NOT NULL,
	"order_index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dr_planner_messages" ADD CONSTRAINT "dr_planner_messages_chat_id_dr_planner_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."dr_planner_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dr_planner_messages_chat_order_idx" ON "dr_planner_messages" USING btree ("chat_id","order_index");--> statement-breakpoint
INSERT INTO "dr_planner_messages" ("chat_id", "role", "parts", "order_index")
SELECT
  c.id AS chat_id,
  COALESCE(m->>'role', 'assistant') AS role,
  COALESCE(m->'parts', '[]'::json) AS parts,
  (ord - 1)::int AS order_index
FROM "dr_planner_chats" c
CROSS JOIN LATERAL json_array_elements(c."messages") WITH ORDINALITY AS t(m, ord)
WHERE c."messages" IS NOT NULL
  AND json_array_length(c."messages") > 0;--> statement-breakpoint
ALTER TABLE "dr_planner_chats" DROP COLUMN "messages";
