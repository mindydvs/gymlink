import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notificationsTable = pgTable("notifications", {
  id: text("id").primaryKey(),
  connectionId: text("connection_id").notNull(),
  userId: text("user_id").notNull(), // the recipient
  type: text("type").notNull(), // crush | buddy | advisor | spotter
  fromName: text("from_name").notNull(),
  anonymous: boolean("anonymous").notNull().default(false),
  read: boolean("read").notNull().default(false),
  responded: boolean("responded").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
