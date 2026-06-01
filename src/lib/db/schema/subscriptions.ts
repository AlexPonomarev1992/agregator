import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./users"

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["active", "cancelled", "expired"],
    }).notNull(),
    plan: text("plan", { enum: ["monthly", "yearly"] }).notNull(),
    startedAt: timestamp("started_at").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    tbankOrderId: text("tbank_order_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("subscriptions_user_id_idx").on(table.userId),
  ]
)

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}))

export type SelectSubscription = typeof subscriptions.$inferSelect
export type InsertSubscription = typeof subscriptions.$inferInsert
