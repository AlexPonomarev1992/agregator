import { pgTable, uuid, text, jsonb, boolean, timestamp, index } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./users"
import { generations } from "./generations"

/**
 * Детальный журнал ошибок генерации.
 * Пишется при каждом сбое: dispatch → poll → provider → credits.
 * generation_id может быть null если ошибка произошла до создания записи.
 */
export const generationErrors = pgTable(
  "generation_errors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    generationId: uuid("generation_id").references(() => generations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** На каком этапе произошла ошибка */
    stage: text("stage", {
      enum: ["dispatch", "poll", "provider", "validation", "credits", "timeout"],
    }).notNull(),
    /** Машинный код ошибки */
    errorCode: text("error_code").notNull(),
    /** Человекочитаемое сообщение (RU) */
    errorMessage: text("error_message").notNull(),
    /** Сырой ответ от провайдера — для диагностики */
    rawResponse: jsonb("raw_response").$type<Record<string, unknown>>(),
    /** Можно ли повторить попытку автоматически */
    retryable: boolean("retryable").notNull().default(false),
    /** HTTP-статус от провайдера (если есть) */
    providerHttpStatus: text("provider_http_status"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("generation_errors_generation_id_idx").on(t.generationId),
    index("generation_errors_user_id_idx").on(t.userId),
    index("generation_errors_created_at_idx").on(t.createdAt),
    index("generation_errors_code_idx").on(t.errorCode),
  ]
)

export const generationErrorsRelations = relations(generationErrors, ({ one }) => ({
  generation: one(generations, {
    fields: [generationErrors.generationId],
    references: [generations.id],
  }),
  user: one(users, {
    fields: [generationErrors.userId],
    references: [users.id],
  }),
}))

export type SelectGenerationError = typeof generationErrors.$inferSelect
export type InsertGenerationError = typeof generationErrors.$inferInsert
