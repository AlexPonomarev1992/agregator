import pg from 'pg';
const { Client } = pg;

const SQL = `
-- Add new columns to generations (idempotent)
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "model_id" text NOT NULL DEFAULT '';
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "mode" text;
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "parameters" jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "cost_credits" integer NOT NULL DEFAULT 0;
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "cost_breakdown" jsonb;
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "kie_task_id" text;
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "result_urls" jsonb;
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "thumbnail_url" text;
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "duration_ms" integer;
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "error_code" text;
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "error_message" text;
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "parent_generation_id" uuid;
ALTER TABLE "generations" ADD COLUMN IF NOT EXISTS "priority" integer NOT NULL DEFAULT 0;

-- Update default for status to 'queued'
ALTER TABLE "generations" ALTER COLUMN "status" SET DEFAULT 'queued';

-- Self-referencing FK for Extend/Remix chain
DO $$ BEGIN
  ALTER TABLE "generations"
    ADD CONSTRAINT "generations_parent_generation_id_generations_id_fk"
    FOREIGN KEY ("parent_generation_id") REFERENCES "generations"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "generations_model_id_idx" ON "generations" ("model_id");
CREATE INDEX IF NOT EXISTS "generations_user_status_idx" ON "generations" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "generations_parent_id_idx" ON "generations" ("parent_generation_id");

-- model_presets
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

DO $$ BEGIN
  ALTER TABLE "model_presets"
    ADD CONSTRAINT "model_presets_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "model_presets_user_id_idx" ON "model_presets" ("user_id");

-- model_overrides
CREATE TABLE IF NOT EXISTS "model_overrides" (
  "model_id" text PRIMARY KEY NOT NULL,
  "enabled" boolean NOT NULL DEFAULT true,
  "badges" jsonb,
  "priority_override" integer,
  "price_multiplier" numeric(5,3) DEFAULT '1.000',
  "updated_at" timestamp DEFAULT now() NOT NULL
);
`;

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query('BEGIN');
  await client.query(SQL);
  await client.query('COMMIT');
  console.log('Migration applied successfully.');
} catch (e) {
  await client.query('ROLLBACK');
  console.error('Migration failed:', e.message);
  process.exit(1);
} finally {
  await client.end();
}
