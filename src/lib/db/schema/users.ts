import { pgTable, uuid, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { sessions } from "./sessions"
import { userCredits } from "./user-credits"
import { creditTransactions } from "./credit-transactions"
import { subscriptions } from "./subscriptions"
import { paymentLogs } from "./payment-logs"
import { generations } from "./generations"
import { projects } from "./projects"
import { userExperiments } from "./user-experiments"
import { xpEvents } from "./xp-events"
import { userRatings } from "./user-ratings"
import { userBadges } from "./user-badges"
import { modelPresets } from "./model-presets"

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  emailVerified: boolean("email_verified").default(false),
  name: text("name"),
  image: text("image"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  socialLinks: jsonb("social_links").$type<
    { platform: string; url: string }[]
  >(),
  isCreator: boolean("is_creator").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const usersRelations = relations(users, ({ one, many }) => ({
  sessions: many(sessions),
  credits: one(userCredits),
  creditTransactions: many(creditTransactions),
  subscriptions: many(subscriptions),
  paymentLogs: many(paymentLogs),
  generations: many(generations),
  projects: many(projects),
  userExperiments: many(userExperiments),
  xpEvents: many(xpEvents),
  rating: one(userRatings),
  badges: many(userBadges),
  modelPresets: many(modelPresets),
}))

export type SelectUser = typeof users.$inferSelect
export type InsertUser = typeof users.$inferInsert
