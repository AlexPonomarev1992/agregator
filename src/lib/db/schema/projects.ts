import { pgTable, uuid, text, boolean, timestamp, index } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./users"
import { chatMessages } from "./chat-messages"

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    context: text("context"),
    isArchived: boolean("is_archived").default(false).notNull(),
    modelId: text("model_id"),
    personaId: text("persona_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("projects_user_id_idx").on(table.userId),
  ]
)

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}))

export type SelectProject = typeof projects.$inferSelect
export type InsertProject = typeof projects.$inferInsert
