import { pgTable, uuid, text, jsonb } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { userBadges } from "./user-badges"

export const badges = pgTable("badges", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").notNull(),
  condition: jsonb("condition").$type<Record<string, unknown>>(),
})

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}))

export type SelectBadge = typeof badges.$inferSelect
export type InsertBadge = typeof badges.$inferInsert
