import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  avatar: text("avatar").notNull().default("💪"),
  bio: text("bio").notNull().default(""),
  gym: text("gym").notNull().default(""),
  gymId: text("gym_id"),
  schedule: text("schedule").notNull().default(""),
  interests: text("interests").array().notNull().default([]),
  verified: boolean("verified").notNull().default(false),
  distance: text("distance").notNull().default("0.0 mi"),
  isMe: boolean("is_me").notNull().default(false),
  activeNow: boolean("active_now").notNull().default(false),
  checkedIn: boolean("checked_in").notNull().default(false),
  avatarUrl: text("avatar_url"),
  passwordHash: text("password_hash"),
  hidden: boolean("hidden").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
