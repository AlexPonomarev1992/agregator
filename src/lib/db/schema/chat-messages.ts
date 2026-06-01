import { pgTable, uuid, text, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { projects } from "./projects"

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    attachments: jsonb("attachments").$type<
      { id: string; name: string; size: number; type: string; url?: string }[]
    >(),
    isEdited: boolean("is_edited").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("chat_messages_project_id_idx").on(table.projectId),
  ]
)

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  project: one(projects, {
    fields: [chatMessages.projectId],
    references: [projects.id],
  }),
}))

export type SelectChatMessage = typeof chatMessages.$inferSelect
export type InsertChatMessage = typeof chatMessages.$inferInsert
