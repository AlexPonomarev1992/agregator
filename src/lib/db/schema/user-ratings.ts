import { pgTable, uuid, integer, timestamp, index } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./users"

export const userRatings = pgTable(
  "user_ratings",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    totalXp: integer("total_xp").default(0).notNull(),
    rank: integer("rank"),
    badgesCount: integer("badges_count").default(0).notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("user_ratings_total_xp_idx").on(table.totalXp),
  ]
)

export const userRatingsRelations = relations(userRatings, ({ one }) => ({
  user: one(users, {
    fields: [userRatings.userId],
    references: [users.id],
  }),
}))

export type SelectUserRating = typeof userRatings.$inferSelect
export type InsertUserRating = typeof userRatings.$inferInsert
