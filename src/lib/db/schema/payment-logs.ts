import { pgTable, uuid, text, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./users"

export const paymentLogs = pgTable(
  "payment_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orderId: text("order_id").unique().notNull(),
    amount: integer("amount").notNull(), // in kopecks
    status: text("status", {
      enum: ["pending", "confirmed", "cancelled"],
    }).notNull(),
    paymentType: text("payment_type", {
      enum: ["credits", "subscription"],
    }).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("payment_logs_user_id_idx").on(table.userId),
  ]
)

export const paymentLogsRelations = relations(paymentLogs, ({ one }) => ({
  user: one(users, {
    fields: [paymentLogs.userId],
    references: [users.id],
  }),
}))

export type SelectPaymentLog = typeof paymentLogs.$inferSelect
export type InsertPaymentLog = typeof paymentLogs.$inferInsert
