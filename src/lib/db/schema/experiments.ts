import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { userExperiments } from "./user-experiments"

export const experiments = pgTable("experiments", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  xpReward: integer("xp_reward").notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const experimentsRelations = relations(experiments, ({ many }) => ({
  userExperiments: many(userExperiments),
}))

export type SelectExperiment = typeof experiments.$inferSelect
export type InsertExperiment = typeof experiments.$inferInsert
