import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./users"

export const generations = pgTable(
  "generations",
  {
    // --- existing fields (kept for backward compatibility) ---
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: ["video", "photo", "avatar", "mascot"],
    }).notNull(),
    // status is extended below — the old enum is replaced by the new open-text field
    // keeping the column name identical so no rename migration is needed
    status: text("status").notNull().default("queued"),
    prompt: text("prompt").notNull(),
    resultUrl: text("result_url"),
    creditsSpent: integer("credits_spent").notNull(),
    // provider column is now open-text (was enum — drizzle enums are advisory only,
    // so widening to plain text is safe without a data migration)
    provider: text("provider").notNull(),
    providerJobId: text("provider_job_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),

    // --- new fields for universal generation form ---
    modelId: text("model_id").notNull().default(""),
    mode: text("mode"),
    parameters: jsonb("parameters")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    costCredits: integer("cost_credits").notNull().default(0),
    costBreakdown: jsonb("cost_breakdown").$type<{
      base: number
      modifiers: Record<string, number>
    }>(),
    // kie_task_id replaces provider_job_id semantically for kie.ai tasks;
    // provider_job_id is kept above for other providers
    kieTaskId: text("kie_task_id"),
    resultUrls: jsonb("result_urls").$type<string[]>(),
    thumbnailUrl: text("thumbnail_url"),
    durationMs: integer("duration_ms"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    // self-referencing FK — points to the source generation for Extend/Remix flows
    parentGenerationId: uuid("parent_generation_id").references(
      (): AnyPgColumn => generations.id,
      { onDelete: "set null" }
    ),
    // 0 = normal user, 10 = RoyalPass boost
    priority: integer("priority").notNull().default(0),
  },
  (table) => [
    index("generations_user_created_idx").on(table.userId, table.createdAt),
    index("generations_model_id_idx").on(table.modelId),
    index("generations_user_status_idx").on(table.userId, table.status),
    index("generations_parent_id_idx").on(table.parentGenerationId),
  ]
)

export const generationsRelations = relations(generations, ({ one, many }) => ({
  user: one(users, {
    fields: [generations.userId],
    references: [users.id],
  }),
  parentGeneration: one(generations, {
    fields: [generations.parentGenerationId],
    references: [generations.id],
    relationName: "remixChain",
  }),
  childGenerations: many(generations, {
    relationName: "remixChain",
  }),
}))

export type SelectGeneration = typeof generations.$inferSelect
export type InsertGeneration = typeof generations.$inferInsert
