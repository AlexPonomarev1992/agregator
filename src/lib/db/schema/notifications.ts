import { pgTable, uuid, text, boolean, timestamp, index } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./users"

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: ["badge", "generation", "rank", "credits", "subscription", "xp", "system"],
    }).notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    iconName: text("icon_name").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    referenceId: uuid("reference_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
    index("notifications_user_unread_idx").on(table.userId, table.isRead),
  ]
)

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}))

export type SelectNotification = typeof notifications.$inferSelect
export type InsertNotification = typeof notifications.$inferInsert
