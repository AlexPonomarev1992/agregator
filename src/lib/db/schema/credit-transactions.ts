import { pgTable, uuid, integer, text, timestamp, index } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./users"

export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    type: text("type", { enum: ["purchase", "generation", "bonus"] }).notNull(),
    description: text("description"),
    referenceId: uuid("reference_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("credit_transactions_user_created_idx").on(
      table.userId,
      table.createdAt
    ),
  ]
)

export const creditTransactionsRelations = relations(
  creditTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [creditTransactions.userId],
      references: [users.id],
    }),
  })
)

export type SelectCreditTransaction = typeof creditTransactions.$inferSelect
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert
