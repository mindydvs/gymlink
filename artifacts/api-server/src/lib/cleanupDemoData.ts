import { and, eq, inArray } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { logger } from "./logger";

const DEMO_SEED_USER_IDS = [
  "me",
  "user-1",
  "user-2",
  "user-3",
  "user-4",
  "user-5",
  "user-6",
];

export async function cleanupDemoData(): Promise<void> {
  try {
    const updated = await db
      .update(usersTable)
      .set({ hidden: true })
      .where(
        and(
          inArray(usersTable.id, DEMO_SEED_USER_IDS),
          eq(usersTable.hidden, false),
        ),
      )
      .returning({ id: usersTable.id });

    if (updated.length > 0) {
      logger.info(
        { hiddenDemoUsers: updated.length },
        "Hid demo seed profiles",
      );
    }
  } catch (err) {
    logger.error({ err }, "Failed to clean up demo seed profiles");
  }
}
