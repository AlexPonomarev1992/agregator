CREATE TABLE IF NOT EXISTS "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "icon_name" text NOT NULL,
  "is_read" boolean DEFAULT false NOT NULL,
  "reference_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "notifications_user_created_idx" ON "notifications" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "notifications_user_unread_idx" ON "notifications" ("user_id", "is_read");

-- Also add missing indexes from earlier fixes
CREATE UNIQUE INDEX IF NOT EXISTS "user_experiments_user_experiment_idx" ON "user_experiments" ("user_id", "experiment_id");
CREATE INDEX IF NOT EXISTS "payment_logs_user_id_idx" ON "payment_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "subscriptions_user_id_idx" ON "subscriptions" ("user_id");
CREATE INDEX IF NOT EXISTS "projects_user_id_idx" ON "projects" ("user_id");
CREATE INDEX IF NOT EXISTS "chat_messages_project_id_idx" ON "chat_messages" ("project_id");
CREATE INDEX IF NOT EXISTS "user_badges_user_id_idx" ON "user_badges" ("user_id");
