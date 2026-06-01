-- Studio universal generation form: extends generations + adds model_presets, model_overrides
-- Idempotent: safe to re-run.

ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "model_id" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "mode" text;
--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "parameters" jsonb NOT NULL DEFAULT '{}'::jsonb;
--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "cost_credits" integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "cost_breakdown" jsonb;
--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "kie_task_id" text;
--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "result_urls" jsonb;
--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "thumbnail_url" text;
--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "duration_ms" integer;
--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "error_code" text;
--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "error_message" text;
--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "parent_generation_id" uuid;
--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "priority" integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "generations" ALTER COLUMN "status" SET DEFAULT 'queued';
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "generations"
    ADD CONSTRAINT "generations_parent_generation_id_generations_id_fk"
    FOREIGN KEY ("parent_generation_id") REFERENCES "public"."generations"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "generations_model_id_idx" ON "generations" ("model_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "generations_user_status_idx" ON "generations" ("user_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "generations_parent_id_idx" ON "generations" ("parent_generation_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "model_presets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "model_id" text NOT NULL,
  "mode" text,
  "name" text NOT NULL,
  "parameters" jsonb NOT NULL,
  "thumbnail_url" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "model_presets"
    ADD CONSTRAINT "model_presets_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "model_presets_user_id_idx" ON "model_presets" ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "model_overrides" (
  "model_id" text PRIMARY KEY NOT NULL,
  "enabled" boolean NOT NULL DEFAULT true,
  "badges" jsonb,
  "priority_override" integer,
  "price_multiplier" numeric(5,3) DEFAULT '1.000',
  "updated_at" timestamp DEFAULT now() NOT NULL
);
