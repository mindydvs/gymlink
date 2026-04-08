import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workoutVideosTable = pgTable("workout_videos", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  objectPath: text("object_path").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWorkoutVideoSchema = createInsertSchema(workoutVideosTable).omit({ createdAt: true });
export type InsertWorkoutVideo = z.infer<typeof insertWorkoutVideoSchema>;
export type WorkoutVideo = typeof workoutVideosTable.$inferSelect;
