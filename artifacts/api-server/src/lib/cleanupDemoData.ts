import { and, eq, inArray, or } from "drizzle-orm";
import {
  db,
  usersTable,
  connectionsTable,
  notificationsTable,
} from "@workspace/db";
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

// One-off test accounts the owner asked to permanently remove from production.
const TEST_ACCOUNT_IDS_TO_DELETE = ["I95FDbtbxN4T"]; // "Mindy2.0"

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

/**
 * Permanently delete one-off test accounts from production. FK-safe: removes
 * referencing connections and notifications first, then the user row.
 * Idempotent — once an account is gone, subsequent runs are no-ops.
 */
export async function deleteTestAccounts(): Promise<void> {
  if (TEST_ACCOUNT_IDS_TO_DELETE.length === 0) return;
  try {
    const ids = TEST_ACCOUNT_IDS_TO_DELETE;

    const conns = await db
      .select({ id: connectionsTable.id })
      .from(connectionsTable)
      .where(
        or(
          inArray(connectionsTable.fromUserId, ids),
          inArray(connectionsTable.toUserId, ids),
        ),
      );
    const connIds = conns.map((c) => c.id);

    if (connIds.length > 0) {
      await db
        .delete(notificationsTable)
        .where(inArray(notificationsTable.connectionId, connIds));
    }
    await db
      .delete(notificationsTable)
      .where(inArray(notificationsTable.userId, ids));
    await db
      .delete(connectionsTable)
      .where(
        or(
          inArray(connectionsTable.fromUserId, ids),
          inArray(connectionsTable.toUserId, ids),
        ),
      );

    const deleted = await db
      .delete(usersTable)
      .where(inArray(usersTable.id, ids))
      .returning({ id: usersTable.id });

    if (deleted.length > 0) {
      logger.info(
        { deletedTestAccounts: deleted.length },
        "Deleted test accounts",
      );
    }
  } catch (err) {
    logger.error({ err }, "Failed to delete test accounts");
  }
}
