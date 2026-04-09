import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const connectionsTable = pgTable("connections", {
  id: text("id").primaryKey(),
  fromUserId: text("from_user_id").notNull().references(() => usersTable.id),
  toUserId: text("to_user_id").notNull().references(() => usersTable.id),
  type: text("type").notNull(), // crush | buddy | advisor | spotter
  status: text("status").notNull().default("pending"), // pending | accepted | declined
  anonymous: boolean("anonymous").notNull().default(false),
  mutualNotify: boolean("mutual_notify").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertConnectionSchema = createInsertSchema(connectionsTable).omit({ createdAt: true });
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type Connection = typeof connectionsTable.$inferSelect;
