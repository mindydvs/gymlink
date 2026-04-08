import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const videoLikesTable = pgTable("video_likes", {
  videoId: text("video_id").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.videoId, t.userId] }),
]);

export type VideoLike = typeof videoLikesTable.$inferSelect;
