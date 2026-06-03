CREATE TABLE "generation_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"generation_id" uuid,
	"user_id" uuid NOT NULL,
	"stage" text NOT NULL,
	"error_code" text NOT NULL,
	"error_message" text NOT NULL,
	"raw_response" jsonb,
	"retryable" boolean DEFAULT false NOT NULL,
	"provider_http_status" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generation_errors" ADD CONSTRAINT "generation_errors_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_errors" ADD CONSTRAINT "generation_errors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "generation_errors_generation_id_idx" ON "generation_errors" USING btree ("generation_id");--> statement-breakpoint
CREATE INDEX "generation_errors_user_id_idx" ON "generation_errors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "generation_errors_created_at_idx" ON "generation_errors" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "generation_errors_code_idx" ON "generation_errors" USING btree ("error_code");