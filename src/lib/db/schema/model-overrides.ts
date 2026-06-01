import {
  pgTable,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core"

// Admin-controlled overrides per model slug.
// Primary key is model_id (slug), not uuid — one row per model.
export const modelOverrides = pgTable("model_overrides", {
  modelId: text("model_id").primaryKey(),
  enabled: boolean("enabled").notNull().default(true),
  // Array of badge strings rendered in the model picker UI (e.g. ["new", "hot", "beta"])
  badges: jsonb("badges").$type<string[]>(),
  priorityOverride: integer("priority_override"),
  // Multiplier applied on top of base credit cost; stored as numeric(5,3)
  priceMultiplier: numeric("price_multiplier", { precision: 5, scale: 3 }).default("1.000"),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export type SelectModelOverride = typeof modelOverrides.$inferSelect
export type InsertModelOverride = typeof modelOverrides.$inferInsert
