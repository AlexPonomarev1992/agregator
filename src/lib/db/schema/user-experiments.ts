import { pgTable, uuid, text, integer, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./users"
import { experiments } from "./experiments"

export const userExperiments = pgTable(
  "user_experiments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    experimentId: uuid("experiment_id")
      .notNull()
      .references(() => experiments.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["started", "completed"] }).notNull(),
    xpEarned: integer("xp_earned").default(0).notNull(),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("user_experiments_user_status_idx").on(table.userId, table.status),
    uniqueIndex("user_experiments_user_experiment_idx").on(table.userId, table.experimentId),
  ]
)

export const userExperimentsRelations = relations(
  userExperiments,
  ({ one }) => ({
    user: one(users, {
      fields: [userExperiments.userId],
      references: [users.id],
    }),
    experiment: one(experiments, {
      fields: [userExperiments.experimentId],
      references: [experiments.id],
    }),
  })
)

export type SelectUserExperiment = typeof userExperiments.$inferSelect
export type InsertUserExperiment = typeof userExperiments.$inferInsert
