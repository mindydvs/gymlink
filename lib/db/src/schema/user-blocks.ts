import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userBlocksTable = pgTable(
  "user_blocks",
  {
    blockerId: text("blocker_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    blockedId: text("blocked_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] })],
);

export type UserBlock = typeof userBlocksTable.$inferSelect;
