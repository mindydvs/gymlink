import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gymsTable = pgTable("gyms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull().default(""),
  city: text("city").notNull().default(""),
  memberCount: integer("member_count").notNull().default(0),
});

export const insertGymSchema = createInsertSchema(gymsTable);
export type InsertGym = z.infer<typeof insertGymSchema>;
export type Gym = typeof gymsTable.$inferSelect;
