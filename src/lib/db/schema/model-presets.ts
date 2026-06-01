import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./users"

export const modelPresets = pgTable(
  "model_presets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    modelId: text("model_id").notNull(),
    mode: text("mode"),
    name: text("name").notNull(),
    parameters: jsonb("parameters")
      .$type<Record<string, unknown>>()
      .notNull(),
    thumbnailUrl: text("thumbnail_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("model_presets_user_id_idx").on(table.userId),
  ]
)

export const modelPresetsRelations = relations(modelPresets, ({ one }) => ({
  user: one(users, {
    fields: [modelPresets.userId],
    references: [users.id],
  }),
}))

export type SelectModelPreset = typeof modelPresets.$inferSelect
export type InsertModelPreset = typeof modelPresets.$inferInsert
